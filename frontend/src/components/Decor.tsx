import type { CSSProperties } from "react";

export function Tree({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 56" className={className} aria-hidden="true">
      <rect x="17" y="34" width="6" height="20" rx="2" fill="#7a4a2b" />
      <circle cx="20" cy="14" r="14" fill="#2f8a3f" />
      <circle cx="11" cy="24" r="10" fill="#3fa34d" />
      <circle cx="29" cy="24" r="10" fill="#3fa34d" />
      <circle cx="20" cy="26" r="12" fill="#4dbb5c" />
    </svg>
  );
}

export function Bush({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 44 28" className={className} aria-hidden="true">
      <ellipse cx="10" cy="18" rx="10" ry="9" fill="#2f8a3f" />
      <ellipse cx="22" cy="12" rx="13" ry="12" fill="#3fa34d" />
      <ellipse cx="35" cy="18" rx="10" ry="9" fill="#2f8a3f" />
    </svg>
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

interface DecorItem {
  Icon: typeof Tree;
  style: CSSProperties;
  animate?: string;
}

const GARDEN: DecorItem[] = [
  { Icon: Tree, style: { left: "-2%", top: "8%", width: 46 }, animate: "animate-sway" },
  { Icon: Bush, style: { left: "-1%", top: "62%", width: 52 } },
  { Icon: Tree, style: { left: "4%", top: "88%", width: 34 }, animate: "animate-sway" },
  { Icon: Bush, style: { right: "-1%", top: "20%", width: 48 } },
  { Icon: Tree, style: { right: "-2%", top: "70%", width: 50 }, animate: "animate-sway" },
  { Icon: Bush, style: { right: "6%", top: "-2%", width: 40 } },
  { Icon: Bush, style: { left: "10%", top: "-3%", width: 36 } },
  { Icon: Tree, style: { left: "88%", bottom: "-3%", width: 38 }, animate: "animate-sway" },
];

export function GardenFrame() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
      {GARDEN.map(({ Icon, style, animate }, i) => (
        <div key={i} className={`absolute drop-shadow-sm ${animate ?? ""}`} style={style}>
          <Icon className="h-auto w-full" />
        </div>
      ))}
      <Cloud className="absolute left-[6%] top-[-6%] w-28 opacity-90" />
      <Cloud className="absolute right-[10%] top-[-4%] w-20 opacity-80" />
    </div>
  );
}
