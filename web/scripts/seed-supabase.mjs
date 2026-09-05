/**
 * Upserts the board's buildings into Supabase from the same seed file the
 * local dev store uses, so the two can't drift.
 *
 * Usage: node scripts/seed-supabase.mjs      (reads .env.local)
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));

// Minimal .env.local reader so seeding needs no extra dependency.
for (const file of [".env.local", ".env"]) {
  try {
    for (const line of readFileSync(path.join(here, "..", file), "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    // file is optional
  }
}

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before seeding.");
  process.exit(1);
}

const seed = JSON.parse(readFileSync(path.join(here, "..", "src", "data", "buildings.seed.json"), "utf8"));
const supabase = createClient(url, key, { auth: { persistSession: false } });

// Only insert plots that don't exist yet. An upsert would happily write
// `status` back over a plot somebody has already paid for, so existing rows are
// left strictly alone — this script is safe to re-run after a launch.
const { data: existing, error: readError } = await supabase.from("buildings").select("slug");
if (readError) {
  console.error("Could not read existing plots:", readError.message);
  process.exit(1);
}

const known = new Set((existing ?? []).map((r) => r.slug));
const missing = seed.filter((b) => !known.has(b.slug));

if (missing.length === 0) {
  console.log(`All ${seed.length} plots already exist. Nothing to do.`);
  process.exit(0);
}

const { error } = await supabase.from("buildings").insert(
  missing.map((b) => ({
    slug: b.slug,
    name: b.name,
    size: b.size,
    sort_order: b.sort_order,
    status: b.locked ? "locked" : "available",
  }))
);

if (error) {
  console.error("Seeding failed:", error.message);
  process.exit(1);
}
console.log(`Inserted ${missing.length} new plots (${known.size} already existed).`);
