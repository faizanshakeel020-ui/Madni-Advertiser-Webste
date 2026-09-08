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
  phone: "+92 300 1234567",
  phoneHref: "tel:+923001234567",
  whatsapp: "923001234567",
  email: "info@madniadvertiser.com",
  emailHref: "mailto:info@madniadvertiser.com",
  address: "Main Ferozepur Road, Kot Lakhpat, Lahore, Pakistan",
  hours: "Mon – Sat: 9:00 AM – 7:00 PM",
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
    facebook: "https://facebook.com/madniadvertiser",
    instagram: "https://instagram.com/madniadvertiser",
    linkedin: "https://linkedin.com/company/madniadvertiser",
    youtube: "https://youtube.com/@madniadvertiser",
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
