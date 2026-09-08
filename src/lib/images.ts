/**
 * Helpers for the JSON-array image columns (Product.images, ClientProject.images).
 * The DB stores e.g. '["/images/a.png", "/api/files/img-x.jpg"]'.
 */

/** Parse a JSON image-array column defensively → clean string[] (never throws). */
export function parseImages(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
    }
  } catch {
    // column holds a legacy/corrupt value → treat as empty
  }
  return [];
}

/** Stringify for storage (deduped, trimmed). */
export function serializeImages(images: unknown): string {
  if (!Array.isArray(images)) return "[]";
  const clean = images
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .map((x) => x.trim());
  return JSON.stringify([...new Set(clean)]);
}
