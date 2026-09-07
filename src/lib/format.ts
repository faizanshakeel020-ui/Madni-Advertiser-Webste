import type { ProductType } from "./types";

export function formatPKR(value: number | null | undefined): string {
  if (value === null || value === undefined) return "Custom Pricing";
  return `Rs ${new Intl.NumberFormat("en-PK").format(value)}`;
}

export function formatPriceLabel(
  price: number | null,
  type: ProductType
): string {
  if (price === null || price === undefined) {
    return type === "CUSTOM_ORDER" ? "Custom Pricing" : "Ask for Price";
  }
  return formatPKR(price);
}

export function formatDate(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
