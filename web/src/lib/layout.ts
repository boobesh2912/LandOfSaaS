/**
 * Where each of the 30 plots sits in the hero, as percentages of the hero
 * canvas. Organic clusters (left / right / bottom), deliberately keeping the
 * top-center clear for the headline. Index-matched to buildings.seed.json —
 * both are ordered by sort_order, so position N always lands on plot N.
 *
 * Hand-tuned from a seeded scatter rather than randomized at runtime, so
 * server and client always agree on layout (no hydration mismatch) and the
 * board looks the same on every load.
 */
export interface PlotPosition {
  x: number; // percent, left edge of hero canvas
  y: number; // percent, top edge of hero canvas
}

export const BUILDING_POSITIONS: PlotPosition[] = [
  // left cluster
  { x: 10.4, y: 42.7 },
  { x: 18.0, y: 38.2 },
  { x: 15.3, y: 55.2 },
  { x: 4.3, y: 63.4 },
  { x: 3.9, y: 59.2 },
  { x: 4.6, y: 39.3 },
  { x: 12.8, y: 82.0 },
  { x: 5.8, y: 46.9 },
  { x: 17.4, y: 89.0 },
  { x: 16.3, y: 57.0 },
  // right cluster
  { x: 96.5, y: 32.9 },
  { x: 93.7, y: 48.0 },
  { x: 77.3, y: 37.3 },
  { x: 81.1, y: 80.6 },
  { x: 78.2, y: 66.1 },
  { x: 88.7, y: 53.1 },
  { x: 86.6, y: 33.9 },
  { x: 75.4, y: 42.8 },
  { x: 89.6, y: 56.5 },
  { x: 81.2, y: 20.3 },
  // bottom cluster
  { x: 48.1, y: 83.7 },
  { x: 61.8, y: 91.3 },
  { x: 39.8, y: 88.9 },
  { x: 51.0, y: 94.6 },
  { x: 59.2, y: 83.5 },
  { x: 69.2, y: 80.2 },
  { x: 46.7, y: 92.4 },
  { x: 36.1, y: 87.3 },
  { x: 31.6, y: 90.7 },
  { x: 60.6, y: 88.9 },
];

/** Further-back plots (lower on the y axis) sit slightly smaller and duller — cheap depth cue. */
export function depthFor(y: number): { scale: number; opacity: number } {
  const t = Math.min(1, Math.max(0, (y - 20) / 75));
  return { scale: 0.82 + t * 0.22, opacity: 0.82 + t * 0.18 };
}
