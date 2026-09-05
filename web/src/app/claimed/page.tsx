"use client";

import { useEffect, useState, use } from "react";
import type { PublicBuilding } from "@/lib/types";

/**
 * Where Dodo sends the buyer back after checkout. This screen is *not* proof
 * of payment — it polls until the signed webhook has actually granted the
 * building, so a closed tab or a spoofed redirect changes nothing.
 */
export default function ClaimedPage({ searchParams }: { searchParams: Promise<{ building?: string }> }) {
  const { building: buildingId } = use(searchParams);
  const [building, setBuilding] = useState<PublicBuilding | null>(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!buildingId) return;
    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/buildings", { cache: "no-store" });
        const all: PublicBuilding[] = await res.json();
        if (cancelled) return;
        const found = all.find((b) => b.id === buildingId) ?? null;
        setBuilding(found);
        if (found?.status !== "owned" && attempts < 20) setAttempts((a) => a + 1);
      } catch {
        if (!cancelled && attempts < 20) setAttempts((a) => a + 1);
      }
    }, attempts === 0 ? 0 : 1500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [attempts, buildingId]);

  const confirmed = building?.status === "owned";

  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div className="max-w-md">
        <div className="text-5xl">{confirmed ? "🏙️" : "⏳"}</div>
        <h1 className="mt-4 text-3xl font-extrabold">
          {confirmed ? `${building?.name} is yours` : "Confirming your payment…"}
        </h1>
        <p className="mt-3 text-muted">
          {confirmed
            ? `${building?.owner_name} is now on the board. Anyone who wants this slot has to outbid you.`
            : "Dodo Payments is finalising the charge and our webhook is handing over the keys. This takes a few seconds."}
        </p>
        <a href="/" className="btn btn-primary mt-7">
          {confirmed ? "See it on the board" : "Back to the board"}
        </a>
      </div>
    </main>
  );
}
