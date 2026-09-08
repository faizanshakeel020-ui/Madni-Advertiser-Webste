import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { randomBytes } from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "db", "uploads");
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_FILES_PER_REQUEST = 10;

function safeExt(name: string): string | null {
  const m = /\.([a-zA-Z0-9]+)$/.exec(name.trim());
  const ext = m ? m[1].toLowerCase() : "";
  return ["png", "jpg", "jpeg", "webp"].includes(ext) ? ext : null;
}

function uniqueName(ext: string): string {
  return `img-${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
}

/**
 * POST /api/upload — multipart form data.
 * - `file`  (single File)   → { url, urls }
 * - `files` (1..10 Files)   → { url: urls[0], urls }
 * Images are stored in db/uploads and served via /api/files/[name].
 */
export async function POST(req: NextRequest) {
  try {
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return NextResponse.json({ error: "Expected a multipart form upload" }, { status: 400 });
    }
    const raw = [...(form.getAll("files") ?? []), ...(form.getAll("file") ?? [])];
    const files = raw.filter((f): f is File => f instanceof File && f.size > 0);

    if (files.length === 0) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }
    if (files.length > MAX_FILES_PER_REQUEST) {
      return NextResponse.json(
        { error: `Too many files — max ${MAX_FILES_PER_REQUEST} per upload` },
        { status: 400 }
      );
    }

    fs.mkdirSync(UPLOAD_DIR, { recursive: true });

    const urls: string[] = [];
    for (const file of files) {
      const ext = safeExt(file.name);
      if (!ext) {
        return NextResponse.json(
          { error: `"${file.name}" is not a PNG, JPG or WebP image` },
          { status: 400 }
        );
      }
      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json(
          { error: `"${file.name}" is larger than 5 MB` },
          { status: 400 }
        );
      }
      const name = uniqueName(ext);
      const bytes = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(path.join(UPLOAD_DIR, name), bytes);
      urls.push(`/api/files/${name}`);
    }

    return NextResponse.json({ url: urls[0], urls }, { status: 201 });
  } catch (e) {
    console.error("upload POST error", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
