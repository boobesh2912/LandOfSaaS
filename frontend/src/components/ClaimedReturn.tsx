import { useEffect, useState } from "react";
import { getTerritory } from "../api";
import type { Territory } from "../types";

export function ClaimedReturn({ territoryId }: { territoryId: string }) {
  const [territory, setTerritory] = useState<Territory | null>(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const t = await getTerritory(territoryId);
        if (cancelled) return;
        setTerritory(t);
        if (t.status !== "claimed" && attempts < 20) {
          timer = setTimeout(() => setAttempts((a) => a + 1), 1500);
        }
      } catch {
        if (!cancelled && attempts < 20) timer = setTimeout(() => setAttempts((a) => a + 1), 1500);
      }
    }
    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempts, territoryId]);

  const confirmed = territory?.status === "claimed";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-parchment px-6 text-center">
      <div className="text-6xl">{confirmed ? "🚩" : "⏳"}</div>
      <h1 className="text-3xl font-bold text-land-900">
        {confirmed ? `${territory?.name} is officially yours!` : "Confirming your payment…"}
      </h1>
      <p className="max-w-md text-land-700">
        {confirmed
          ? `Your flag is planted. ${territory?.company_name} now has a permanent home on the map.`
          : "Dodo Payments is finalizing your purchase and our webhook is planting your flag. This usually takes a few seconds."}
      </p>
      <a href="/" className="btn-liquid mt-4">
        {confirmed ? "See it on the map" : "Back to the map"}
      </a>
    </div>
  );
}
