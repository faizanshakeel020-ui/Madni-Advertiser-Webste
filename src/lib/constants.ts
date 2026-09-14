/**
 * Madni Advertiser — site-wide configuration.
 * Update the placeholders below before launch.
 */

export const SITE = {
  name: "Madni Advertiser",
  shortName: "Madni",
  tagline: "Signs That Make Your Business Shine",
  description:
    "Signage & display advertising — design, fabrication and installation across Pakistan.",
  phone: "+92 300 4572300",
  phoneContactName: "Ashfaq Ahmed",
  phoneHref: "tel:+923004572300",
  whatsapp: "923004572300",
  email: "madniad786@gmail.com",
  emailHref: "mailto:madniad786@gmail.com",
  address: "Imtiaz Center, Main Market, Gulberg II, Lahore, Pakistan",
  mapsUrl: "https://www.google.com/maps/place/31%C2%B031'24.8%22N+74%C2%B020'47.9%22E/@31.5235607,74.3440648,17z/data=!3m1!4b1!4m4!3m3!8m2!3d31.5235607!4d74.3466397?hl=en&entry=ttu&g_ep=EgoyMDI2MDkwOS4wIKXMDSoASAFQAw%3D%3D",
  mapsEmbedUrl: "https://www.google.com/maps?q=31.5235607,74.3466397&z=17&output=embed",
  hours: "Mon – Sat: 10:00 AM – 9:00 PM",
  cities: [
    "Lahore",
    "Faisalabad",
    "Islamabad",
    "Rawalpindi",
    "Multan",
    "Gujranwala",
    "Sialkot",
  ],
  stats: {
    years: 12,
    projects: 2500,
    cities: 7,
    clients: 350,
  },
  social: {
    facebook: "https://www.facebook.com/share/19BFHfpMDt/",
    instagram: "https://www.instagram.com/madniadvertiser1999/",
  },
  bank: {
    name: "Habib Bank Limited (HBL)",
    accountTitle: "Madni Advertiser",
    accountNumber: "1234-5678-9012-3456",
    iban: "PK36 HABB 0012 3456 7890 1234",
  },
} as const;

export function whatsappUrl(message?: string) {
  const text = encodeURIComponent(
    message ??
      `Hello Madni Advertiser! I'm interested in your signage services.`
  );
  return `https://wa.me/${SITE.whatsapp}?text=${text}`;
}

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services", menu: "services" },
  { label: "Shop", href: "/shop", menu: "shop" },
  { label: "Portfolio", href: "/portfolio", menu: "portfolio" },
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
] as const;

export const PAYMENT_METHODS = [
  {
    value: "COD",
    label: "Cash on Delivery",
    description: "Pay in cash when your order is delivered.",
  },
  {
    value: "BANK_TRANSFER",
    label: "Bank Transfer",
    description: "Transfer the order total to our bank account and share the receipt.",
  },
] as const;

export const ORDER_STATUSES = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
export const QUOTE_STATUSES = ["NEW", "CONTACTED", "QUOTED", "CLOSED"] as const;
