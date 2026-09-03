import type { PortfolioProject, ServicePillar } from "./types";

/**
 * Static content for service pillars (used by mega menu, home, service pages).
 */
export const SERVICES: ServicePillar[] = [
  {
    slug: "outdoor",
    name: "Outdoor Signage",
    shortName: "Outdoor",
    tagline: "Big, bold and built for the weather",
    description:
      "Make your business impossible to miss. We design, fabricate and install exterior signage that survives Pakistani sun, rain and dust — from glowing channel letters to massive flex face boards. Every outdoor project includes structural engineering, weather-proof materials and professional installation with safety rigging.",
    hero: "/images/service-outdoor.png",
    icon: "building",
    subServices: [
      {
        name: "3D Sign Letters",
        description:
          "Front-lit, backlit (halo) and trimless channel letters in any size — fabricated in-house with acrylic faces and LED modules for a bright, premium look on storefronts and building tops.",
        image: "/images/p-3d-letters.png",
      },
      {
        name: "Flex Face Signs",
        description:
          "The workhorse of Pakistani shop fronts — tensioned flex faces over steel frames with internal lighting. Bright, affordable and quick, in sizes from 5ft to 40ft and beyond.",
        image: "/images/p-shop-flex.png",
      },
      {
        name: "Stainless Steel Letters",
        description:
          "Rust-proof architectural letters in brushed, mirror and titanium finishes. The premium choice for hospitals, universities, plazas and corporate buildings.",
        image: "/images/p-steel-letters.png",
      },
      {
        name: "LED Smart Signs",
        description:
          "Programmable LED boards and smart signs — change your message from your phone. Perfect for promotions, prices, timings and announcements that change often.",
        image: "/images/p-led-open.png",
      },
    ],
    projectTags: ["Restaurant", "Retail", "Hotel", "Building"],
  },
  {
    slug: "indoor",
    name: "Indoor Signage",
    shortName: "Indoor",
    tagline: "Professional interiors, perfectly signed",
    description:
      "First impressions happen indoors. We create reception logo walls, door signage and complete wayfinding systems that guide visitors effortlessly while reinforcing your brand — used by offices, hospitals, hotels and schools across Pakistan.",
    hero: "/images/service-indoor.png",
    icon: "door",
    subServices: [
      {
        name: "Reception Signs",
        description:
          "Backlit logo walls, halo-lit 3D letters and ACP feature walls for your reception — the first thing every visitor sees and photographs.",
        image: "/images/proj-office.png",
      },
      {
        name: "Door Signs",
        description:
          "Room numbers, titles and name plates in metal, acrylic and frosted glass — consistent systems that look sharp across your whole building.",
        image: "/images/p-door-metal.png",
      },
      {
        name: "Wayfinding",
        description:
          "Complete directional systems: floor directories, arrow panels, department signs and accessibility-friendly markings for hospitals and campuses.",
        image: "/images/p-wayfinding.png",
      },
    ],
    projectTags: ["Office", "Healthcare", "Education", "Hotel"],
  },
  {
    slug: "digital",
    name: "Digital Signage",
    shortName: "Digital",
    tagline: "Screens that sell while you sleep",
    description:
      "Replace printed menus and posters with vibrant screens. We supply and install LED walls, digital menu boards and interactive displays with a cloud content manager — update prices, promos and videos in minutes from anywhere.",
    hero: "/images/service-digital.png",
    icon: "monitor",
    subServices: [
      {
        name: "LED Screens",
        description:
          "Indoor and semi-outdoor LED display boards for shows, showrooms and events — bright panels with processors and full installation.",
        image: "/images/p-led-open.png",
      },
      {
        name: "Video Walls",
        description:
          "P3 indoor video walls from 8ft to cinema scale. Front-serviceable cabinets, 1200-nit brightness, content scheduling and on-site support.",
        image: "/images/p-videowall.png",
      },
      {
        name: "Digital Menu Boards",
        description:
          "Restaurant menu screens with Urdu/English templates, daypart scheduling and instant price updates — proven to increase average order value.",
        image: "/images/p-menuboard.png",
      },
      {
        name: "Interactive Screens",
        description:
          "Touch kiosks and wayfinding displays for malls, hospitals and exhibitions — directories, queues and self-service information.",
        image: "/images/p-digital-poster.png",
      },
    ],
    projectTags: ["Restaurant", "Mall", "Corporate"],
  },
  {
    slug: "retail",
    name: "Retail Signage",
    shortName: "Retail",
    tagline: "Storefronts that stop foot traffic",
    description:
      "Your shop sign is your hardest-working salesman. We build acrylic signs, light boxes, ACP boards and complete storefront branding packages that make customers walk in — with fast fabrication and installation across our service cities.",
    hero: "/images/service-retail.png",
    icon: "store",
    subServices: [
      {
        name: "Acrylic Signs",
        description:
          "Laser-cut and engraved acrylic signage — glossy, backlit or edge-lit. Ideal for boutiques, salons, cafes and premium brands.",
        image: "/images/p-led-backlit.png",
      },
      {
        name: "Light Boxes",
        description:
          "Slim snap-frame light boxes with even LED illumination — swap posters in seconds for seasonal promotions and menus.",
        image: "/images/p-lightbox.png",
      },
      {
        name: "Aluminium Metal Signs",
        description:
          "ACP boards and aluminium fabricated signs with weather-proof printing — the durable standard for shop fronts and building fascia.",
        image: "/images/p-acp.png",
      },
    ],
    projectTags: ["Retail", "Mall", "Restaurant", "Cafe"],
  },
  {
    slug: "exhibition",
    name: "Exhibition Stands",
    shortName: "Exhibition",
    tagline: "Stand out at every expo",
    description:
      "Custom exhibition stands, booths and brand activations for trade fairs and corporate events. From single counters to double-storey island booths — design, fabrication, on-site build and teardown handled end-to-end by our project team.",
    hero: "/images/service-exhibition.png",
    icon: "presentation",
    subServices: [
      {
        name: "Custom Booths",
        description:
          "Modular and fully custom exhibition booths with LED walls, product displays and meeting zones — built to your floor plan and brand.",
        image: "/images/service-exhibition.png",
      },
      {
        name: "Brand Activations",
        description:
          "Roadshows, mall activations and event branding — arches, backdrops, counters and photo-op installations that draw crowds.",
        image: "/images/proj-mall.png",
      },
      {
        name: "Event Backdrops",
        description:
          "Conference stages, press walls and branded backdrops with fast turnaround for corporate and community events.",
        image: "/images/p-banner-vinyl.png",
      },
    ],
    projectTags: ["Exhibitions", "Corporate", "Mall"],
  },
];

