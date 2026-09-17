import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";

const UPLOAD_DIR = path.join(process.cwd(), "db", "uploads");
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MIME_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

/** POST /api/upload — store admin-uploaded images and return public file URLs. */
export async function POST(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll("files");
    const singleFile = formData.get("file");
    const uploads = files.length > 0 ? files : singleFile ? [singleFile] : [];

    if (uploads.length === 0 || uploads.some((value) => !(value instanceof File))) {
      return NextResponse.json({ error: "No valid image files provided" }, { status: 400 });
    }
    if (uploads.length > 20) {
      return NextResponse.json({ error: "You can upload up to 20 images at once" }, { status: 400 });
    }

    const useBlobStorage = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
    if (process.env.VERCEL && !useBlobStorage) {
      return NextResponse.json(
        { error: "Image storage is not configured. Add BLOB_READ_WRITE_TOKEN in Vercel." },
        { status: 503 }
      );
    }
    if (!useBlobStorage) await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const urls: string[] = [];

    for (const value of uploads) {
      const file = value as File;
      const extension = MIME_EXTENSIONS[file.type];
      if (!extension) {
        return NextResponse.json({ error: "Only PNG, JPG, and WebP images are supported" }, { status: 400 });
      }
      if (file.size === 0 || file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: "Each image must be between 1 byte and 10 MB" }, { status: 400 });
      }

      const filename = `${Date.now()}-${randomUUID()}.${extension}`;
      if (useBlobStorage) {
        const blob = await put(filename, file, {
          access: "public",
          contentType: file.type,
          addRandomSuffix: false,
        });
        urls.push(blob.url);
      } else {
        await fs.writeFile(path.join(UPLOAD_DIR, filename), Buffer.from(await file.arrayBuffer()));
        urls.push(`/api/files/${filename}`);
      }
    }

    return NextResponse.json({ url: urls[0], urls });
  } catch (error) {
    console.error("upload error", error);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}
