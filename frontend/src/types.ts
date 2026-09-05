export type TerritoryStatus = "available" | "pending" | "claimed";

export interface Territory {
  id: string;
  name: string;
  region: string;
  path_svg: string;
  centroid_x: number;
  centroid_y: number;
  area_km2: number;
  price_cents: number;
  status: TerritoryStatus;
  company_name: string | null;
  tagline: string | null;
  website_url: string | null;
  bg_color: string | null;
  has_logo: boolean;
}

export interface CheckoutResponse {
  checkout_url: string;
  territory_id: string;
  price_cents: number;
  hold_expires_at: string;
}

export const REGION_COLORS: Record<string, string> = {
  AI: "#7dd3fc",
  Dev: "#a3e635",
  Marketing: "#fca5a5",
  Design: "#c4b5fd",
  Growth: "#fcd34d",
  Community: "#5eead4",
};
