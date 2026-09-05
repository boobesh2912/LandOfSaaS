import { useMemo, useState } from "react";
import { logoUrl } from "../api";
import { CONTINENTS, REGION_COLORS, type Territory } from "../types";
import { Boat, Compass, Lighthouse, Tree, Whale } from "./Decor";

const WIDTH = 1200;
const HEIGHT = 720;

// Mirrors app/map_generator.py's CONTINENTS positions exactly, so the glow
// and label for each continent line up with the districts the backend
// actually carved there. Keep these two in sync if either changes.
const CONTINENT_LAYOUT: Record<string, { cx: number; cy: number; w: number; h: number }> = {
  "AI Continent": { cx: 290, cy: 210, w: 300, h: 260 },
  "Developer Continent": { cx: 910, cy: 210, w: 300, h: 260 },
  "Marketing Continent": { cx: 230, cy: 520, w: 280, h: 230 },
  "Creator Continent": { cx: 970, cy: 520, w: 280, h: 230 },
  "Open Continent": { cx: 600, cy: 620, w: 340, h: 190 },
};

const OCEAN_PROPS: { Icon: typeof Boat; x: number; y: number; scale?: number }[] = [
  { Icon: Compass, x: WIDTH - 55, y: 55, scale: 1 },
  { Icon: Boat, x: 600, y: 130, scale: 1.1 },
  { Icon: Boat, x: 60, y: 350, scale: 0.9 },
  { Icon: Whale, x: 1100, y: 380 },
  { Icon: Lighthouse, x: 1080, y: 640, scale: 1.1 },
];

interface Props {
  territories: Territory[];
  selectedId: string | null;
  onSelect: (t: Territory) => void;
  matchIds?: Set<string> | null;
}

export function WorldMap({ territories, selectedId, onSelect, matchIds }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const continents = useMemo(() => Object.keys(CONTINENT_LAYOUT), []);

  return (
    <svg
      viewBox={`-50 -50 ${WIDTH + 100} ${HEIGHT + 100}`}
      className="w-full"
      role="img"
      aria-label="Interactive map of five claimable continents"
    >
      <defs>
        <linearGradient id="ocean" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#bfe7ee" />
          <stop offset="100%" stopColor="#7ec2d1" />
        </linearGradient>
        <filter id="continent-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
        <pattern id="reserved-hatch" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="#d8d3c4" />
          <line x1="0" y1="0" x2="0" y2="8" stroke="#b9b19a" strokeWidth="4" />
        </pattern>
      </defs>

      <rect x={-50} y={-50} width={WIDTH + 100} height={HEIGHT + 100} fill="url(#ocean)" />

      {OCEAN_PROPS.map(({ Icon, x, y, scale }, i) => (
        <g key={i} className="pointer-events-none opacity-90 animate-bob" style={{ animationDelay: `${i * 0.6}s` }}>
          <Icon x={x} y={y} scale={scale} />
        </g>
      ))}

      {continents.map((name) => {
        const layout = CONTINENT_LAYOUT[name];
        const info = CONTINENTS[name];
        return (
          <ellipse
            key={name}
            cx={layout.cx}
            cy={layout.cy}
            rx={layout.w / 1.7}
            ry={layout.h / 1.7}
            fill={info.glow}
            opacity={0.22}
            filter="url(#continent-glow)"
          />
        );
      })}

      {territories.map((t) => {
        const isHover = hoveredId === t.id;
        const isSelected = selectedId === t.id;
        const claimed = t.status === "claimed";
        const pending = t.status === "pending";
        const fill = claimed ? t.bg_color ?? "#4ADE80" : pending ? "url(#reserved-hatch)" : `${REGION_COLORS[t.region] ?? "#bcd9c4"}bb`;
        const dimmed = matchIds != null && !matchIds.has(t.id);

        return (
          <g key={t.id}>
            <path
              d={t.path_svg}
              fill={fill}
              stroke={isSelected ? "#f2b705" : claimed ? "#163a1d" : "#ffffff"}
              strokeWidth={isSelected ? 4 : isHover ? 3 : 1.6}
              className={`transition-[filter,opacity] duration-150 ${pending ? "" : "cursor-pointer"}`}
              style={{ filter: isHover ? "brightness(1.08)" : undefined, opacity: dimmed ? 0.25 : 1 }}
              onMouseEnter={() => setHoveredId(t.id)}
              onMouseLeave={() => setHoveredId((id) => (id === t.id ? null : id))}
              onClick={() => onSelect(t)}
            >
              <title>
                {t.name} — {t.area_km2} km² — ${(t.price_cents / 100).toFixed(0)}
                {claimed && t.company_name ? ` — claimed by ${t.company_name}` : ""}
              </title>
            </path>

            {claimed && (
              <g className="pointer-events-none" transform={`translate(${t.centroid_x}, ${t.centroid_y})`}>
                <circle r="13" fill="white" stroke="#163a1d" strokeWidth="2" />
                {t.has_logo ? (
                  <>
                    <clipPath id={`clip-${t.id}`}>
                      <circle r="11" />
                    </clipPath>
                    <image
                      href={logoUrl(t.id)}
                      x={-11}
                      y={-11}
                      width={22}
                      height={22}
                      clipPath={`url(#clip-${t.id})`}
                      preserveAspectRatio="xMidYMid slice"
                    />
                  </>
                ) : (
                  <text textAnchor="middle" dy="4" fontSize="11" fontWeight={800} fill="#163a1d">
                    {t.company_name?.slice(0, 2).toUpperCase() ?? "🚩"}
                  </text>
                )}
                <g transform="translate(11, -19)" className="animate-flag">
                  <line x1="0" y1="0" x2="0" y2="22" stroke="#7a4a2b" strokeWidth="2" />
                  <path d="M0,0 L12,3 L0,7 Z" fill="#d95757" />
                </g>
              </g>
            )}
          </g>
        );
      })}

      {continents.map((name) => {
        const layout = CONTINENT_LAYOUT[name];
        const info = CONTINENTS[name];
        const labelY = layout.cy - layout.h / 2 - 18;
        return (
          <g key={name} className="pointer-events-none" transform={`translate(${layout.cx}, ${labelY})`}>
            <Tree x={-layout.w / 2 + 14} y={layout.h - 10} scale={1.1} className="opacity-90" />
            <rect x={-96} y={-16} width={192} height={44} rx={22} fill="#fdf8ec" fillOpacity="0.88" />
            <text textAnchor="middle" y={0} fontSize="17" fontWeight={800} fill="#163a1d" className="font-display">
              {info.icon} {name}
            </text>
            <text textAnchor="middle" y={19} fontSize="11" fontWeight={700} fill="#4B5C4F">
              {info.tagline}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
