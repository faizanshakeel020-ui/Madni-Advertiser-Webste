/**
 * Server-side AI case-study description generator for client projects.
 * Uses z-ai-web-dev-sdk LLM to write a LONG, SEO-optimized project
 * description (350-450 words, case-study narrative: challenge → what we
 * built → materials → installation → results) with primary keyword first,
 * client name + sign-type + location long-tail keywords, meta
 * title/description and a keyword list. Falls back to a long deterministic
 * template so the admin is never blocked.
 * Server-only — never import from client components (uses z-ai-web-dev-sdk).
 */
import ZAI from "z-ai-web-dev-sdk";

export type GeneratedProjectDescription = {
  description: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  wordCount: number;
  /** How the text was produced: ai | template */
  method: string;
};

export type ProjectDescribeInput = {
  clientName: string;
  clientIndustry?: string | null;
  title: string;
  year?: number | null;
  /** Other project titles for the same client (so the AI avoids repeating them). */
  otherProjectTitles?: string[];
  /** Free-form hints the admin typed (materials, size, location…). */
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

async function aiDescribeProject(input: ProjectDescribeInput): Promise<AiResult | null> {
  const zai = await ZAI.create();

  const system = [
    `You are a senior SEO content writer for ${BRAND}, a sign-making, neon and display advertising company in ${CITY}, ${COUNTRY}.`,
    "You write project case-study descriptions for the company website that are engineered to rank on Google.",
    "SEO rules you MUST follow:",
    `1. Open the first sentence with the exact project title AND the client name (${input.clientName}) — both are primary keywords and must appear within the first 120 characters.`,
    `2. Weave in natural long-tail keywords: "${input.clientName} signage", "signage company in ${CITY}", "sign board maker in ${COUNTRY}", the industry (${input.clientIndustry ?? "business"}), and sign types mentioned in the brief (3D signage, LED letters, acrylic, backlit, digital signage, wayfinding…).`,
    "3. Use each keyword naturally — no stuffing, no phrase repeated more than 4 times total.",
    "4. LENGTH: 350-450 words. Write 5-6 paragraphs separated by ONE blank line telling the full project story in this order: (a) what the client needed and why, (b) the design concept and free mockup stage, (c) fabrication — materials, lighting, technique, sizes, (d) installation — timeline, night work, safety, zero disruption, (e) the result and business impact, (f) a closing line inviting readers to get a similar sign.",
    "5. After the paragraphs, add up to 6 short bullet lines starting with '• ' listing deliverables/materials (each on its own line).",
    "6. Plain text only: no markdown headings, no bold, no links, no emojis, no ALL-CAPS shouting.",
    `7. Mention ${BRAND} and ${CITY} naturally 2-3 times, never in every paragraph.`,
    "8. Also produce a metaTitle (max 60 chars, contains project title + client name), a metaDescription (140-160 chars, contains client name, the word signage, a location keyword and a call to action), and 6-8 lowercase keywords/search phrases people actually type.",
    "Respond ONLY with minified JSON in exactly this format:",
    '{"description":"...","metaTitle":"...","metaDescription":"...","keywords":["..."]}',
    "No markdown, no code fences, no explanations.",
    input.variation && input.variation > 1
      ? `This is variation #${input.variation} for the same project — use a different opening line and a different narrative angle than a typical first draft.`
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  const context = [
    `Project title: ${input.title}`,
    `Client: ${input.clientName}`,
    input.clientIndustry ? `Client industry: ${input.clientIndustry}` : null,
    input.year ? `Year delivered: ${input.year}` : null,
    input.otherProjectTitles && input.otherProjectTitles.length > 0
      ? `Other projects for this client (do NOT copy their content): ${input.otherProjectTitles.join("; ")}`
      : null,
    input.hints ? `Extra details from the project manager: ${input.hints}` : null,
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
  if (countWords(description) < 150) return null; // too thin for a long case study

  const keywords = (parsed.keywords ?? [])
    .map((k) => String(k).toLowerCase().trim())
    .filter(Boolean)
    .slice(0, 8);

  return {
    description,
    metaTitle: clamp(parsed.metaTitle ?? `${input.title} — ${input.clientName}`, 60),
    metaDescription: clamp(parsed.metaDescription ?? description, 160),
    keywords,
  };
}

// ---------- Template fallback (also long, ~380 words) ----------

function templateDescribeProject(input: ProjectDescribeInput): AiResult {
  const title = input.title.trim();
  const client = input.clientName.trim();
  const industry = input.clientIndustry?.trim() || "business";
  const year = input.year ?? new Date().getFullYear();
  const lowerTitle = title.toLowerCase().replace(/[.]/g, "");

  const para1 =
    `${title} is a complete signage and branding project delivered by ${BRAND} for ${client}, a leading ${industry.toLowerCase()} ` +
    `brand in ${COUNTRY}, in ${year}. ${client} needed signage that would make their premises impossible to miss — bold, ` +
    `professional and built to stay bright for years — so they turned to our workshop in ${CITY}, the sign maker trusted by ` +
    `thousands of businesses across the country.`;

  const para2 =
    `Every project at ${BRAND} starts with a free design consultation and a 3D mockup, and this one was no different. ` +
    `Our design team studied ${client}'s branding, architecture and street visibility, then presented realistic renders ` +
    `of the ${lowerTitle} placed on their actual building — so the decision-makers could see exactly how the finished ` +
    `work would look, day and night, before a single sheet of material was cut.`;

  const para3 =
    `Fabrication took place entirely in our own ${CITY} workshop. We combined premium-grade materials with branded LED ` +
    `modules and weather-proof finishes so the ${lowerTitle} keeps its colour, glow and shape through rain, dust and ` +
    `the summer heat. Each element was hand-finished, wired with energy-efficient lighting and quality-checked under ` +
    `dark-room conditions before it left the factory floor.`;

  const para4 =
    `Our own installation crew mounted and wired everything — working after hours where needed so ${client}'s daily ` +
    `operations never stopped for a single shift. Structural safety, clean cable routing and water-tight sealing were ` +
    `handled on-site, and the finished ${lowerTitle} was tested and photographed the same night it went live.`;

  const bullets = [
    `• Complete turnkey delivery — design, fabrication, installation and after-sales support`,
    `• Premium materials with branded LED modules and weather-proof finishing`,
    `• Free 3D mockup of the sign on your actual premises before production`,
    `• After-hours installation with zero disruption to business hours`,
    `• Served ${COUNTRY}-wide — ${CITY}, Islamabad, Karachi, Faisalabad and beyond`,
  ].join("\n");

  const para5 =
    `The result: ${client} now owns one of the most recognizable fronts in its area — customers find them faster, ` +
    `photographs of the signage travel on social media, and the brand looks as professional at 10 PM as it does at ` +
    `10 AM. That is the standard ${BRAND} delivers on every project, from single shop signs to complete campus wayfinding.`;

  const para6 =
    `Want the same impact for your business? Send us your logo and wall photo — our ${CITY} team will reply with a ` +
    `free quote and a 3D design mockup within hours.`;

  const description = [para1, para2, para3, para4, bullets, para5, para6].join("\n\n");

  return {
    description,
    metaTitle: clamp(`${title} — ${client} | ${BRAND}`, 60),
    metaDescription: clamp(
      `${client} ${industry.toLowerCase()} signage project by ${BRAND} — custom designed, fabricated and installed in ${CITY}, ${COUNTRY}. Get a free quote.`,
      160
    ),
    keywords: [
      `${client.toLowerCase()} signage`,
      `${industry.toLowerCase()} signage ${CITY.toLowerCase()}`,
      `signage company in ${CITY.toLowerCase()}`,
      `sign board maker ${COUNTRY.toLowerCase()}`,
      `${lowerTitle.slice(0, 40)}`,
      "custom signs pakistan",
    ],
  };
}

// ---------- Public API ----------

/**
 * Generate a LONG, SEO-optimized client-project case-study description.
 * LLM first (60s timeout), long template fallback.
 */
export async function generateProjectDescription(
  input: ProjectDescribeInput
): Promise<GeneratedProjectDescription> {
  const title = input.title.trim();
  const clientName = input.clientName.trim();
  if (!title) throw new Error("Project title is required");
  if (!clientName) throw new Error("Client name is required");

  const hints = (input.hints ?? "").trim().slice(0, 500) || null;
  const cleanInput: ProjectDescribeInput = { ...input, title, clientName, hints };

  try {
    const ai = await withTimeout(aiDescribeProject(cleanInput), 60000);
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
    console.error("generateProjectDescription: AI failed", e);
  }

  const tpl = templateDescribeProject(cleanInput);
  return {
    description: tpl.description,
    metaTitle: tpl.metaTitle,
    metaDescription: tpl.metaDescription,
    keywords: tpl.keywords,
    wordCount: countWords(tpl.description),
    method: "template",
  };
}
