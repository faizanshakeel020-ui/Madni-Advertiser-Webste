/**
 * Server-side AI product description generator for the shop.
 * Uses z-ai-web-dev-sdk LLM to write an SEO-optimized product description
 * (primary keyword first, long-tail location keywords, benefit-led copy,
 * meta title/description + keyword list) that reads like a top-ranking
 * product page. Falls back to a solid deterministic template when the
 * LLM is unavailable so the admin is never blocked.
 * Server-only — never import from client components (uses z-ai-web-dev-sdk).
 */
import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";

export type GeneratedDescription = {
  description: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  wordCount: number;
  /** How the text was produced: ai | template */
  method: string;
};

export type DescribeInput = {
  name: string;
  categoryId?: string | null;
  subcategoryId?: string | null;
  type?: "BUY_NOW" | "CUSTOM_ORDER" | null;
  price?: number | null;
  /** Free-form hints the admin typed (materials, colors, use case…). */
  hints?: string | null;
  /** Increment for a different angle on regenerate. */
  variation?: number;
};

const BRAND = "Madni Advertiser";
const CITY = "Lahore";
const COUNTRY = "Pakistan";

/** Reject a promise after ms, resolving null instead. */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([p, new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))]);
}

function countWords(s: string): number {
  return s.split(/\s+/).filter(Boolean).length;
}

/** Clean LLM prose: strip code fences, headings, bold markers and emojis. */
function cleanProse(raw: string): string {
  let t = raw.trim();
  t = t.replace(/^```[a-z]*\s*/i, "").replace(/```\s*$/i, "");
  t = t.replace(/^#{1,6}\s*/gm, ""); // markdown headings
  t = t.replace(/\*\*(.+?)\*\*/g, "$1"); // bold
  t = t.replace(/__(.+?)__/g, "$1");
  t = t.replace(/^\s*[-*]\s+/gm, "• "); // list markers → bullets
  // strip emoji-ish pictographs
  t = t.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, "");
  // bullets must start on their own line, never glued to a sentence
  t = t.replace(/([^\n])\s+•\s/g, "$1\n• ");
  // collapse 3+ blank lines
  t = t.replace(/\n{3,}/g, "\n\n").trim();
  return t;
}

