export type Size = "small" | "medium" | "large";
export type BuildingStatus = "available" | "pending" | "owned" | "locked";

/** What the browser is allowed to see. Emails and pending claims never leave the server. */
export interface PublicBuilding {
  id: string;
  slug: string;
  name: string;
  size: Size;
  sort_order: number;
  current_price_cents: number;
  status: BuildingStatus;
  takeover_count: number;
  owner_name: string | null;
  owner_url: string | null;
  owner_color: string | null;
  owner_logo_url: string | null;
  owned_at: string | null;
}

/** The full row, server-side only. */
export interface BuildingRow extends PublicBuilding {
  owner_email: string | null;
  pending_name: string | null;
  pending_url: string | null;
  pending_color: string | null;
  pending_logo_url: string | null;
  pending_email: string | null;
  pending_price_cents: number | null;
  pending_size: Size | null;
  hold_expires_at: string | null;
  dodo_session_id: string | null;
  dodo_payment_id: string | null;
}

export interface PendingClaim {
  name: string;
  url: string;
  color: string;
  email: string;
  logoUrl: string | null;
  priceCents: number;
  size: Size;
}

export function toPublic(row: BuildingRow): PublicBuilding {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    size: row.size,
    sort_order: row.sort_order,
    current_price_cents: row.current_price_cents,
    status: row.status,
    takeover_count: row.takeover_count,
    // A pending hold is somebody mid-checkout: their branding stays private
    // until a verified payment lands, so browsing the board can't leak it.
    owner_name: row.status === "owned" ? row.owner_name : null,
    owner_url: row.status === "owned" ? row.owner_url : null,
    owner_color: row.status === "owned" ? row.owner_color : null,
    owner_logo_url: row.status === "owned" ? row.owner_logo_url : null,
    owned_at: row.status === "owned" ? row.owned_at : null,
  };
}
