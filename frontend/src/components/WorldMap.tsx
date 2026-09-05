import { useMemo, useState } from "react";
import { logoUrl } from "../api";
import { REGION_COLORS, type Territory } from "../types";

const WIDTH = 1000;
const HEIGHT = 640;

function wavyRectPath(pad: number, waves: number, amplitude: number): string {
  const points: string[] = [];
  const top: [number, number][] = [];
  const w = WIDTH + pad * 2;
  for (let i = 0; i <= waves * 2; i++) {
    const x = (i / (waves * 2)) * w - pad;
    const y = -pad + (i % 2 === 0 ? -amplitude : amplitude);
    top.push([x, y]);
  }
  points.push(`M ${top[0][0]},${top[0][1]}`);
  top.slice(1).forEach(([x, y]) => points.push(`L ${x.toFixed(1)},${y.toFixed(1)}`));
  points.push(`L ${WIDTH + pad},${HEIGHT + pad}`);
  points.push(`L ${-pad},${HEIGHT + pad}`);
  points.push("Z");
  return points.join(" ");
}

interface Props {
  territories: Territory[];
  onSelect: (t: Territory) => void;
}

export function WorldMap({ territories, onSelect }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const shore = useMemo(() => wavyRectPath(26, 14, 8), []);

  return (
    <div className="relative">
      <svg viewBox={`-40 -40 ${WIDTH + 80} ${HEIGHT + 80}`} className="w-full drop-shadow-xl" role="img" aria-label="Interactive world map of claimable territories">
        <defs>
          <linearGradient id="ocean" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#bfe7ee" />
            <stop offset="100%" stopColor="#8fd0dc" />
          </linearGradient>
          <pattern id="reserved-hatch" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill="#d8d3c4" />
            <line x1="0" y1="0" x2="0" y2="8" stroke="#b9b19a" strokeWidth="4" />
          </pattern>
        </defs>

        <path d={shore} fill="url(#ocean)" />
        <rect x={-6} y={-6} width={WIDTH + 12} height={HEIGHT + 12} rx={28} fill="#fdf8ec" stroke="#e7dcc0" strokeWidth={4} />

        <g>
          {territories.map((t) => {
            const isHover = hoveredId === t.id;
            const claimed = t.status === "claimed";
            const pending = t.status === "pending";
            const fill = claimed ? t.bg_color ?? "#4ADE80" : pending ? "url(#reserved-hatch)" : `${REGION_COLORS[t.region] ?? "#bcd9c4"}66`;

            return (
              <g key={t.id}>
                <path
                  d={t.path_svg}
                  fill={fill}
                  stroke={claimed ? "#163a1d" : "#ffffff"}
                  strokeWidth={isHover ? 3 : 1.6}
                  className={`transition-[filter] duration-150 ${pending ? "" : "cursor-pointer"}`}
                  style={{ filter: isHover ? "brightness(1.08)" : undefined }}
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
                  <g
                    className="pointer-events-none"
                    transform={`translate(${t.centroid_x}, ${t.centroid_y})`}
                  >
                    <circle r="15" fill="white" stroke="#163a1d" strokeWidth="2" />
                    {t.has_logo ? (
                      <>
                        <clipPath id={`clip-${t.id}`}>
                          <circle r="13" />
                        </clipPath>
                        <image
                          href={logoUrl(t.id)}
                          x={-13}
                          y={-13}
                          width={26}
                          height={26}
                          clipPath={`url(#clip-${t.id})`}
                          preserveAspectRatio="xMidYMid slice"
                        />
                      </>
                    ) : (
                      <text textAnchor="middle" dy="5" fontSize="13" fontWeight={800} fill="#163a1d">
                        {t.company_name?.slice(0, 2).toUpperCase() ?? "🚩"}
                      </text>
                    )}
                    <g transform="translate(13, -22)" className="animate-flag">
                      <line x1="0" y1="0" x2="0" y2="26" stroke="#7a4a2b" strokeWidth="2" />
                      <path d="M0,0 L14,4 L0,9 Z" fill="#d95757" />
                    </g>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
