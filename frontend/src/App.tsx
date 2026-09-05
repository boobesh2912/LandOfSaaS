import { useEffect, useMemo, useState } from "react";
import { listTerritories } from "./api";
import { ClaimDrawer } from "./components/ClaimDrawer";
import { ClaimedReturn } from "./components/ClaimedReturn";
import { ClaimedShowcase } from "./components/ClaimedShowcase";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { HowItWorks } from "./components/HowItWorks";
import { PricingBanner } from "./components/PricingBanner";
import { Rules } from "./components/Rules";
import { SelectionPanel } from "./components/SelectionPanel";
import { WorldMap } from "./components/WorldMap";
import type { Territory } from "./types";

function Landing() {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [payingTerritory, setPayingTerritory] = useState<Territory | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    listTerritories()
      .then(setTerritories)
      .catch((e) => setLoadError(e instanceof Error ? e.message : "Could not load the map"))
      .finally(() => setLoading(false));
  }, []);

  const claimedCount = territories.filter((t) => t.status === "claimed").length;
  const selected = territories.find((t) => t.id === selectedId) ?? null;

  const matchIds = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    return new Set(
      territories
        .filter(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            t.region.toLowerCase().includes(q) ||
            (t.company_name ?? "").toLowerCase().includes(q)
        )
        .map((t) => t.id)
    );
  }, [territories, search]);

  function refetch() {
    listTerritories().then(setTerritories).catch(() => {});
  }

  return (
    <div className="min-h-screen">
      <Header claimedCount={claimedCount} total={territories.length} search={search} onSearchChange={setSearch} />

      {/* The map is the hero: it sits directly under the header, no scrolling required. */}
      <section id="map" className="relative overflow-visible px-4 pb-6 pt-8 sm:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <span className="chip bg-land-100 text-land-700">🟢 {territories.length - claimedCount} territories still available</span>
          <h1 className="mt-3 text-3xl font-bold text-land-900 sm:text-4xl">Own Your Space on the Internet</h1>
          <p className="mx-auto mt-2 max-w-xl text-land-700">Claim land. Pay once. Get discovered.</p>
        </div>

        <div className="relative mx-auto mt-6 max-w-6xl md:relative">
          {loading && <p className="py-24 text-center text-land-700">Charting the coastline…</p>}
          {loadError && (
            <p className="py-24 text-center font-semibold text-red-700">
              Couldn't reach the map server: {loadError}. Is the backend running on VITE_API_BASE_URL?
            </p>
          )}
          {!loading && !loadError && (
            <>
              <WorldMap territories={territories} selectedId={selectedId} onSelect={(t) => setSelectedId(t.id)} matchIds={matchIds} />
              <div className="mt-4 flex justify-center md:absolute md:right-4 md:top-4 md:mt-0 md:justify-start">
                <SelectionPanel selected={selected} onOwn={(t) => setPayingTerritory(t)} />
              </div>
            </>
          )}
        </div>
      </section>

      <HowItWorks />
      <Rules />
      <ClaimedShowcase territories={territories} />
      <PricingBanner />
      <Footer />

      {payingTerritory && (
        <ClaimDrawer
          territory={payingTerritory}
          onClose={() => {
            setPayingTerritory(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  const territoryId = params.get("territory_id");

  if (path === "/claimed" && territoryId) {
    return <ClaimedReturn territoryId={territoryId} />;
  }
  return <Landing />;
}