export function getService(slug: string) {
  return SERVICES.find((s) => s.slug === slug);
}

/**
 * Portfolio projects — filterable gallery.
 */
export const PORTFOLIO: PortfolioProject[] = [
  {
    id: "p1",
    title: "3D Illuminated Restaurant Signage",
    client: "Karahi Khaja Corner",
    city: "Lahore",
    category: "Restaurant",
    image: "/images/proj-restaurant.png",
    description:
      "Complete exterior branding — illuminated 3D logo letters, menu light boxes and glow signage for a busy food street location.",
  },
  {
    id: "p2",
    title: "Boutique Storefront & Glow Boards",
    client: "Noor Fabrics",
    city: "Faisalabad",
    category: "Retail",
    image: "/images/proj-retail.png",
    description:
      "Backlit acrylic storefront signage with brand color glow, visible from across the market.",
  },
  {
    id: "p3",
    title: "Corporate Reception Logo Wall",
    client: "TechVerse Solutions",
    city: "Lahore",
    category: "Office",
    image: "/images/proj-office.png",
    description:
      "Halo-lit 3D logo letters on a feature wall — design, wiring and after-hours installation completed in 6 days.",
  },
  {
    id: "p4",
    title: "Hotel Rooftop Signage",
    client: "Grand Pearl Hotel",
    city: "Islamabad",
    category: "Hotel",
    image: "/images/proj-hotel.png",
    description:
      "2.5ft channel letters on a rooftop parapet with wind-load engineering and crane installation.",
  },
  {
    id: "p5",
    title: "Plaza Building Top Letters",
    client: "Al-Hamd Plaza",
    city: "Rawalpindi",
    category: "Building",
    image: "/images/proj-building.png",
    description:
      "12ft illuminated building identification letters visible from the main highway.",
  },
  {
    id: "p6",
    title: "Cafe Neon & Menu Boards",
    client: "Brew & Bite",
    city: "Lahore",
    category: "Cafe",
    image: "/images/proj-cafe.png",
    description:
      "Warm neon signage with menu boards and wall branding for an artisan cafe interior.",
  },
  {
    id: "p7",
    title: "Hospital Wayfinding System",
    client: "Shifa Care Hospital",
    city: "Multan",
    category: "Healthcare",
    image: "/images/proj-hospital.png",
    description:
      "120+ sign wayfinding system — exterior pylon, floor directories, department signs and color-coded zones.",
  },
  {
    id: "p8",
    title: "School Campus Signage",
    client: "Iqbal Model School",
    city: "Gujranwala",
    category: "Education",
    image: "/images/proj-school.png",
    description:
      "Gate signage, crest letters and complete classroom door sign system for a 40-room campus.",
  },
  {
    id: "p9",
    title: "Mall Storefront Rollout",
    client: "Packages Mall Tenants",
    city: "Lahore",
    category: "Mall",
    image: "/images/proj-mall.png",
    description:
      "Signage packages for 12 mall storefronts built to mall authority specs — light boxes, letters and vinyl graphics.",
  },
  {
    id: "p10",
    title: "Trade Fair Exhibition Stand",
    client: "Sialkot Chamber Expo",
    city: "Sialkot",
    category: "Exhibitions",
    image: "/images/service-exhibition.png",
    description:
      "72 sqm island booth with LED wall, product towers and lounge — built and installed in 48 hours.",
  },
  {
    id: "p11",
    title: "Business Plaza Pylon Sign",
    client: "Civic View Plaza",
    city: "Lahore",
    category: "Building",
    image: "/images/service-outdoor.png",
    description:
      "Double-sided illuminated pylon with tenant panels — structure, fabrication and installation.",
  },
  {
    id: "p12",
    title: "Digital Menu Board Rollout",
    client: "Crispo Fried Chicken",
    city: "Lahore",
    category: "Restaurant",
    image: "/images/p-menuboard.png",
    description:
      "Digital menu boards across 9 branches with centralized content management and daypart pricing.",
  },
];

export const PORTFOLIO_CATEGORIES = [
  "All",
  "Restaurant",
  "Retail",
  "Office",
  "Hotel",
  "Building",
  "Healthcare",
  "Education",
  "Mall",
  "Cafe",
  "Exhibitions",
];
