import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "db", "uploads");
const TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

/** GET /api/files/[name] — serve uploaded images from db/uploads */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await params;
    // sanitize: allow only simple filenames
    if (!/^[a-zA-Z0-9_-]+\.(png|jpg|jpeg|webp)$/.test(name)) {
      return NextResponse.json({ error: "Invalid file" }, { status: 400 });
    }
    const filePath = path.join(UPLOAD_DIR, name);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    const ext = name.split(".").pop()!.toLowerCase();
    const data = fs.readFileSync(filePath);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": TYPES[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (e) {
    console.error("file serve error", e);
    return NextResponse.json({ error: "Failed to load file" }, { status: 500 });
  }
}
