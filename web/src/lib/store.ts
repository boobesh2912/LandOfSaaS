/**
 * Data access for the board.
 *
 * Production runs on Supabase. When Supabase env vars are absent (a fresh
 * clone, or a sandbox with no outbound network) the same interface is served
 * from a JSON file under .data/ so the board still runs end to end locally.
 * Both paths implement the same contract, including the conditional update
 * that makes "claim this building" safe against two buyers racing.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import seed from "@/data/buildings.seed.json";
import type { BuildingRow, PendingClaim, Size } from "./types";

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const usingSupabase = Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY);

let client: SupabaseClient | null = null;
function sb(): SupabaseClient {
  if (!client) {
    client = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!, {
      auth: { persistSession: false },
    });
  }
  return client;
}

// ---------------------------------------------------------------- local file

const LOCAL_DIR = path.join(process.cwd(), ".data");
const LOCAL_FILE = path.join(LOCAL_DIR, "buildings.json");

function freshRows(): BuildingRow[] {
  return (seed as { slug: string; name: string; size: string; sort_order: number; locked: boolean }[]).map(
    (s) => ({
      id: crypto.randomUUID(),
      slug: s.slug,
      name: s.name,
      size: s.size as Size,
      sort_order: s.sort_order,
      current_price_cents: 0,
      status: s.locked ? ("locked" as const) : ("available" as const),
      takeover_count: 0,
      owner_name: null,
      owner_url: null,
      owner_color: null,
      owner_logo_url: null,
      owner_email: null,
      owned_at: null,
      pending_name: null,
      pending_url: null,
      pending_color: null,
      pending_logo_url: null,
      pending_email: null,
      pending_price_cents: null,
      pending_size: null,
      hold_expires_at: null,
      dodo_session_id: null,
      dodo_payment_id: null,
    })
  );
}

async function localRead(): Promise<BuildingRow[]> {
  try {
    return JSON.parse(await fs.readFile(LOCAL_FILE, "utf8")) as BuildingRow[];
  } catch {
    const rows = freshRows();
    await localWrite(rows);
    return rows;
  }
}

async function localWrite(rows: BuildingRow[]): Promise<void> {
  await fs.mkdir(LOCAL_DIR, { recursive: true });
  await fs.writeFile(LOCAL_FILE, JSON.stringify(rows, null, 2));
}

// ---------------------------------------------------------------- operations

function clearPending(row: BuildingRow): void {
  row.pending_name = null;
  row.pending_url = null;
  row.pending_color = null;
  row.pending_logo_url = null;
  row.pending_email = null;
  row.pending_price_cents = null;
  row.pending_size = null;
  row.hold_expires_at = null;
  row.dodo_session_id = null;
}

/** A hold that was never paid for goes back on the market. */
export async function releaseExpiredHolds(): Promise<void> {
  const now = new Date().toISOString();
  if (usingSupabase) {
    const { data } = await sb()
      .from("buildings")
      .select("*")
      .eq("status", "pending")
      .lt("hold_expires_at", now);
    for (const row of (data ?? []) as BuildingRow[]) {
      await sb()
        .from("buildings")
        .update({
          status: row.owner_email ? "owned" : "available",
          pending_name: null,
          pending_url: null,
          pending_color: null,
          pending_logo_url: null,
          pending_email: null,
          pending_price_cents: null,
          pending_size: null,
          hold_expires_at: null,
          dodo_session_id: null,
        })
        .eq("id", row.id)
        .eq("status", "pending");
    }
    return;
  }

  const rows = await localRead();
  let changed = false;
  for (const row of rows) {
    if (row.status === "pending" && row.hold_expires_at && row.hold_expires_at < now) {
      row.status = row.owner_email ? "owned" : "available";
      clearPending(row);
      changed = true;
    }
  }
  if (changed) await localWrite(rows);
}

export async function listBuildings(): Promise<BuildingRow[]> {
  await releaseExpiredHolds();
  if (usingSupabase) {
    const { data, error } = await sb().from("buildings").select("*").order("sort_order");
    if (error) throw new Error(error.message);
    return (data ?? []) as BuildingRow[];
  }
  const rows = await localRead();
  return rows.sort((a, b) => a.sort_order - b.sort_order);
}

export async function getBuilding(id: string): Promise<BuildingRow | null> {
  if (usingSupabase) {
    const { data } = await sb().from("buildings").select("*").eq("id", id).maybeSingle();
    return (data as BuildingRow) ?? null;
  }
  return (await localRead()).find((r) => r.id === id) ?? null;
}

/**
 * Move a building from its current state into a pending hold, but only if it
 * is still in the state the caller priced against. A single conditional
 * UPDATE means two people clicking the same slot can't both win it.
 */
