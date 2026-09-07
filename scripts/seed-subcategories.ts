/**
 * Seed script — Shop subcategories + product assignment
 * Run: bun scripts/seed-subcategories.ts
 * Idempotent: upserts by slug, safe to re-run.
 */
import { db } from '../src/lib/db';

type SubSeed = { slug: string; name: string; products: string[] };

const SUBS: Record<string, SubSeed[]> = {
  'acrylic-name-plates': [
    { slug: 'led-name-plates', name: 'LED Name Plates', products: ['led-edge-lit-acrylic-name-plate'] },
    { slug: 'desk-name-plates', name: 'Desk Name Plates', products: ['executive-desk-name-plate'] },
    { slug: 'wall-name-signs', name: 'Wall & Family Name Signs', products: ['family-name-wall-sign'] },
  ],
  'led-signs': [
    { slug: 'backlit-panels', name: 'Backlit Logo Panels', products: ['led-backlit-logo-panel'] },
    { slug: 'window-signs', name: 'Window LED Signs', products: ['open-led-window-sign'] },
  ],
  '3d-letters': [
    { slug: 'chrome-letters', name: 'Chrome & Mirror Letters', products: ['3d-chrome-channel-letters'] },
    { slug: 'mini-led-letters', name: 'Mini LED Letters', products: ['mini-3d-led-letters-desk-set'] },
    { slug: 'steel-letters', name: 'Stainless Steel Letters', products: ['stainless-steel-3d-letters'] },
  ],
  'office-signage': [
    { slug: 'reception-signs', name: 'Reception & Logo Walls', products: ['reception-logo-wall'] },
    { slug: 'door-signs', name: 'Door Signs', products: ['brushed-metal-door-sign'] },
    { slug: 'glass-decals', name: 'Glass Decals & Frosting', products: ['frosted-glass-door-decal'] },
    { slug: 'wayfinding', name: 'Wayfinding Systems', products: ['wayfinding-signage-system'] },
  ],
  'digital-signage': [
    { slug: 'video-walls', name: 'LED Video Walls', products: ['indoor-led-video-wall-p3'] },
    { slug: 'menu-boards', name: 'Digital Menu Boards', products: ['digital-menu-board-set'] },
    { slug: 'poster-displays', name: 'Digital Poster Displays', products: ['digital-poster-display-43'] },
  ],
  'retail-signage': [
    { slug: 'snap-frames', name: 'Snap Frames & Light Boxes', products: ['led-snap-light-box-a2'] },
    { slug: 'acp-boards', name: 'ACP Shop Boards', products: ['acp-shop-board-vinyl'] },
    { slug: 'flex-boards', name: 'Flex Face Boards', products: ['flex-face-illuminated-shop-board'] },
  ],
  'banners': [
    { slug: 'vinyl-banners', name: 'Vinyl Banners', products: ['custom-vinyl-banner'] },
    { slug: 'event-banners', name: 'Event & Party Banners', products: ['birthday-party-banner'] },
  ],
  'neon-art': [
    { slug: 'calligraphy-neon', name: 'Islamic Calligraphy Neon', products: ['bismillah-neon-calligraphy'] },
    { slug: 'name-neon', name: 'Name & Couple Neon', products: ['couple-name-neon-heart'] },
    { slug: 'quote-neon', name: 'Quotes & Gym Neon', products: ['gym-motivation-neon-sign'] },
  ],
};

async function main() {
  console.log('Seeding subcategories...');

  let subCount = 0;
  const subIdBySlug: Record<string, string> = {};

  for (const [catSlug, subs] of Object.entries(SUBS)) {
    const cat = await db.category.findUnique({ where: { slug: catSlug } });
    if (!cat) {
      console.warn(`⚠ category "${catSlug}" not found — skipped`);
      continue;
    }
    for (let i = 0; i < subs.length; i++) {
      const s = subs[i];
      const existing = await db.subcategory.findUnique({ where: { slug: s.slug } });
      const row = existing
        ? await db.subcategory.update({
            where: { slug: s.slug },
            data: { name: s.name, categoryId: cat.id, sortOrder: i + 1 },
          })
        : await db.subcategory.create({
            data: { slug: s.slug, name: s.name, categoryId: cat.id, sortOrder: i + 1 },
          });
      subIdBySlug[s.slug] = row.id;
      subCount++;
    }
  }
  console.log(`Subcategories: ${subCount}`);

  // Assign products to their subcategories
  let assigned = 0;
  for (const subs of Object.values(SUBS)) {
    for (const s of subs) {
      for (const pSlug of s.products) {
        const product = await db.product.findUnique({ where: { slug: pSlug } });
        if (!product) {
          console.warn(`⚠ product "${pSlug}" not found — skipped`);
          continue;
        }
        await db.product.update({
          where: { id: product.id },
          data: { subcategoryId: subIdBySlug[s.slug] },
        });
        assigned++;
      }
    }
  }
  console.log(`Products assigned: ${assigned}`);
  console.log('Subcategory seed complete ✔');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
