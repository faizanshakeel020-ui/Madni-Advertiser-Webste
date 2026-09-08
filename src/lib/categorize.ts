/**
 * Server-side product auto-categorization for the shop.
 * Primary: z-ai-web-dev-sdk LLM picks the best category + subcategory from
 * the live catalog given the product name/description.
 * Fallback: keyword/regex + token-overlap matcher when the LLM is unavailable.
 * Server-only — never import from client components (uses z-ai-web-dev-sdk).
 */
import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";

export type CategorizeResult = {
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  subcategoryId: string | null;
  subcategorySlug: string | null;
  subcategoryName: string | null;
  /** How the pick was made: ai | keyword | default */
  method: string;
};

type CatRow = {
  id: string;
  slug: string;
  name: string;
  subcategories: { id: string; slug: string; name: string }[];
};

async function loadCatalog(): Promise<CatRow[]> {
  return db.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      subcategories: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, slug: true, name: true },
      },
    },
  });
}

function buildResult(cat: CatRow, sub: CatRow["subcategories"][number] | null, method: string): CategorizeResult {
  return {
    categoryId: cat.id,
    categorySlug: cat.slug,
    categoryName: cat.name,
    subcategoryId: sub?.id ?? null,
    subcategorySlug: sub?.slug ?? null,
    subcategoryName: sub?.name ?? null,
    method,
  };
}

// ---------- Keyword fallback ----------

const CATEGORY_KEYWORDS: [RegExp, string][] = [
  [/\bneon\b|calligraph|bismillah|allah|couple\s*name|gym\s*sign|quote\s*sign/i, "neon-art"],
  [/\bvideo\s*wall|\bmenu\s*board|poster\s*display|digital\s*signage|\bled\s*(tv|screen|display)\b/i, "digital-signage"],
  [/\breception|logo\s*wall|door\s*(sign|plate|decal)|\bdecal\b|\bfrost|wayfinding|office\s*sign|directory\s*board/i, "office-signage"],
  [/\bsnap\s*frame|light\s*box|lightbox|\bacp\b|aluminum\s*composite|flex\s*(face|board|banner)|shop\s*board|store\s*front|storefront/i, "retail-signage"],
  [/\bchrome\b|mirror.*letter|channel\s*letter|3d\s*letter|\bsteel\b|stainless|metal\s*letter|mini\s*led/i, "3d-letters"],
  [/\bwindow\s*(sign|decal|sticker)|backlit|back-lit|back\s*light|open\s*sign|led\s*panel|light\s*panel/i, "led-signs"],
  [/\bname\s*plate|nameplate|\bdesk\b.*sign|family\s*name|wall\s*name|house\s*number|door\s*plate|\bacrylic\b/i, "acrylic-name-plates"],
  [/\bbanner\b|\bvinyl\b|birthday|party|event|bunting|standee|roll\s*up/i, "banners"],
];

function tokenize(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 2)
  );
}

/** Best-effort keyword + token-overlap match (no AI). */
function keywordCategorize(text: string, cats: CatRow[]): CategorizeResult | null {
  // 1. explicit keyword patterns → category, then try to refine the sub
  for (const [re, catSlug] of CATEGORY_KEYWORDS) {
    if (re.test(text)) {
      const cat = cats.find((c) => c.slug === catSlug);
      if (!cat) continue;
      const sub = bestSub(text, cat);
      return buildResult(cat, sub, "keyword");
    }
  }
  // 2. token-overlap scoring across the whole catalog
  const tokens = tokenize(text);
  let best: { cat: CatRow; sub: CatRow["subcategories"][number] | null; score: number } | null = null;
  for (const cat of cats) {
    const catTokens = tokenize(`${cat.slug} ${cat.name}`);
    const catScore = [...catTokens].filter((t) => tokens.has(t)).length;
    const sub = bestSub(text, cat);
    const subTokens = sub ? tokenize(`${sub.slug} ${sub.name}`) : new Set<string>();
    const subScore = [...subTokens].filter((t) => tokens.has(t)).length;
    const score = catScore * 2 + subScore * 3;
    if (score > 0 && (!best || score > best.score)) best = { cat, sub, score };
  }
  return best ? buildResult(best.cat, best.sub, "keyword") : null;
}

function bestSub(text: string, cat: CatRow): CatRow["subcategories"][number] | null {
  const tokens = tokenize(text);
  let best: { sub: CatRow["subcategories"][number]; score: number } | null = null;
  for (const sub of cat.subcategories) {
    const st = tokenize(`${sub.slug} ${sub.name}`);
    const score = [...st].filter((t) => tokens.has(t)).length;
    if (score > 0 && (!best || score > best.score)) best = { sub, score };
  }
  return best?.sub ?? null;
}

// ---------- AI categorization ----------

function extractJson(raw: string): { categoryId?: string; subcategoryId?: string | null } | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as { categoryId?: string; subcategoryId?: string | null };
  } catch {
    return null;
  }
}

async function aiCategorize(
  name: string,
  description: string,
  cats: CatRow[]
): Promise<{ cat: CatRow; sub: CatRow["subcategories"][number] | null } | null> {
  const zai = await ZAI.create();
  const catalog = cats.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    subcategories: c.subcategories.map((s) => ({ id: s.id, slug: s.slug, name: s.name })),
  }));
  const system = [
    "You are a product categorization engine for Madni Advertiser, a sign-making and display company in Lahore, Pakistan selling sign products online.",
    "Given a product name and optional description, pick the single best matching category, and if one clearly fits, its subcategory, from the catalog.",
    'Respond ONLY with minified JSON in exactly this format: {"categoryId":"<category id>","subcategoryId":"<subcategory id or null>"}',
    "No markdown, no code fences, no explanations. The subcategoryId MUST belong to the chosen categoryId, otherwise use null.",
  ].join(" ");
  const user = `Product name: ${name}\nDescription: ${description || "(none)"}\n\nCatalog:\n${JSON.stringify(catalog)}`;

  const completion = await zai.chat.completions.create({
    messages: [
      { role: "assistant", content: system },
      { role: "user", content: user },
    ],
    thinking: { type: "disabled" },
  });
  const raw = completion.choices[0]?.message?.content ?? "";
  const parsed = extractJson(raw);
  if (!parsed?.categoryId) return null;
  const cat = cats.find((c) => c.id === parsed.categoryId);
  if (!cat) return null;
  const sub = parsed.subcategoryId ? cat.subcategories.find((s) => s.id === parsed.subcategoryId) ?? null : null;
  return { cat, sub };
}

/** Reject a promise after ms, resolving null instead. */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([p, new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))]);
}

// ---------- Public API ----------

/**
 * Auto-detect the best category + subcategory for a product.
 * LLM first (15s timeout), keyword fallback, then null.
 */
export async function categorizeProduct(
  name: string,
  description?: string
): Promise<CategorizeResult | null> {
  const cleanName = name.trim();
  if (!cleanName) return null;
  const desc = (description ?? "").trim();

  const cats = await loadCatalog();
  if (cats.length === 0) return null;

  // 1. AI
  try {
    const ai = await withTimeout(aiCategorize(cleanName, desc, cats), 15000);
    if (ai) return buildResult(ai.cat, ai.sub, "ai");
  } catch (e) {
    console.error("categorizeProduct: AI failed", e);
  }

  // 2. Keyword fallback
  const kw = keywordCategorize(`${cleanName} ${desc}`, cats);
  if (kw) return kw;

  return null;
}
