/** Input validation for anything that arrives from a browser. */

const HEX = /^#[0-9a-fA-F]{6}$/;

export interface ClaimInput {
  buildingId: string;
  size: "small" | "medium" | "large";
  companyName: string;
  websiteUrl: string;
  brandColor: string;
  email: string;
  bidCents: number;
  logoUrl: string | null;
}

export function parseClaim(body: unknown): { ok: true; value: ClaimInput } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) return { ok: false, error: "Expected a JSON body" };
  const b = body as Record<string, unknown>;

  const buildingId = typeof b.buildingId === "string" ? b.buildingId.trim() : "";
  if (!buildingId) return { ok: false, error: "Pick a building first" };

  const size = b.size;
  if (size !== "small" && size !== "medium" && size !== "large") {
    return { ok: false, error: "Pick a building size" };
  }

  const companyName = typeof b.companyName === "string" ? b.companyName.trim() : "";
  if (companyName.length < 1 || companyName.length > 60) {
    return { ok: false, error: "Company name must be 1-60 characters" };
  }

  const websiteUrl = typeof b.websiteUrl === "string" ? b.websiteUrl.trim() : "";
  if (!/^https?:\/\/.+\..+/.test(websiteUrl) || websiteUrl.length > 300) {
    return { ok: false, error: "Enter a full website URL, starting with https://" };
  }

  const brandColor = typeof b.brandColor === "string" ? b.brandColor.trim() : "";
  if (!HEX.test(brandColor)) return { ok: false, error: "Brand color must be a #rrggbb value" };

  const email = typeof b.email === "string" ? b.email.trim() : "";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 254) {
    return { ok: false, error: "Enter a valid email for your receipt" };
  }

  const bidCents = typeof b.bidCents === "number" ? Math.round(b.bidCents) : NaN;
  if (!Number.isFinite(bidCents) || bidCents <= 0) return { ok: false, error: "Enter a valid amount" };

  const logoUrl =
    typeof b.logoUrl === "string" && b.logoUrl.trim().length > 0 ? b.logoUrl.trim().slice(0, 500) : null;
  if (logoUrl && !/^(https:\/\/|\/uploads\/)/.test(logoUrl)) {
    return { ok: false, error: "Logo must be uploaded through this form" };
  }

  return { ok: true, value: { buildingId, size, companyName, websiteUrl, brandColor, email, bidCents, logoUrl } };
}

/**
 * Trust the bytes, not the filename or the Content-Type header. Only real
 * PNG/JPEG/WebP signatures pass; SVG is rejected outright because it can carry
 * script and we serve these files back to every visitor.
 */
export function detectImageType(bytes: Uint8Array): "image/png" | "image/jpeg" | "image/webp" | null {
  if (bytes.length < 12) return null;
  const isPng =
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  if (isPng) return "image/png";

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";

  const isWebp =
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  if (isWebp) return "image/webp";

  return null;
}

export const MAX_LOGO_BYTES = 300 * 1024;
