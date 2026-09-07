import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import fs from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "db", "uploads");
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

/** Allowed extensions + their magic-byte signatures (first bytes of the file). */
const FORMATS: { ext: string; mime: string; magic: (b: Buffer) => boolean }[] = [
  {
    ext: "png",
    mime: "image/png",
    magic: (b) => b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  {
    ext: "jpg",
    mime: "image/jpeg",
    magic: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    ext: "jpeg",
    mime: "image/jpeg",
    magic: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    ext: "webp",
    mime: "image/webp",
    magic: (b) => b.length >= 12 && b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP",
  },
];

/**
 * POST /api/upload — image upload (multipart form, field "file").
 * Used by the admin product editor and the quote reference-image form.
 * Returns { url: "/api/files/<name>" }.
 */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Image is too large (max 5MB)" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());

    // Detect the real format from content (magic bytes) — not the filename/type,
    // so renamed files (e.g. a JPEG saved as .png) still upload correctly.
    const format = FORMATS.find((f) => f.magic(bytes));
    if (!format) {
      return NextResponse.json({ error: "Only PNG, JPG or WebP images are allowed" }, { status: 400 });
    }

    // Safe generated filename served by /api/files/[name]
    const name = `img-${Date.now()}-${randomBytes(6).toString("hex")}.${format.ext}`;
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    fs.writeFileSync(path.join(UPLOAD_DIR, name), bytes);

    return NextResponse.json({ url: `/api/files/${name}` }, { status: 201 });
  } catch (e) {
    console.error("upload POST error", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
