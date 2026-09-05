import { logoUrl } from "../api";
import type { Territory } from "../types";

export function ClaimedShowcase({ territories }: { territories: Territory[] }) {
  const claimed = territories.filter((t) => t.status === "claimed").slice(0, 8);

  return (
    <section id="claimed" className="mx-auto max-w-6xl px-5 py-16">
      <h2 className="text-center text-3xl font-bold text-land-900">Flags already planted</h2>
      <p className="mx-auto mt-2 max-w-xl text-center text-land-700">
        {claimed.length === 0
          ? "Be the very first founder on the map."
          : "These founders already own a permanent piece of the internet."}
      </p>

      {claimed.length > 0 && (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {claimed.map((t) => (
            <a
              key={t.id}
              href={t.website_url ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-transform hover:-translate-y-1"
              style={{ borderColor: t.bg_color ?? "#3fa34d", backgroundColor: `${t.bg_color ?? "#3fa34d"}1a` }}
            >
              {t.has_logo ? (
                <img src={logoUrl(t.id)} alt={`${t.company_name} logo`} className="h-14 w-14 rounded-full border-2 border-white object-cover shadow" />
              ) : (
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white font-display text-lg font-bold text-white shadow"
                  style={{ backgroundColor: t.bg_color ?? "#3fa34d" }}
                >
                  {t.company_name?.slice(0, 2).toUpperCase()}
                </div>
              )}
              <p className="font-display font-bold text-land-900">{t.company_name}</p>
              <p className="text-xs text-land-700">{t.tagline}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-land-500">
                {t.name} · {t.area_km2} km²
              </p>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
