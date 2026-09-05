import type { Size } from "./types";

export const SIZE_ORDER: Size[] = ["small", "medium", "large"];

export const SIZE_META: Record<Size, { label: string; slots: number; priceCents: number; depth: number }> = {
  small: { label: "Small", slots: 1, priceCents: 1900, depth: 14 },
  medium: { label: "Medium", slots: 2, priceCents: 4900, depth: 22 },
  large: { label: "Large", slots: 4, priceCents: 9900, depth: 32 },
};

/** Hard ceiling on any single purchase, so a fat-fingered or hostile bid can't create a huge charge. */
export const MAX_BID_CENTS = 5_000_000; // $50,000

/** A takeover must beat the current price by half again — $20 owned means $30 to take it. */
export function minTakeoverCents(currentPriceCents: number): number {
  const raised = Math.ceil((currentPriceCents * 1.5) / 100) * 100; // round up to whole dollars
  return Math.max(raised, currentPriceCents + 100);
}

/**
 * What this tile costs right now at a given size. An empty tile is simply the
 * size's list price; an owned one must clear the takeover floor as well, so
 * upgrading during a takeover never lets somebody pay less than the buyout.
 */
export function priceForCents(
  building: { status: string; current_price_cents: number },
  size: Size
): number {
  const list = SIZE_META[size].priceCents;
  if (building.status !== "owned") return list;
  return Math.max(list, minTakeoverCents(building.current_price_cents));
}

/** On a takeover, the outgoing owner keeps half of the uplift their slot gained. */
export function previousOwnerPayoutCents(oldPriceCents: number, newPriceCents: number): number {
  return Math.max(0, Math.floor((newPriceCents - oldPriceCents) * 0.5));
}

export function nextSizeUp(size: Size): Size | null {
  const i = SIZE_ORDER.indexOf(size);
  return i >= 0 && i < SIZE_ORDER.length - 1 ? SIZE_ORDER[i + 1] : null;
}

export function formatUsd(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}
