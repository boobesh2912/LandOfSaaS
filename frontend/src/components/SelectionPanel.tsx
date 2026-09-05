import { CONTINENTS, type Territory } from "../types";

const LEGEND: { label: string; color: string }[] = [
  { label: "Available", color: "#8fd6a2" },
  { label: "Selected", color: "#f2b705" },
  { label: "Owned", color: "#3fa34d" },
  { label: "Contested", color: "#d8d3c4" },
];

export function SelectionPanel({
  selected,
  onOwn,
}: {
  selected: Territory | null;
  onOwn: (t: Territory) => void;
}) {
  const area = selected?.area_km2 ?? 0;
  const price = selected ? (selected.price_cents / 100).toFixed(0) : "0";

  return (
    <div className="w-full max-w-[280px] rounded-3xl border-2 border-land-100 bg-white/95 p-5 shadow-xl backdrop-blur">
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-land-600">
        📍 {selected ? CONTINENTS[selected.region]?.icon : ""} {selected ? selected.region : "Select Territory"}
      </p>
      <p className="mt-1 font-display text-lg font-bold text-land-900">
        {selected ? selected.name : "Click any patch on the map"}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-land-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-land-600">Area</p>
          <p className="font-display text-xl font-bold text-land-900">{area} km²</p>
        </div>
        <div className="rounded-xl bg-land-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-land-600">Price</p>
          <p className="font-display text-xl font-bold text-land-900">${price}</p>
        </div>
      </div>

      {!selected && (
        <button disabled className="btn-liquid mt-4 w-full justify-center opacity-50">
          Own This Territory
        </button>
      )}
      {selected?.status === "available" && (
        <button onClick={() => onOwn(selected)} className="btn-liquid mt-4 w-full justify-center">
          Own This Territory
        </button>
      )}
      {selected?.status === "pending" && (
        <button disabled className="btn-liquid mt-4 w-full justify-center opacity-60">
          Contested — try another
        </button>
      )}
      {selected?.status === "claimed" && (
        <div className="mt-4 rounded-xl bg-land-100 p-3 text-sm">
          <p className="font-display font-bold text-land-900">🚩 {selected.company_name}</p>
          <p className="text-land-700">{selected.tagline}</p>
          {selected.website_url && (
            <a href={selected.website_url} target="_blank" rel="noreferrer" className="mt-2 inline-block font-bold text-land-700 underline">
              Visit site →
            </a>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-x-3 gap-y-1.5 border-t border-land-100 pt-3">
        {LEGEND.map((l) => (
          <span key={l.label} className="flex items-center gap-1 text-[10px] font-bold text-land-600">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}