export async function placeHold(
  id: string,
  expectedStatus: "available" | "owned",
  claim: PendingClaim,
  holdMinutes: number
): Promise<BuildingRow | null> {
  const holdUntil = new Date(Date.now() + holdMinutes * 60_000).toISOString();
  const patch = {
    status: "pending" as const,
    pending_name: claim.name,
    pending_url: claim.url,
    pending_color: claim.color,
    pending_logo_url: claim.logoUrl,
    pending_email: claim.email,
    pending_price_cents: claim.priceCents,
    pending_size: claim.size,
    hold_expires_at: holdUntil,
  };

  if (usingSupabase) {
    const { data } = await sb()
      .from("buildings")
      .update(patch)
      .eq("id", id)
      .eq("status", expectedStatus)
      .select()
      .maybeSingle();
    return (data as BuildingRow) ?? null;
  }

  const rows = await localRead();
  const row = rows.find((r) => r.id === id);
  if (!row || row.status !== expectedStatus) return null;
  Object.assign(row, patch);
  await localWrite(rows);
  return row;
}

export async function attachSession(id: string, sessionId: string): Promise<void> {
  if (usingSupabase) {
    await sb().from("buildings").update({ dodo_session_id: sessionId }).eq("id", id);
    return;
  }
  const rows = await localRead();
  const row = rows.find((r) => r.id === id);
  if (row) {
    row.dodo_session_id = sessionId;
    await localWrite(rows);
  }
}

/** Undo a hold — used when the payment provider never gave us a checkout URL. */
export async function releaseHold(id: string): Promise<void> {
  if (usingSupabase) {
    const { data } = await sb().from("buildings").select("*").eq("id", id).maybeSingle();
    const row = data as BuildingRow | null;
    if (!row) return;
    await sb()
      .from("buildings")
      .update({
        status: row.owner_email ? "owned" : "available",
        pending_name: null,
        pending_url: null,
        pending_color: null,
        pending_logo_url: null,
        pending_email: null,
        pending_price_cents: null,
        pending_size: null,
        hold_expires_at: null,
        dodo_session_id: null,
      })
      .eq("id", id)
      .eq("status", "pending");
    return;
  }
  const rows = await localRead();
  const row = rows.find((r) => r.id === id);
  if (row && row.status === "pending") {
    row.status = row.owner_email ? "owned" : "available";
    clearPending(row);
    await localWrite(rows);
  }
}

export async function findByPaymentId(paymentId: string): Promise<BuildingRow | null> {
  if (usingSupabase) {
    const { data } = await sb().from("buildings").select("*").eq("dodo_payment_id", paymentId).maybeSingle();
    return (data as BuildingRow) ?? null;
  }
  return (await localRead()).find((r) => r.dodo_payment_id === paymentId) ?? null;
}

export async function findPendingBySession(sessionId: string): Promise<BuildingRow | null> {
  if (usingSupabase) {
    const { data } = await sb()
      .from("buildings")
      .select("*")
      .eq("dodo_session_id", sessionId)
      .eq("status", "pending")
      .maybeSingle();
    return (data as BuildingRow) ?? null;
  }
  return (await localRead()).find((r) => r.dodo_session_id === sessionId && r.status === "pending") ?? null;
}

/**
 * The one place ownership changes hands. Promotes the pending claim to owner,
 * banks the new price, and records what the outgoing owner is owed.
 */
export async function applyPayment(row: BuildingRow, paymentId: string): Promise<BuildingRow> {
  const paid = row.pending_price_cents ?? row.current_price_cents;
  const owed = row.owner_email
    ? Math.max(0, Math.floor((paid - row.current_price_cents) * 0.5))
    : 0;

  const patch = {
    status: "owned" as const,
    owner_name: row.pending_name,
    owner_url: row.pending_url,
    owner_color: row.pending_color,
    owner_logo_url: row.pending_logo_url,
    owner_email: row.pending_email,
    size: row.pending_size ?? row.size,
    current_price_cents: paid,
    takeover_count: row.owner_email ? row.takeover_count + 1 : row.takeover_count,
    owned_at: new Date().toISOString(),
    dodo_payment_id: paymentId,
    pending_name: null,
    pending_url: null,
    pending_color: null,
    pending_logo_url: null,
    pending_email: null,
    pending_price_cents: null,
    pending_size: null,
    hold_expires_at: null,
  };

  const payout =
    row.owner_email && owed > 0
      ? {
          building_id: row.id,
          recipient_email: row.owner_email,
          recipient_name: row.owner_name,
          amount_cents: owed,
          reason: "takeover_uplift",
          status: "pending",
        }
      : null;

  if (usingSupabase) {
    const { data, error } = await sb().from("buildings").update(patch).eq("id", row.id).select().single();
    if (error) throw new Error(error.message);
    if (payout) await sb().from("payouts").insert(payout);
    return data as BuildingRow;
  }

  const rows = await localRead();
  const target = rows.find((r) => r.id === row.id)!;
  Object.assign(target, patch);
  await localWrite(rows);
  return target;
}
