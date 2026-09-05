import type { CheckoutResponse, Territory } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(typeof body.detail === "string" ? body.detail : "Something went wrong");
  }
  return res.json();
}

export function listTerritories(): Promise<Territory[]> {
  return fetch(`${API_BASE}/api/territories`).then((r) => asJson<Territory[]>(r));
}

export function getTerritory(id: string): Promise<Territory> {
  return fetch(`${API_BASE}/api/territories/${id}`).then((r) => asJson<Territory>(r));
}

export function logoUrl(id: string): string {
  return `${API_BASE}/api/territories/${id}/logo`;
}

export interface ClaimFormValues {
  companyName: string;
  tagline: string;
  websiteUrl: string;
  bgColor: string;
  buyerEmail: string;
  logo: File | null;
}

export function startCheckout(territoryId: string, form: ClaimFormValues): Promise<CheckoutResponse> {
  const body = new FormData();
  body.set("company_name", form.companyName);
  body.set("tagline", form.tagline);
  body.set("website_url", form.websiteUrl);
  body.set("bg_color", form.bgColor);
  body.set("buyer_email", form.buyerEmail);
  if (form.logo) body.set("logo", form.logo);

  return fetch(`${API_BASE}/api/territories/${territoryId}/checkout`, {
    method: "POST",
    body,
  }).then((r) => asJson<CheckoutResponse>(r));
}
