/**
 * Seed script for Madni Advertiser
 * Run: bun scripts/seed.ts
 */
import { db } from '../src/lib/db';
import { createHash, randomBytes } from 'crypto';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'madni-admin-secret-2024';

export function hashPassword(username: string, password: string): string {
  return createHash('sha256').update(`${username}:${password}:${ADMIN_SECRET}`).digest('hex');
}

type Spec = { label: string; value: string };
type Option = { label: string; values: string[] };

async function main() {
  console.log('Seeding...');

  // ---------- Admin ----------
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'madni123';
  const existingAdmin = await db.adminUser.findFirst();
  if (!existingAdmin) {
    await db.adminUser.create({
      data: { username: adminUsername, passwordHash: hashPassword(adminUsername, adminPassword) },
    });
    console.log(`Admin created: ${adminUsername} / ${adminPassword}`);
  }

  // ---------- Categories ----------
  const categories: { slug: string; name: string; description: string; image: string; sortOrder: number }[] = [
    { slug: 'acrylic-name-plates', name: 'Acrylic Name Plates', description: 'Elegant edge-lit and classic acrylic name plates for offices & homes', image: '/images/p-acrylic-led-nameplate.png', sortOrder: 1 },
    { slug: 'led-signs', name: 'LED & Illuminated Signs', description: 'Backlit panels, window signs and glowing LED signage', image: '/images/p-led-backlit.png', sortOrder: 2 },
    { slug: '3d-letters', name: '3D Letter Signs', description: 'Channel letters, chrome & steel 3D fabricated letters', image: '/images/p-3d-letters.png', sortOrder: 3 },
    { slug: 'office-signage', name: 'Office Signage', description: 'Reception walls, door signs & wayfinding systems', image: '/images/p-door-metal.png', sortOrder: 4 },
    { slug: 'digital-signage', name: 'Digital Signage', description: 'Video walls, menu boards & digital poster displays', image: '/images/p-videowall.png', sortOrder: 5 },
    { slug: 'retail-signage', name: 'Retail & Shop Boards', description: 'Light boxes, ACP boards and flex face shop signs', image: '/images/p-lightbox.png', sortOrder: 6 },
    { slug: 'banners', name: 'Banners & Prints', description: 'Vinyl banners, event & celebration prints', image: '/images/p-banner-vinyl.png', sortOrder: 7 },
    { slug: 'neon-art', name: 'Neon & Wall Art', description: 'LED neon art for homes, cafes & gyms', image: '/images/p-neon-bismillah.png', sortOrder: 8 },
  ];

  const catMap: Record<string, string> = {};
  for (const c of categories) {
    const existing = await db.category.findUnique({ where: { slug: c.slug } });
    if (existing) {
      await db.category.update({ where: { slug: c.slug }, data: { name: c.name, description: c.description, image: c.image, sortOrder: c.sortOrder } });
      catMap[c.slug] = existing.id;
    } else {
      const created = await db.category.create({ data: c });
      catMap[c.slug] = created.id;
    }
  }
  console.log(`Categories: ${categories.length}`);

  // ---------- Products ----------
  type P = {
    slug: string; name: string; description: string; price: number | null; oldPrice?: number | null;
    type: 'BUY_NOW' | 'CUSTOM_ORDER'; cat: string; images: string[]; specs?: Spec[]; options?: Option[];
    badge?: string | null; stock?: number; featured?: boolean; popularity?: number;
  };

  const products: P[] = [
    {
      slug: 'led-edge-lit-acrylic-name-plate',
      name: 'LED Edge-Lit Acrylic Name Plate',
      description:
        'Our best-selling premium name plate — laser-engraved on 8mm crystal-clear acrylic with warm white LED edge lighting. The name glows softly through the acrylic, creating a floating look on your door or wall. Ideal for offices, clinics and homes. Complete set includes name plate, LED module, adapter and mounting standoffs.',
      price: 3500, oldPrice: 4200, type: 'BUY_NOW', cat: 'acrylic-name-plates',
      images: ['/images/p-acrylic-led-nameplate.png', '/images/p-acrylic-led-nameplate-2.png'],
      specs: [
        { label: 'Material', value: '8mm premium clear acrylic' },
        { label: 'Lighting', value: 'Warm white LED, 12V adapter included' },
        { label: 'Standard Size', value: '12" x 4" (custom sizes available)' },
        { label: 'Finish', value: 'Laser engraved, brass standoffs' },
        { label: 'Warranty', value: '6 months on LED module' },
      ],
      options: [
        { label: 'Size', values: ['Small 10"x3.5"', 'Medium 12"x4"', 'Large 18"x6"'] },
        { label: 'Light Color', values: ['Warm White', 'Cool White', 'Blue', 'Red'] },
      ],
      badge: 'Best Seller', stock: 25, featured: true, popularity: 980,
    },
    {
      slug: 'executive-desk-name-plate',
      name: 'Executive Desk Name Plate (Acrylic + Metal)',
      description:
        'A refined desk name plate combining a brushed metal base with a clear acrylic top plate. Perfect for CEOs, managers, reception desks and hotel front desks. Available with single or dual-side printing and optional title line.',
      price: 2400, type: 'BUY_NOW', cat: 'acrylic-name-plates',
      images: ['/images/p-acrylic-office.png'],
      specs: [
        { label: 'Material', value: 'Clear acrylic + brushed aluminium base' },
        { label: 'Printing', value: 'UV printed, dual side option' },
        { label: 'Standard Size', value: '10" x 2.5" x 3" height' },
      ],
      options: [
        { label: 'Base Finish', values: ['Silver', 'Black', 'Gold'] },
        { label: 'Printing', values: ['Front only', 'Front + Back'] },
      ],
      stock: 40, popularity: 620,
    },
    {
      slug: 'family-name-wall-sign',
      name: 'Family Name Wall Sign (Black + Gold)',
      description:
        'Elegant home décor signage — glossy black acrylic with your family name in gold script lettering, complete with establishment year. A beautiful statement piece for living rooms, entrances and weddings gifts.',
      price: 2600, type: 'BUY_NOW', cat: 'acrylic-name-plates',
      images: ['/images/p-acrylic-home.png'],
      specs: [
        { label: 'Material', value: '5mm glossy black acrylic + gold vinyl' },
        { label: 'Mounting', value: 'Double-sided tape + wall screws included' },
        { label: 'Standard Size', value: '24" x 8"' },
      ],
      options: [
        { label: 'Lettering Color', values: ['Gold', 'Silver', 'White'] },
        { label: 'Size', values: ['18" x 6"', '24" x 8"', '36" x 12"'] },
      ],
      badge: 'New', stock: 30, popularity: 410,
    },
    {
      slug: 'led-backlit-logo-panel',
      name: 'LED Backlit Logo Panel (Custom)',
      description:
        'A complete backlit branding panel for your reception, showroom or shop counter. Your logo is CNC-cut on acrylic and evenly backlit with SMD LED modules, framed in an aluminium profile. Bright, uniform glow with 50,000-hour rated LEDs. Made to order in any size.',
      price: null, type: 'CUSTOM_ORDER', cat: 'led-signs',
      images: ['/images/p-led-backlit.png', '/images/p-led-backlit-2.png'],
      specs: [
        { label: 'Material', value: 'Acrylic face + aluminium frame' },
        { label: 'Lighting', value: 'High-brightness SMD LED modules' },
        { label: 'Sizes', value: 'Made to order (2ft to 20ft)' },
        { label: 'Life', value: '50,000+ hours rated' },
      ],
      options: [
        { label: 'Approx. Size', values: ['Up to 3ft', '3ft - 6ft', '6ft - 12ft', 'Above 12ft'] },
        { label: 'Light Color', values: ['Warm White', 'Cool White', 'RGB (color changing)'] },
      ],
      popularity: 750,
    },
    {
      slug: 'open-led-window-sign',
      name: '"OPEN" LED Window Sign',
      description:
        'The classic shop-window essential — a bright "OPEN" LED sign with a glowing border. Visible from the street even in daylight, with hanging chain and 220V plug included. Low power consumption, instant on/off.',
      price: 4200, type: 'BUY_NOW', cat: 'led-signs',
      images: ['/images/p-led-open.png'],
      specs: [
        { label: 'Size', value: '19" x 10"' },
        { label: 'Lighting', value: 'Red letters + blue border LED' },
        { label: 'Power', value: '220V, 12W — plug & chain included' },
      ],
      badge: 'Popular', stock: 35, featured: true, popularity: 890,
    },
    {
      slug: '3d-chrome-channel-letters',
      name: '3D Chrome Channel Letters (Custom)',
      description:
        'Premium front-lit channel letters fabricated from chrome-finish acrylic with LED illumination behind each letter face. The signature choice for salons, boutiques and brand storefronts. Includes free design mockup, fabrication and installation.',
      price: null, type: 'CUSTOM_ORDER', cat: '3d-letters',
      images: ['/images/p-3d-letters.png'],
      specs: [
        { label: 'Letter Height', value: '8" to 48" (per project)' },
        { label: 'Finish', value: 'Chrome, gold, glossy or matte' },
        { label: 'Illumination', value: 'Front-lit / halo backlit LED' },
      ],
      options: [
        { label: 'Letter Size', values: ['Under 12"', '12" - 24"', '24" - 36"', 'Above 36"'] },
        { label: 'Finish', values: ['Chrome', 'Glossy White', 'Gold', 'Matte Black'] },
      ],
      popularity: 700,
    },
    {
      slug: 'mini-3d-led-letters-desk-set',
      name: 'Mini 3D LED Letters — Desk Set',
      description:
        'A gift-ready set of small 3D LED letters — spell a name, brand or word of your choice in golden glowing letters on your desk or shelf. Each letter is hand-fabricated with warm LED and individual switch. Sold as per-letter sets.',
      price: 8500, type: 'BUY_NOW', cat: '3d-letters',
      images: ['/images/p-3d-mini.png'],
      specs: [
        { label: 'Letter Height', value: '4" per letter' },
        { label: 'Finish', value: 'Golden with warm LED' },
        { label: 'Power', value: 'USB powered' },
      ],
      options: [
        { label: 'Letters Needed', values: ['3 - 5 letters', '6 - 8 letters', '9 - 12 letters'] },
      ],
      badge: 'New', stock: 18, featured: true, popularity: 540,
    },
    {
      slug: 'stainless-steel-3d-letters',
      name: 'Stainless Steel 3D Letters (Building Grade)',
      description:
        'Architectural-grade stainless steel 3D letters for building facades, hospitals and universities. Welded fabrication, rust-proof for outdoor life, with stud-mount installation on any wall. Available in brushed, mirror or titanium finishes.',
      price: null, type: 'CUSTOM_ORDER', cat: '3d-letters',
      images: ['/images/p-steel-letters.png'],
      specs: [
        { label: 'Material', value: '304/316 stainless steel, welded' },
        { label: 'Finishes', value: 'Brushed, mirror, gold-titanium' },
        { label: 'Mounting', value: 'Stud mount with template' },
      ],
      options: [
        { label: 'Letter Height', values: ['Under 12"', '12" - 24"', '24" - 48"', 'Above 48"'] },
        { label: 'Finish', values: ['Brushed', 'Mirror', 'Titanium Gold'] },
      ],
      popularity: 610,
    },
    {
      slug: 'reception-logo-wall',
      name: 'Reception Logo Wall (Complete Package)',
      description:
        'Transform your reception area with a complete branded logo wall — backlit or halo-lit 3D logo letters on ACP or texture panel background, including design, fabrication, wiring and installation. The first thing every visitor sees.',
      price: null, type: 'CUSTOM_ORDER', cat: 'office-signage',
      images: ['/images/proj-office.png'],
      specs: [
        { label: 'Background', value: 'ACP / texture panel / painted' },
        { label: 'Logo', value: '3D acrylic or metal letters' },
        { label: 'Illumination', value: 'Halo backlit or front-lit' },
      ],
      options: [
        { label: 'Wall Size', values: ['Up to 8ft', '8ft - 15ft', 'Above 15ft'] },
        { label: 'Style', values: ['Halo Backlit', 'Front Lit', 'Non-Lit Metal'] },
      ],
      popularity: 830,
    },
    {
      slug: 'brushed-metal-door-sign',
      name: 'Brushed Metal Door Sign',
      description:
        'Clean, professional door signs in brushed aluminium with engraved or UV-printed text. Ideal for offices, hospitals and hotels — include room numbers, titles or names. Sold in packs with mounting tape and screws.',
      price: 1900, type: 'BUY_NOW', cat: 'office-signage',
      images: ['/images/p-door-metal.png'],
      specs: [
        { label: 'Material', value: '1.5mm brushed aluminium' },
        { label: 'Text', value: 'Engraved or printed' },
        { label: 'Standard Size', value: '8" x 3"' },
      ],
      options: [
        { label: 'Pack Size', values: ['Single sign', 'Pack of 5', 'Pack of 10'] },
      ],
      stock: 60, popularity: 480,
    },
    {
      slug: 'frosted-glass-door-decal',
      name: 'Frosted Glass Door Decal',
      description:
        'Premium frosted glass film decals with your logo and room text in crisp white cut vinyl. Adds privacy and branding to glass doors and partitions. Includes site measurement and application service in Lahore; DIY kit for other cities.',
      price: 1400, type: 'BUY_NOW', cat: 'office-signage',
      images: ['/images/p-door-glass.png'],
      specs: [
        { label: 'Material', value: 'Frosted film + white vinyl' },
        { label: 'Size', value: 'Standard glass door (custom cut free)' },
        { label: 'Application', value: 'Free installation in Lahore' },
      ],
      stock: 80, popularity: 390,
    },
    {
      slug: 'wayfinding-signage-system',
      name: 'Wayfinding Signage System',
      description:
        'Complete directional signage systems for hospitals, universities, malls and corporate buildings — from sign audit and planning to fabricated directional panels, floor directories and room signs with a consistent design language.',
      price: null, type: 'CUSTOM_ORDER', cat: 'office-signage',
      images: ['/images/p-wayfinding.png'],
      specs: [
        { label: 'Scope', value: 'Audit, design, fabrication, install' },
        { label: 'Materials', value: 'ACP, acrylic, metal, vinyl' },
        { label: 'Compliance', value: 'Accessibility-friendly options' },
      ],
      options: [
        { label: 'Project Scale', values: ['Under 20 signs', '20 - 50 signs', '50 - 150 signs', 'Above 150 signs'] },
      ],
      popularity: 520,
    },
    {
      slug: 'indoor-led-video-wall-p3',
      name: 'Indoor LED Video Wall (P3)',
      description:
        'High-resolution indoor LED video walls for showrooms, malls, airports and events. P3 pixel pitch, 1200 nits brightness, front-serviceable cabinets with processor, media player and full installation. Panels are rented or sold per project.',
      price: null, type: 'CUSTOM_ORDER', cat: 'digital-signage',
      images: ['/images/p-videowall.png'],
      specs: [
        { label: 'Pixel Pitch', value: 'P3 (3mm) indoor' },
        { label: 'Brightness', value: '1200 nits' },
        { label: 'Includes', value: 'Processor, player, structure, install' },
      ],
      options: [
        { label: 'Approx. Size', values: ['Up to 8x5 ft', '8x5 - 12x7 ft', 'Above 12x7 ft'] },
      ],
      popularity: 660,
    },
    {
      slug: 'digital-menu-board-set',
      name: 'Digital Menu Board (3-Screen Set)',
      description:
        'Restaurant-grade digital menu boards — three 32" displays with a cloud content manager, 200+ menu templates in Urdu/English, scheduled dayparts and instant price changes. Boost sales with appetizing full-screen visuals.',
      price: null, type: 'CUSTOM_ORDER', cat: 'digital-signage',
      images: ['/images/p-menuboard.png'],
      specs: [
        { label: 'Screens', value: '3 x 32" commercial displays' },
        { label: 'Software', value: 'Cloud CMS, Urdu/English support' },
        { label: 'Support', value: '1 year on-site support' },
      ],
      options: [
        { label: 'Screens Needed', values: ['1 screen', '2 screens', '3 screens', '4+ screens'] },
      ],
      popularity: 580,
    },
    {
      slug: 'digital-poster-display-43',
      name: 'Digital Poster Display 43"',
      description:
        'A sleek 43" vertical digital poster display on a floor stand — perfect for mall branding, exhibitions and reception areas. Full-HD screen with USB/cloud playback, auto-on/off scheduling and lockable cabinet.',
      price: 92000, type: 'BUY_NOW', cat: 'digital-signage',
      images: ['/images/p-digital-poster.png'],
      specs: [
        { label: 'Screen', value: '43" Full-HD vertical' },
        { label: 'Playback', value: 'USB + cloud, scheduling' },
        { label: 'Stand', value: 'Floor stand, lockable' },
      ],
      badge: 'New', stock: 8, popularity: 300,
    },
    {
      slug: 'led-snap-light-box-a2',
      name: 'LED Snap Light Box (A2)',
      description:
        'Slim edge-lit light box with snap-frame poster change — swap promotions in seconds without tools. Even, shadow-free illumination for menus, promotions and brand visuals. Wall mounted, vertical or horizontal.',
      price: 5500, type: 'BUY_NOW', cat: 'retail-signage',
      images: ['/images/p-lightbox.png'],
      specs: [
        { label: 'Size', value: 'A2 (16.5" x 23.4")' },
        { label: 'Frame', value: 'Aluminium snap frame' },
        { label: 'Power', value: '12V LED, 220V adapter' },
      ],
      options: [
        { label: 'Poster', values: ['With printed poster', 'Blank (my own poster)'] },
      ],
      stock: 22, popularity: 450,
    },
    {
      slug: 'acp-shop-board-vinyl',
      name: 'ACP Shop Board with Vinyl Print',
      description:
        'The standard for shop fronts — aluminium composite panel boards with full-color weather-proof vinyl printing, channel letters or cut-vinyl text. Complete with frame, lighting option and installation across our service cities.',
      price: null, type: 'CUSTOM_ORDER', cat: 'retail-signage',
      images: ['/images/p-acp.png'],
      specs: [
        { label: 'Panel', value: '3mm ACP (all colors)' },
        { label: 'Print', value: 'Eco-solvent, 3-year outdoor life' },
        { label: 'Install', value: 'Included with frame' },
      ],
      options: [
        { label: 'Board Size', values: ['Under 10ft', '10 - 20ft', '20 - 40ft', 'Above 40ft'] },
        { label: 'Illumination', values: ['Non-lit', 'Front-lit (spotlights)', 'Backlit'] },
      ],
      popularity: 900,
    },
    {
      slug: 'flex-face-illuminated-shop-board',
      name: 'Flex Face Illuminated Shop Board',
      description:
        'Classic flex-face sign boards — a tensioned flex banner face over a steel frame with internal tube lights or LED. Bright, affordable and quick to produce for shops, salons, restaurants and bakeries. Design included.',
      price: null, type: 'CUSTOM_ORDER', cat: 'retail-signage',
      images: ['/images/p-shop-flex.png'],
      specs: [
        { label: 'Face', value: 'Flex 13oz tensioned fabric' },
        { label: 'Frame', value: 'MS steel, powder coated' },
        { label: 'Lighting', value: 'LED modules or tubes' },
      ],
      options: [
        { label: 'Board Size', values: ['Under 10ft', '10 - 20ft', '20 - 40ft', 'Above 40ft'] },
      ],
      popularity: 950,
    },
    {
      slug: 'custom-vinyl-banner',
      name: 'Custom Vinyl Banner (Any Size)',
      description:
        'High-quality 13oz vinyl banners printed in photo quality — for promotions, events, exhibitions and building wraps. Eyelets, ropes and optional stand included. Fast 24-hour turnaround available.',
      price: null, type: 'CUSTOM_ORDER', cat: 'banners',
      images: ['/images/p-banner-vinyl.png'],
      specs: [
        { label: 'Material', value: '13oz matte/gloss vinyl' },
        { label: 'Print', value: 'Photo quality, outdoor rated' },
        { label: 'Finishing', value: 'Eyelets + rope, welding' },
      ],
      options: [
        { label: 'Approx. Size', values: ['Under 3x2 ft', '3x2 - 8x4 ft', '8x4 - 20x6 ft', 'Above 20x6 ft'] },
        { label: 'Finishing', values: ['Eyelets only', 'Eyelets + rope', 'Pole pockets'] },
      ],
      popularity: 720,
    },
    {
      slug: 'birthday-party-banner',
      name: 'Birthday Party Banner (Printed)',
      description:
        'Celebrate in style — full-color printed birthday banners with your name, age and photo, in festive ready-made designs. Printed on premium vinyl with eyelets and ribbon included. Share your photo & text at checkout.',
      price: 1500, type: 'BUY_NOW', cat: 'banners',
      images: ['/images/p-banner-birthday.png'],
      specs: [
        { label: 'Size', value: '6ft x 2.5ft' },
        { label: 'Print', value: 'Photo + text, 3 designs' },
        { label: 'Includes', value: 'Eyelets + hanging ribbon' },
      ],
      options: [
        { label: 'Design', values: ['Balloons', 'Confetti', 'Prince', 'Princess'] },
      ],
      stock: 100, popularity: 610,
    },
    {
      slug: 'bismillah-neon-calligraphy',
      name: '"Bismillah" Neon Calligraphy Art',
      description:
        'A breathtaking piece of Islamic art — "Bismillah-ir-Rahman-ir-Rahim" hand-crafted in LED neon calligraphy, glowing in warm golden light. A centerpiece for living rooms, drawing rooms and offices. Handmade to order.',
      price: 7500, type: 'BUY_NOW', cat: 'neon-art',
      images: ['/images/p-neon-bismillah.png', '/images/p-neon-bismillah-2.png'],
      specs: [
        { label: 'Size', value: '36" x 14"' },
        { label: 'Light', value: 'Warm golden LED neon (flex)' },
        { label: 'Power', value: '220V adapter + hanging chain' },
      ],
      options: [
        { label: 'Light Color', values: ['Warm Gold', 'Ice White', 'Royal Blue'] },
      ],
      badge: 'Best Seller', stock: 15, featured: true, popularity: 930,
    },
    {
      slug: 'couple-name-neon-heart',
      name: 'Couple Name Neon Sign with Heart',
      description:
        'Romantic LED neon sign with two names and a heart — the perfect wedding, anniversary or Valentine gift. Hand-bent neon flex on clear acrylic backing, dimmer included. Available in pink, warm white and more.',
      price: 6900, type: 'BUY_NOW', cat: 'neon-art',
      images: ['/images/p-neon-couple.png'],
      specs: [
        { label: 'Size', value: '24" x 16"' },
        { label: 'Backing', value: 'Clear cut-to-shape acrylic' },
        { label: 'Extras', value: 'Dimmer + hanging kit' },
      ],
      options: [
        { label: 'Color', values: ['Pink', 'Warm White', 'Red', 'Purple'] },
      ],
      badge: 'Popular', stock: 20, popularity: 800,
    },
    {
      slug: 'gym-motivation-neon-sign',
      name: 'Gym Motivation Neon Sign',
      description:
        'High-energy neon signs for gyms and fitness studios — "NO PAIN NO GAIN", "BEAST MODE", or your own motto in electric orange glow. Commercial-grade neon flex built to run all day.',
      price: 6400, type: 'BUY_NOW', cat: 'neon-art',
      images: ['/images/p-neon-gym.png'],
      specs: [
        { label: 'Size', value: '30" x 12"' },
        { label: 'Build', value: 'Commercial-grade neon flex' },
        { label: 'Warranty', value: '1 year' },
      ],
      options: [
        { label: 'Motto', values: ['No Pain No Gain', 'Beast Mode', 'Custom text'] },
      ],
      stock: 12, popularity: 470,
    },
  ];

  for (const p of products) {
    const data = {
      name: p.name,
      description: p.description,
      price: p.price,
      oldPrice: p.oldPrice ?? null,
      type: p.type,
      categoryId: catMap[p.cat],
      images: JSON.stringify(p.images),
      specs: p.specs ? JSON.stringify(p.specs) : null,
      options: p.options ? JSON.stringify(p.options) : null,
      badge: p.badge ?? null,
      stock: p.stock ?? 10,
      featured: p.featured ?? false,
      popularity: p.popularity ?? 100,
    };
    const existing = await db.product.findUnique({ where: { slug: p.slug } });
    if (existing) {
      await db.product.update({ where: { slug: p.slug }, data });
    } else {
      await db.product.create({ data: { slug: p.slug, ...data } });
    }
  }
  console.log(`Products: ${products.length}`);

  const orders = await db.order.count();
  if (orders === 0) {
    await db.order.create({
      data: {
        orderNumber: 'MA-10001',
        customerName: 'Demo Customer',
        phone: '+92 300 0000000',
        address: 'Demo address 123',
        city: 'Lahore',
        items: JSON.stringify([{ id: 'demo', slug: 'led-edge-lit-acrylic-name-plate', name: 'LED Edge-Lit Acrylic Name Plate', image: '/images/p-acrylic-led-nameplate.png', price: 3500, qty: 1 }]),
        subtotal: 3500,
        paymentMethod: 'COD',
        status: 'PENDING',
        notes: 'Demo order for admin panel preview',
      },
    });
    console.log('Demo order created');
  }

  const quotes = await db.quoteRequest.count();
  if (quotes === 0) {
    await db.quoteRequest.create({
      data: {
        reference: 'Q-10001',
        name: 'Demo Client',
        phone: '+92 321 0000000',
        email: 'demo@example.com',
        service: 'Outdoor Signage',
        details: 'Need a flex face board for my shop, about 15 feet wide, with logo and lighting.',
        city: 'Lahore',
        status: 'NEW',
      },
    });
    console.log('Demo quote created');
  }

  console.log('Seed complete ✔');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
