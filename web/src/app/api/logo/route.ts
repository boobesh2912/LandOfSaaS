import { NextResponse } from "next/server";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { detectImageType, MAX_LOGO_BYTES } from "@/lib/validate";
import { usingSupabase } from "@/lib/store";

export const dynamic = "force-dynamic";

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const file = form?.get("logo");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Attach a logo file" }, { status: 422 });
  }
  if (file.size > MAX_LOGO_BYTES) {
    return NextResponse.json({ error: "Logo must be under 300KB" }, { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const contentType = detectImageType(bytes);
  if (!contentType) {
    return NextResponse.json({ error: "Logo must be a PNG, JPEG, or WebP image" }, { status: 422 });
  }

  const filename = `${crypto.randomUUID()}.${EXT[contentType]}`;

  if (usingSupabase) {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });
    const bucket = process.env.SUPABASE_LOGO_BUCKET ?? "logos";
    const { error } = await supabase.storage.from(bucket).upload(filename, bytes, {
      // We serve this back to every visitor, so the type is the one we detected
      // from the bytes, never the one the browser claimed.
      contentType,
      upsert: false,
    });
    if (error) {
      console.error("Logo upload to Supabase failed", error);
      return NextResponse.json({ error: "Could not store that logo" }, { status: 502 });
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(filename);
    return NextResponse.json({ logoUrl: data.publicUrl });
  }

  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), bytes);
  return NextResponse.json({ logoUrl: `/uploads/${filename}` });
}
