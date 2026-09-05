"use client";

import { motion } from "framer-motion";
import { SIZE_META } from "@/lib/pricing";
import type { PublicBuilding } from "@/lib/types";

const BOX_PX: Record<PublicBuilding["size"], number> = { small: 46, medium: 62, large: 82 };

/**
 * One isometric block, drawn as three SVG faces (top / left / right) rather
 * than true CSS 3D — a rounded-corner isometric cube is easy to get right
 * this way and never clips or z-fights the way `rotateX/rotateY` faces can.
 * The classic recipe: a diamond top plus two parallelogram sides sharing its
 * bottom two edges.
 */
export function Building({
  building,
  selected,
  trending,
  onSelect,
}: {
  building: PublicBuilding;
  selected: boolean;
  trending?: boolean;
  onSelect: (b: PublicBuilding) => void;
}) {
  const { status } = building;
  const owned = status === "owned";
  const locked = status === "locked";
  const pending = status === "pending";
  const box = BOX_PX[building.size];

  const brand = building.owner_color ?? "#22c55e";
  const palette = owned
    ? { top: brand, left: `color-mix(in oklab, ${brand} 72%, black)`, right: `color-mix(in oklab, ${brand} 48%, black)` }
    : locked
      ? { top: "#e7ede9", left: "#cfd9d3", right: "#b9c5be" }
      : pending
        ? { top: "#fde9a8", left: "#e8c86f", right: "#d1ae52" }
        : { top: "#bdf0d3", left: "#8fdcb0", right: "#6bc492" };

  return (
    <motion.button
      type="button"
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ width: box, height: box * 1.06 }}
      disabled={locked}
      aria-label={
        locked
          ? `${building.name}, locked`
          : `${building.name}, ${SIZE_META[building.size].label}, ${owned ? `owned by ${building.owner_name}` : "available"}`
      }
      whileHover={locked ? undefined : { y: -6, scale: 1.06 }}
      whileTap={locked ? undefined : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 380, damping: 22 }}
      onClick={() => onSelect(building)}
    >
      {trending && !locked && (
        <span className="absolute -top-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2">
          <span className="absolute inset-0 animate-ping rounded-full bg-amber-400 opacity-75" />
          <span className="absolute inset-0 rounded-full bg-amber-400" />
        </span>
      )}

      <svg
        viewBox="0 0 100 106"
        width="100%"
        height="100%"
        style={{ filter: selected ? "drop-shadow(0 0 0 2px #16a34a) drop-shadow(0 10px 16px rgba(11,26,18,.35))" : "drop-shadow(0 6px 10px rgba(11,26,18,.25))" }}
      >
        <ellipse cx="50" cy="100" rx="30" ry="5" fill="rgba(11,26,18,0.16)" />
        {/* left face */}
        <polygon points="6,28 50,52 50,96 6,72" fill={palette.left} stroke="rgba(11,26,18,0.15)" strokeWidth="1" strokeLinejoin="round" />
        {/* right face */}
        <polygon points="50,52 94,28 94,72 50,96" fill={palette.right} stroke="rgba(11,26,18,0.15)" strokeWidth="1" strokeLinejoin="round" />
        {/* top face */}
        <polygon
          points="50,4 94,28 50,52 6,28"
          fill={palette.top}
          stroke={selected ? "#16a34a" : "rgba(255,255,255,0.55)"}
          strokeWidth={selected ? 3 : 1.5}
          strokeLinejoin="round"
        />

        <foreignObject x="30" y="14" width="40" height="34">
          <div className="flex h-full w-full items-center justify-center">
            {owned && building.owner_logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={building.owner_logo_url} alt="" className="h-6 w-6 rounded-md object-cover shadow" />
            ) : owned ? (
              <span className="font-display text-[11px] font-bold text-white drop-shadow-sm">
                {(building.owner_name ?? "??").slice(0, 2).toUpperCase()}
              </span>
            ) : locked ? (
              <span className="text-sm" aria-hidden="true">🔒</span>
            ) : pending ? (
              <span className="text-sm" aria-hidden="true">⏳</span>
            ) : (
              <span className="font-display text-base font-bold text-brand-700/60">+</span>
            )}
          </div>
        </foreignObject>
      </svg>
    </motion.button>
  );
}
