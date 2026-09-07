/**
 * Seed: Clients + their projects for the homepage "Our Clients" section.
 * Run: bun scripts/seed-clients.ts
 */
import { db } from '../src/lib/db';

type ProjectSeed = { title: string; description: string; image: string; year: number; sortOrder: number };
type ClientSeed = { name: string; logo: string; industry: string; sortOrder: number; projects: ProjectSeed[] };

const CLIENTS: ClientSeed[] = [
  {
    name: "Cafe Mocha",
    logo: "/images/client-cafe-mocha.png",
    industry: "Food & Beverage",
    sortOrder: 1,
    projects: [
      {
        title: "Illuminated Storefront & Brand Sign",
        description:
          "Complete facade branding for Cafe Mocha's flagship branch — a warm backlit logo panel with acrylic channel letters that made the storefront instantly recognizable from across the street. Custom-made in our Lahore workshop and installed overnight with zero disruption to morning service.",
        image: "/images/proj-cafe.png",
        year: 2024,
        sortOrder: 1,
      },
      {
        title: "Digital Menu Boards",
        description:
          "Three 43-inch digital menu boards with cloud content management — prices and offers now update from a phone in seconds. Sleek wall-mounted frames matched to the cafe's wood-and-brass interior.",
        image: "/images/p-menuboard.png",
        year: 2024,
        sortOrder: 2,
      },
    ],
  },
  {
    name: "Al-Shifa Hospital",
    logo: "/images/client-al-shifa-hospital.png",
    industry: "Healthcare",
    sortOrder: 2,
    projects: [
      {
        title: "Hospital Wayfinding System",
        description:
          "A complete indoor wayfinding overhaul — department signs, floor directories and arrow systems across 4 floors. High-contrast, glare-free acrylic panels with Braille-considerate placement so patients and families find their way without asking.",
        image: "/images/proj-hospital.png",
        year: 2023,
        sortOrder: 1,
      },
      {
        title: "Reception 3D Letter Wall",
        description:
          "Soft-glow halo-lit 3D letters behind the main reception counter, fabricated in hospital brand colors with low-heat LED modules for 24/7 operation. The first thing every visitor sees — and remembers.",
        image: "/images/p-acrylic-office.png",
        year: 2023,
        sortOrder: 2,
      },
    ],
  },
  {
    name: "Royal Palace Hotel",
    logo: "/images/client-royal-palace.png",
    industry: "Hospitality",
    sortOrder: 3,
    projects: [
      {
        title: "Hotel Facade & Entrance Signage",
        description:
          "A grand entrance sign with gold-finish stainless steel letters and warm white backlighting, visible from the main boulevard. Includes rooftop hotel branding with safety rigging installed by our certified high-rise crew.",
        image: "/images/proj-hotel.png",
        year: 2024,
        sortOrder: 1,
      },
      {
        title: "Golden Lobby Letters",
        description:
          "Mirror-polished steel letters with a brass tone finish for the lobby feature wall — premium look, zero maintenance. Matched sign module spacing and lighting temperature to the chandelier glow of the interior.",
        image: "/images/p-steel-letters.png",
        year: 2024,
        sortOrder: 2,
      },
    ],
  },
  {
    name: "TechNova Solutions",
    logo: "/images/client-technova.png",
    industry: "Information Technology",
    sortOrder: 4,
    projects: [
      {
        title: "Reception Logo Wall",
        description:
          "A 14-foot illuminated logo wall for TechNova's new head office — backlit logo panel with frosted glass accents and hidden wiring. Delivered with a free 3D mockup before fabrication so the team approved the design in one meeting.",
        image: "/images/proj-office.png",
        year: 2025,
        sortOrder: 1,
      },
      {
        title: "Glass Office Films & Door Signs",
        description:
          "Frosted privacy films with printed branding for 22 meeting-room glass walls, plus brushed-aluminium door signs with room names and numbers. Consistent, modern and installed over one weekend.",
        image: "/images/p-door-glass.png",
        year: 2025,
        sortOrder: 2,
      },
    ],
  },
  {
    name: "Green Valley School",
    logo: "/images/client-green-valley.png",
    industry: "Education",
    sortOrder: 5,
    projects: [
      {
        title: "Campus Wayfinding & Building Signs",
        description:
          "Weather-proof campus signage for a 3-building school — building identifiers, directional signs and safety boards in school colors. UV-stable inks and rust-proof mounts that survive monsoon season year after year.",
        image: "/images/proj-school.png",
        year: 2023,
        sortOrder: 1,
      },
      {
        title: "Edge-Lit Acrylic Name Plates",
        description:
          "LED edge-lit acrylic name plates for 40 classrooms and offices — every teacher's name on a glowing plate with replaceable name inserts, so the school can update them each year without buying new signs.",
        image: "/images/p-acrylic-led-nameplate.png",
        year: 2024,
        sortOrder: 2,
      },
    ],
  },
  {
    name: "MegaMart",
    logo: "/images/client-megamart.png",
    industry: "Retail",
    sortOrder: 6,
    projects: [
      {
        title: "Supermarket Facade Sign",
        description:
          "A 60-foot flex-face facade sign with high-brightness LED illumination — engineered for visibility in full daylight, with energy-saving modules that cut the store's signage power bill by nearly half.",
        image: "/images/proj-mall.png",
        year: 2024,
        sortOrder: 1,
      },
      {
        title: "Aisle & Section Lightboxes",
        description:
          "Snap-frame light boxes for every aisle and department — graphics swap in seconds without tools, so promotional signage never goes stale. Installed across all MegaMart branches in Lahore.",
        image: "/images/p-lightbox.png",
        year: 2024,
        sortOrder: 2,
      },
    ],
  },
  {
    name: "FitZone Gym",
    logo: "/images/client-fitzone.png",
    industry: "Fitness",
    sortOrder: 7,
    projects: [
      {
        title: "Gym Motivation Neon Wall",
        description:
          "A custom LED neon motivation wall for the weights section — flexible neon in the gym's signature orange, built to flex with vibrations instead of shattering like glass neon. The gym's most photographed corner.",
        image: "/images/p-neon-gym.png",
        year: 2025,
        sortOrder: 1,
      },
      {
        title: "Backlit Reception Logo",
        description:
          "A backlit logo panel and glowing OPEN sign for the entrance — 24/7 brightness with a 3-year warranty, so the gym is visible to late-night traffic long after the mall lights dim.",
        image: "/images/p-led-backlit.png",
        year: 2025,
        sortOrder: 2,
      },
    ],
  },
  {
    name: "Spice Route",
    logo: "/images/client-spice-route.png",
    industry: "Food & Beverage",
    sortOrder: 8,
    projects: [
      {
        title: "Restaurant Branding & Signage",
        description:
          "Complete branding package — facade sign, entrance logo and window graphics for a desi-fusion restaurant. Deep red and gold theme carried across every touchpoint, fabricated and installed in 12 days.",
        image: "/images/proj-restaurant.png",
        year: 2025,
        sortOrder: 1,
      },
      {
        title: "Event & Promotion Banners",
        description:
          "Ongoing vinyl banner supply for seasonal promotions and events — full-color weather-proof printing with same-day turnaround, because restaurant marketing never waits.",
        image: "/images/p-banner-vinyl.png",
        year: 2025,
        sortOrder: 2,
      },
    ],
  },
];

async function main() {
  console.log("Seeding clients...");
  const existing = await db.client.count();
  if (existing > 0) {
    console.log(`Clients already seeded (${existing} found) — skipping.`);
    return;
  }

  for (const c of CLIENTS) {
    await db.client.create({
      data: {
        name: c.name,
        logo: c.logo,
        industry: c.industry,
        sortOrder: c.sortOrder,
        projects: {
          create: c.projects.map((p) => ({
            title: p.title,
            description: p.description,
            image: p.image,
            year: p.year,
            sortOrder: p.sortOrder,
          })),
        },
      },
    });
    console.log(`+ ${c.name} (${c.projects.length} projects)`);
  }

  const total = await db.clientProject.count();
  console.log(`Done: ${CLIENTS.length} clients, ${total} projects.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
