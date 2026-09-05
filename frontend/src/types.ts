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

export interface ContinentInfo {
  tagline: string;
  fill: string;
  glow: string;
  icon: string;
}

export const CONTINENTS: Record<string, ContinentInfo> = {
  "AI Continent": { tagline: "Build Smarter", fill: "#8fd6a2", glow: "#3fa34d", icon: "🧠" },
  "Developer Continent": { tagline: "Build Faster", fill: "#93c5fd", glow: "#3b82f6", icon: "⌨️" },
  "Marketing Continent": { tagline: "Get Noticed", fill: "#fcd48f", glow: "#e08e1d", icon: "📣" },
  "Creator Continent": { tagline: "Inspire More", fill: "#f4a8b8", glow: "#e0577a", icon: "🎨" },
  "Open Continent": { tagline: "For Everything Else", fill: "#c4b5fd", glow: "#8b5cf6", icon: "🌐" },
};

export const REGION_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(CONTINENTS).map(([name, info]) => [name, info.fill])
);
