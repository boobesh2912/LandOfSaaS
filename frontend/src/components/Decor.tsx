/**
 * Small flat map props, each an SVG <g> meant to be placed directly inside
 * the world map's <svg> at a given (x, y). Kept deliberately simple (a
 * handful of shapes, no texture) -- the map's job is to read as clean and
 * structured, not as a dense illustration.
 */

interface PropProps {
  x: number;
  y: number;
  scale?: number;
  className?: string;
}

export function Tree({ x, y, scale = 1, className = "" }: PropProps) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`} className={className} aria-hidden="true">
      <rect x="-2" y="2" width="4" height="10" rx="1.5" fill="#7a4a2b" />
      <circle cx="0" cy="-6" r="8" fill="#2f8a3f" />
      <circle cx="-5" cy="-1" r="6" fill="#3fa34d" />
      <circle cx="5" cy="-1" r="6" fill="#3fa34d" />
    </g>
  );
}

export function Bush({ x, y, scale = 1, className = "" }: PropProps) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`} className={className} aria-hidden="true">
      <ellipse cx="-6" cy="2" rx="6" ry="5" fill="#2f8a3f" />
      <ellipse cx="0" cy="-1" rx="8" ry="7" fill="#3fa34d" />
      <ellipse cx="6" cy="2" rx="6" ry="5" fill="#2f8a3f" />
    </g>
  );
}

export function Boat({ x, y, scale = 1, className = "" }: PropProps) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`} className={className} aria-hidden="true">
      <path d="M-9,4 L9,4 L6,10 L-6,10 Z" fill="#a9714a" />
      <rect x="-0.8" y="-14" width="1.6" height="14" fill="#6b4a30" />
      <path d="M0,-14 L10,-2 L0,-2 Z" fill="#f4efe0" />
    </g>
  );
}

export function Whale({ x, y, scale = 1, className = "" }: PropProps) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`} className={className} aria-hidden="true">
      <path
        d="M-16,0 C-16,-9 -4,-13 8,-9 C14,-7 18,-3 18,0 C14,1 8,2 2,1 C4,4 3,8 0,9 C0,5 -2,3 -5,2 C-11,3 -16,2 -16,0 Z"
        fill="#4f7ea8"
      />
      <circle cx="-9" cy="-3" r="1.3" fill="#1b2b22" />
      <path d="M-2,-11 Q0,-16 3,-11" fill="none" stroke="#a9dee6" strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

export function Lighthouse({ x, y, scale = 1, className = "" }: PropProps) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`} className={className} aria-hidden="true">
      <ellipse cx="0" cy="14" rx="11" ry="4" fill="#d8c9a3" />
      <path d="M-4,14 L-2,-14 L2,-14 L4,14 Z" fill="#f4efe0" stroke="#c94f4f" strokeWidth="1.4" />
      <path d="M-5,-14 L5,-14 L3,-19 L-3,-19 Z" fill="#c94f4f" />
      <rect x="-1.6" y="-23" width="3.2" height="4.5" fill="#f2b705" />
    </g>
  );
}

export function Compass({ x, y, scale = 1, className = "" }: PropProps) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`} className={className} aria-hidden="true">
      <circle cx="0" cy="0" r="26" fill="white" fillOpacity="0.85" stroke="#256b32" strokeWidth="1.5" />
      <path d="M0,-18 L5,0 L0,18 L-5,0 Z" fill="#256b32" />
      <path d="M-18,0 L0,-5 L18,0 L0,5 Z" fill="#8fd6a2" />
      <text y="-30" textAnchor="middle" fontSize="10" fontWeight={800} fill="#163a1d">
        N
      </text>
    </g>
  );
}

export function Cloud({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 32" className={className} aria-hidden="true">
      <ellipse cx="16" cy="20" rx="14" ry="10" fill="white" fillOpacity="0.85" />
      <ellipse cx="34" cy="14" rx="18" ry="13" fill="white" fillOpacity="0.85" />
      <ellipse cx="50" cy="20" rx="13" ry="9" fill="white" fillOpacity="0.85" />
    </svg>
  );
}