function clamp(s: string, max: number): string {
  const t = s.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`;
}

// ---------- AI generation ----------

type AiResult = { description: string; metaTitle: string; metaDescription: string; keywords: string[] };

function extractJson(raw: string): Partial<AiResult> | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as Partial<AiResult>;
  } catch {
    return null;
  }
}

async function aiDescribe(
  input: DescribeInput,
  categoryName: string | null,
  subcategoryName: string | null
): Promise<AiResult | null> {
  const zai = await ZAI.create();

  const type = input.type ?? "CUSTOM_ORDER";
  const cta =
    type === "BUY_NOW"
      ? "End with a call to action to order now / add to cart with fast delivery across Pakistan and cash on delivery."
      : "End with a call to action to request a free custom quote (mention free design support and custom sizes).";

  const system = [
    `You are a senior e-commerce SEO copywriter for ${BRAND}, a sign-making, neon and display company in ${CITY}, ${COUNTRY} that sells sign products online.`,
    "Write product descriptions engineered to rank on Google (top-position style).",
    "SEO rules you MUST follow:",
    "1. Put the exact product name (the primary keyword) in the first sentence, within the first 100 characters.",
    "2. Weave in the category and subcategory names as secondary keywords, plus natural long-tail phrases like 'custom ... in Lahore', 'buy ... online in Pakistan', '... for shops, offices and events'.",
    "3. Use each keyword naturally — no keyword stuffing, no repeating the same phrase more than 3 times total.",
    "4. 150-220 words total, in 3 short paragraphs separated by ONE blank line, plus optionally up to 4 short bullet lines starting with '• ' for key features/materials/sizes.",
    "5. Plain text only: no markdown headings, no bold, no links, no emojis, no ALL-CAPS shouting.",
    "6. Benefit-led, specific and confident — mention real-world use cases, materials/finish, durability, and our custom making by hand in Lahore.",
    `7. ${cta}`,
    "8. Also produce a metaTitle (max 60 chars, contains the product name + one strong keyword), a metaDescription (140-160 chars, contains the product name, one location keyword and a call to action), and 6-8 lowercase keywords/search phrases people actually type.",
    "Respond ONLY with minified JSON in exactly this format:",
    '{"description":"...","metaTitle":"...","metaDescription":"...","keywords":["..."]}',
    "No markdown, no code fences, no explanations.",
    input.variation && input.variation > 1
      ? `This is variation #${input.variation} for the same product — use a different opening line and angle than a typical first draft.`
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  const context = [
    `Product name: ${input.name}`,
    `Type: ${type === "BUY_NOW" ? "Buy Now (fixed price, cart checkout)" : "Custom Order (quote-based)"}`,
    categoryName ? `Category: ${categoryName}` : null,
    subcategoryName ? `Subcategory: ${subcategoryName}` : null,
    input.price != null ? `Price: PKR ${input.price.toLocaleString("en-PK")}` : null,
    input.hints ? `Extra details from the shop owner: ${input.hints}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const completion = await zai.chat.completions.create({
    messages: [
      { role: "assistant", content: system },
      { role: "user", content: context },
    ],
    thinking: { type: "disabled" },
  });

  const raw = completion.choices[0]?.message?.content ?? "";
  const parsed = extractJson(raw);
  if (!parsed?.description) return null;

  const description = cleanProse(parsed.description);
  if (countWords(description) < 40) return null; // too thin to be SEO-useful

  const keywords = (parsed.keywords ?? [])
    .map((k) => String(k).toLowerCase().trim())
    .filter(Boolean)
    .slice(0, 8);

  return {
    description,
    metaTitle: clamp(parsed.metaTitle ?? input.name, 60),
    metaDescription: clamp(parsed.metaDescription ?? description, 160),
    keywords,
  };
}

// ---------- Template fallback ----------

function templateDescribe(
  input: DescribeInput,
  categoryName: string | null,
  subcategoryName: string | null
): AiResult {
  const name = input.name.trim();
  const type = input.type ?? "CUSTOM_ORDER";
  const catLine = [categoryName, subcategoryName].filter(Boolean).join(" › ");
  const lower = name.toLowerCase();

  const para1 =
    `${name} from ${BRAND} — expertly handcrafted ${catLine ? `as part of our ${categoryName} range` : "in our workshop"} in ${CITY}. ` +
    `Built with premium materials and a flawless finish, it gives shops, offices and events a bold, professional look that keeps all eyes on your brand.`;

  const para2 =
    `Every piece is made to order, so you can choose the size, colour and finish that fits your space perfectly. ` +
    `Durable, vivid and easy to install, custom ${lower} like this one are our specialty — trusted by hundreds of businesses across ${COUNTRY}.`;

  const bullets = [
    `• Premium-grade materials with a crisp, long-lasting finish`,
    `• Made to order in ${CITY} — custom sizes and colours available`,
    `• Fast nationwide delivery across ${COUNTRY}`,
    `• Free design support from our in-house signage team`,
  ].join("\n");

  const para3 =
    type === "BUY_NOW"
      ? `Order now and get this ${lower} delivered to your doorstep anywhere in ${COUNTRY} — cash on delivery available. Add it to your cart today.`
      : `Request a free quote for your custom ${lower} today. Tell us your size and design idea and our ${CITY} team will send you a fair price with free design support.`;

  const description = [para1, para2, bullets, para3].join("\n\n");

  return {
    description,
    metaTitle: clamp(`${name} — ${categoryName ?? "Custom Signs"} | ${BRAND}`, 60),
    metaDescription: clamp(
      `Order ${name} in ${CITY}, ${COUNTRY}. Custom-made, premium finish${type === "BUY_NOW" ? ", fast delivery" : ", free quote"}. By ${BRAND}.`,
      160
    ),
    keywords: [
      `${lower} in ${COUNTRY.toLowerCase()}`,
      `custom ${lower}`,
      `${lower} ${CITY.toLowerCase()}`,
      `buy ${lower} online`,
      categoryName ? `${categoryName.toLowerCase()} ${CITY.toLowerCase()}` : "signs pakistan",
      subcategoryName ? subcategoryName.toLowerCase() : "custom signage",
    ],
  };
}

// ---------- Public API ----------

/**
 * Generate an SEO-optimized product description.
 * LLM first (30s timeout), deterministic template fallback.
 */
export async function generateProductDescription(input: DescribeInput): Promise<GeneratedDescription> {
  const name = input.name.trim();
  if (!name) throw new Error("Product name is required");

  // Resolve category/subcategory names for keyword context
  let categoryName: string | null = null;
  let subcategoryName: string | null = null;
  if (input.categoryId) {
    const cat = await db.category.findUnique({ where: { id: input.categoryId }, select: { name: true } });
    categoryName = cat?.name ?? null;
  }
  if (input.subcategoryId) {
    const sub = await db.subcategory.findUnique({ where: { id: input.subcategoryId }, select: { name: true } });
    subcategoryName = sub?.name ?? null;
  }

  const hints = (input.hints ?? "").trim().slice(0, 500) || null;
  const cleanInput: DescribeInput = { ...input, name, hints };

  try {
    const ai = await withTimeout(aiDescribe(cleanInput, categoryName, subcategoryName), 30000);
    if (ai) {
      return {
        description: ai.description,
        metaTitle: ai.metaTitle,
        metaDescription: ai.metaDescription,
        keywords: ai.keywords,
        wordCount: countWords(ai.description),
        method: "ai",
      };
    }
  } catch (e) {
    console.error("generateProductDescription: AI failed", e);
  }

  const tpl = templateDescribe(cleanInput, categoryName, subcategoryName);
  return {
    description: tpl.description,
    metaTitle: tpl.metaTitle,
    metaDescription: tpl.metaDescription,
    keywords: tpl.keywords,
    wordCount: countWords(tpl.description),
    method: "template",
  };
}
