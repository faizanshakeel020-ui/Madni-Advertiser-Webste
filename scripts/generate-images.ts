/**
 * Background asset generator for Madni Advertiser website.
 * Generates all product/hero/service/portfolio images into public/images.
 * Run: bun scripts/generate-images.ts
 * - Skips files that already exist
 * - Concurrency 4, retry 3 per image
 */
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.join(process.cwd(), 'public', 'images');

type Img = { name: string; prompt: string; size: string };

const IMAGES: Img[] = [
  // ---------- HERO SLIDES ----------
  { name: 'hero-1', size: '1344x768', prompt: 'Illuminated 3D channel letter signage glowing on a modern glass office building facade at dusk, bold white and orange glowing letters, dramatic evening sky, professional architectural photography, high quality, detailed' },
  { name: 'hero-2', size: '1344x768', prompt: 'Luxury hotel reception lobby with impressive backlit logo wall sign, warm ambient lighting, marble reception desk, elegant interior design photography, high quality, detailed' },
  { name: 'hero-3', size: '1344x768', prompt: 'Large LED video wall display in a modern shopping mall showing vibrant colorful advertisement content, shoppers walking below, professional photography, high quality, detailed' },

  // ---------- SERVICE PILLARS ----------
  { name: 'service-outdoor', size: '1344x768', prompt: 'Modern outdoor illuminated pylon monument sign for a business plaza at dusk, tall double-sided signage, architectural exterior photography, high quality, detailed' },
  { name: 'service-indoor', size: '1344x768', prompt: 'Modern office interior wayfinding signage system, wall mounted directional signs with arrows and room numbers, clean corporate design, professional interior photography, high quality' },
  { name: 'service-digital', size: '1344x768', prompt: 'Digital menu boards and LED display screens in a modern fast food restaurant, vibrant colorful screens above counter, professional interior photography, high quality, detailed' },
  { name: 'service-retail', size: '1344x768', prompt: 'Modern retail storefront with illuminated light box signage and acrylic shop signs at night on shopping street, warm glow, professional night photography, high quality' },
  { name: 'service-exhibition', size: '1344x768', prompt: 'Custom branded exhibition booth stand at a trade show, modern curved design with company logo signage and LED displays, professional event photography, high quality, detailed' },

  // ---------- PRODUCTS ----------
  { name: 'p-acrylic-led-nameplate', size: '1024x1024', prompt: 'Premium acrylic office name plate with warm LED edge lighting mounted on a dark walnut door, elegant engraved text, professional product photography, studio lighting, high quality, detailed' },
  { name: 'p-acrylic-led-nameplate-2', size: '1024x1024', prompt: 'Close-up detail of a glowing edge-lit acrylic name plate with brass standoffs on a wall, warm LED glow, macro product photography, high quality, detailed' },
  { name: 'p-acrylic-office', size: '1024x1024', prompt: 'Modern office desk name plate, brushed silver metal base holding a clear acrylic plate with printed name, professional product photography on clean white background, high quality' },
  { name: 'p-acrylic-home', size: '1024x1024', prompt: 'Elegant home family name sign in glossy black acrylic with gold script lettering on a living room wall, cozy decor, product photography, high quality, detailed' },
  { name: 'p-led-backlit', size: '1024x1024', prompt: 'LED backlit acrylic sign panel glowing warmly on a dark restaurant wall with elegant logo, product photography, dramatic lighting, high quality, detailed' },
  { name: 'p-led-backlit-2', size: '1024x1024', prompt: 'Slim LED backlit light panel displaying colorful artwork glowing evenly, wall mounted, product photography, dark room, high quality, detailed' },
  { name: 'p-led-open', size: '1024x1024', prompt: 'Bright LED OPEN sign with red glowing letters and blue border in a shop window at dusk, retail storefront, product photography, high quality, detailed' },
  { name: 'p-3d-letters', size: '1024x1024', prompt: 'Silver metallic 3D channel letters with hidden LED illumination mounted on a dark charcoal wall, close-up macro photography, dramatic lighting, high quality, detailed' },
  { name: 'p-3d-mini', size: '1024x1024', prompt: 'Set of small golden 3D LED illuminated letters displayed on a wooden desk shelf, glowing warm light, product photography, clean background, high quality, detailed' },
  { name: 'p-steel-letters', size: '1024x1024', prompt: 'Brushed stainless steel 3D letters installed on a modern building facade exterior in daylight, architectural detail photography, high quality, detailed' },
  { name: 'p-door-metal', size: '1024x1024', prompt: 'Brushed aluminum office door sign plate with engraved room number text, modern corporate design, product photography, clean background, high quality, detailed' },
  { name: 'p-door-glass', size: '1024x1024', prompt: 'Frosted glass office door decal with elegant white company logo and conference room text, glass partition wall, professional interior photography, high quality' },
  { name: 'p-wayfinding', size: '1024x1024', prompt: 'Modern hospital wayfinding directional signage system, wall mounted signs with arrows and department names, clean minimal design, professional photography, high quality, detailed' },
  { name: 'p-videowall', size: '1024x1024', prompt: 'Large LED video wall panels displaying colorful content in a modern conference room, professional AV technology photography, high quality, detailed' },
  { name: 'p-menuboard', size: '1024x1024', prompt: 'Digital menu board display screens above a fast food counter showing food items with prices, modern restaurant interior, professional photography, high quality, detailed' },
  { name: 'p-digital-poster', size: '1024x1024', prompt: 'Vertical digital poster display screen on a stand in a shopping mall showing fashion advertisement, sleek modern design, professional photography, high quality, detailed' },
  { name: 'p-lightbox', size: '1024x1024', prompt: 'Slim edge-lit LED light box sign with restaurant logo glowing evenly, wall mounted on brick wall, product photography, high quality, detailed' },
  { name: 'p-acp', size: '1024x1024', prompt: 'Aluminium composite panel sign board with full color vinyl printing for a shop front, daytime street photography, high quality, detailed' },
  { name: 'p-shop-flex', size: '1024x1024', prompt: 'Flex face illuminated sign board on a retail shop front at night, vibrant glowing colors, street photography, high quality, detailed' },
  { name: 'p-banner-vinyl', size: '1024x1024', prompt: 'Large printed vinyl banner with bold typography and graphics installed on a building facade, printing product photography, daytime, high quality, detailed' },
  { name: 'p-banner-birthday', size: '1024x1024', prompt: 'Colorful happy birthday banner with balloons and confetti design on a party wall, celebration decoration product photography, clean background, high quality, detailed' },
  { name: 'p-neon-bismillah', size: '1024x1024', prompt: 'Beautiful Islamic calligraphy Bismillah neon wall art glowing in warm golden light on a dark wall, elegant home decor, product photography, high quality, detailed' },
  { name: 'p-neon-bismillah-2', size: '1024x1024', prompt: 'Elegant Arabic calligraphy neon wall sign in warm white light above a wooden console table in a living room, ambient decor photography, high quality, detailed' },
  { name: 'p-neon-couple', size: '1024x1024', prompt: 'Romantic couple name neon sign with heart shape glowing in pink and warm white on a bedroom wall, cozy decor, product photography, high quality, detailed' },
  { name: 'p-neon-gym', size: '1024x1024', prompt: 'Bold motivational neon fitness sign glowing electric orange on a dark gym wall, energetic decor, product photography, high quality, detailed' },

  // ---------- PORTFOLIO ----------
  { name: 'proj-restaurant', size: '1344x768', prompt: 'Modern restaurant exterior with illuminated 3D logo sign and glowing menu light boxes at night, street photography, high quality, detailed' },
  { name: 'proj-retail', size: '1344x768', prompt: 'Fashion retail shop with elegant illuminated storefront signage, backlit acrylic signs, night street photography, high quality, detailed' },
  { name: 'proj-office', size: '1344x768', prompt: 'Corporate office reception area with impressive backlit logo wall and brushed metal 3D letters, modern interior photography, high quality, detailed' },
  { name: 'proj-hotel', size: '1344x768', prompt: 'Luxury hotel building with rooftop illuminated sign letters at night, dramatic architectural photography, high quality, detailed' },
  { name: 'proj-building', size: '1344x768', prompt: 'Large illuminated building top signage letters against an evening sky, city skyline in background, architectural photography, high quality, detailed' },
  { name: 'proj-cafe', size: '1344x768', prompt: 'Cozy cafe interior with warm neon signs and chalk menu boards on a brick wall, ambient photography, high quality, detailed' },
  { name: 'proj-hospital', size: '1344x768', prompt: 'Modern hospital exterior with clear directional signage system and building identification sign, daytime architectural photography, high quality, detailed' },
  { name: 'proj-school', size: '1344x768', prompt: 'School entrance gate with institutional signage, crest and name letters, daytime photography, high quality, detailed' },
  { name: 'proj-mall', size: '1344x768', prompt: 'Shopping mall storefront row with varied illuminated shop signs at night, vibrant retail environment photography, high quality, detailed' },

  // ---------- ABOUT ----------
  { name: 'about-workshop', size: '1344x768', prompt: 'Professional signage fabrication workshop with CNC router and laser cutting machines, craftsmen working on acrylic letters and LED modules, industrial photography, high quality, detailed' },
  { name: 'about-team', size: '1344x768', prompt: 'Team of signage professionals in safety gear reviewing design plans in a fabrication workshop, industrial photography, high quality, detailed' },
];

