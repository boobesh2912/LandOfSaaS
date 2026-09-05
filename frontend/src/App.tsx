import { useEffect, useState } from "react";
import { listTerritories } from "./api";
import { ClaimDrawer } from "./components/ClaimDrawer";
import { ClaimedReturn } from "./components/ClaimedReturn";
import { ClaimedShowcase } from "./components/ClaimedShowcase";
import { GardenFrame } from "./components/Decor";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { HowItWorks } from "./components/HowItWorks";
import { PricingBanner } from "./components/PricingBanner";
import { WorldMap } from "./components/WorldMap";
import type { Territory } from "./types";

function Landing() {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Territory | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    listTerritories()
      .then(setTerritories)
      .catch((e) => setLoadError(e instanceof Error ? e.message : "Could not load the map"))
      .finally(() => setLoading(false));
  }, []);

  const claimedCount = territories.filter((t) => t.status === "claimed").length;

  return (
    <div className="min-h-screen">
      <Header claimedCount={claimedCount} total={territories.length} />

      {/* The map is the hero: it sits directly under the header, no scrolling required. */}
      <section id="map" className="relative overflow-visible px-4 pb-6 pt-10 sm:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="text-3xl font-bold text-land-900 sm:text-4xl">
            Stop renting attention.<br className="hidden sm:block" /> Go claim your land.
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-land-700">
            Every patch below is real, permanent territory. Pick one, plant your flag, and your product owns a
            visible piece of the internet — forever.
          </p>
        </div>

        <div className="relative mx-auto mt-8 max-w-5xl">
          <GardenFrame />
          {loading && <p className="py-24 text-center text-land-700">Charting the coastline…</p>}
          {loadError && (
            <p className="py-24 text-center font-semibold text-red-700">
              Couldn't reach the map server: {loadError}. Is the backend running on VITE_API_BASE_URL?
            </p>
          )}
          {!loading && !loadError && <WorldMap territories={territories} onSelect={setSelected} />}
        </div>
      </section>

      <HowItWorks />
      <ClaimedShowcase territories={territories} />
      <PricingBanner />
      <Footer />

      {selected && (
        <ClaimDrawer
          territory={selected}
          onClose={() => {
            setSelected(null);
            listTerritories().then(setTerritories).catch(() => {});
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