async function generateOne(zai: any, img: Img, attempt = 1): Promise<boolean> {
  const outPath = path.join(OUT_DIR, `${img.name}.png`);
  if (fs.existsSync(outPath) && fs.statSync(outPath).size > 10000) {
    console.log(`SKIP ${img.name} (exists)`);
    return true;
  }
  try {
    const res = await zai.images.generations.create({ prompt: img.prompt, size: img.size });
    const b64 = res?.data?.[0]?.base64;
    if (!b64) throw new Error('empty response');
    fs.writeFileSync(outPath, Buffer.from(b64, 'base64'));
    console.log(`OK   ${img.name}`);
    return true;
  } catch (e: any) {
    const msg = String(e?.message || e);
    console.log(`ERR  ${img.name} attempt ${attempt}: ${msg}`);
    // backoff, longer on rate-limit
    const wait = msg.includes('429') ? 15000 * attempt : 3000 * attempt;
    if (attempt < 4) {
      await new Promise((r) => setTimeout(r, wait));
      return generateOne(zai, img, attempt + 1);
    }
    return false;
  }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const zai = await ZAI.create();
  const queue = [...IMAGES];
  const failures: string[] = [];
  let done = 0;

  // sequential to avoid 429 rate limits
  while (queue.length > 0) {
    const img = queue.shift();
    if (!img) break;
    const ok = await generateOne(zai, img);
    if (!ok) failures.push(img.name);
    done++;
    console.log(`progress ${done}/${IMAGES.length}`);
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log('=== DONE ===');
  if (failures.length) {
    console.log('FAILED: ' + failures.join(', '));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
