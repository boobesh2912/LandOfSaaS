"use client";

import { useEffect, useMemo, useState } from "react";
import {
  formatUsd,
  minTakeoverCents,
  nextSizeUp,
  previousOwnerPayoutCents,
  priceForCents,
  SIZE_META,
  SIZE_ORDER,
} from "@/lib/pricing";
import type { PublicBuilding, Size } from "@/lib/types";

const SWATCHES = ["#22c55e", "#2563eb", "#7c3aed", "#db2777", "#ea580c", "#0891b2", "#eab308", "#0f172a"];

export function ClaimPanel({ building, onClose }: { building: PublicBuilding | null; onClose: () => void }) {
  const [size, setSize] = useState<Size>("small");
  const [companyName, setCompanyName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("https://");
  const [email, setEmail] = useState("");
  const [brandColor, setBrandColor] = useState(SWATCHES[0]);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!building) return;
    setSize(building.size);
    setError(null);
    setSubmitting(false);
  }, [building]);

  const owned = building?.status === "owned";
  const price = useMemo(() => (building ? priceForCents(building, size) : 0), [building, size]);
  const upgrade = nextSizeUp(size);
  const payout = building && owned ? previousOwnerPayoutCents(building.current_price_cents, price) : 0;

  if (!building) {
    return (
      <div className="rounded-3xl border border-line bg-white/95 p-8 text-center shadow-[0_30px_60px_-45px_rgba(11,26,18,0.6)] backdrop-blur">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-xl">🏗️</div>
        <p className="mt-3 font-display text-base font-semibold">Pick a plot</p>
        <p className="mt-1 text-sm text-muted">
          Select any open tile on the grid to see its size, area, and price.
        </p>
      </div>
    );
  }

  function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setLogo(file);
    setLogoPreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!building) return;
    setError(null);
    setSubmitting(true);
    try {
      let logoUrl: string | null = null;
      if (logo) {
        const body = new FormData();
        body.set("logo", logo);
        const res = await fetch("/api/logo", { method: "POST", body });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not upload that logo");
        logoUrl = data.logoUrl;
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          buildingId: building.id,
          size,
          companyName,
          websiteUrl,
          brandColor,
          email,
          bidCents: price,
          logoUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not start checkout");
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-[0_30px_60px_-45px_rgba(11,26,18,0.6)]">
      <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-brand-600">
            {owned ? "Owned plot" : "Available plot"}
          </p>
          <h3 className="mt-0.5 font-display text-xl font-bold">{building.name}</h3>
        </div>
        <button onClick={onClose} className="rounded-full p-1.5 text-muted hover:bg-canvas" aria-label="Clear selection">
          ✕
        </button>
      </div>

      <div className="space-y-4 px-5 py-4">
        <div>
          <p className="text-xs font-semibold text-muted">Building size</p>
          <div className="mt-1.5 flex gap-1.5">
            {SIZE_ORDER.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                className={`flex-1 rounded-xl border-2 px-2 py-2 text-center transition ${
                  size === s ? "border-brand-500 bg-brand-50" : "border-line hover:border-brand-200"
                }`}
              >
                <span className="block font-display text-xs font-bold">{SIZE_META[s].label}</span>
                <span className="block text-[10px] text-muted">{SIZE_META[s].slots} slot{SIZE_META[s].slots > 1 ? "s" : ""}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl bg-canvas p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Area</p>
            <p className="mt-0.5 font-display text-lg font-bold">
              {SIZE_META[size].slots} {SIZE_META[size].slots === 1 ? "slot" : "slots"}
            </p>
          </div>
          <div className="rounded-2xl bg-canvas p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Price</p>
            <p className="mt-0.5 font-display text-lg font-bold text-brand-600">{formatUsd(price)}</p>
          </div>
        </div>

        {upgrade && (
          <button
            type="button"
            onClick={() => setSize(upgrade)}
            className="flex w-full items-center justify-between rounded-2xl border border-dashed border-brand-300 bg-brand-50/60 px-3 py-2.5 text-left transition hover:border-brand-500 hover:bg-brand-50"
          >
            <span>
              <span className="block font-display text-sm font-bold text-brand-700">
                Upgrade to {SIZE_META[upgrade].label}
              </span>
              <span className="block text-[11px] text-muted">
                {SIZE_META[upgrade].slots} slots · {formatUsd(priceForCents(building, upgrade))}
              </span>
            </span>
            <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-500 font-bold text-white">+</span>
          </button>
        )}

        {owned && (
          <p className="rounded-2xl border border-brand-100 bg-brand-50 p-3 text-xs text-brand-800">
            Held by <strong>{building.owner_name}</strong> at {formatUsd(building.current_price_cents)}. Taking it
            over starts at {formatUsd(minTakeoverCents(building.current_price_cents))}
            {payout > 0 && <> — they keep {formatUsd(payout)} of the increase</>}.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 border-t border-line pt-4">
          <input
            required
            maxLength={60}
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Company or product name"
            className="w-full rounded-xl border-2 border-line px-3 py-2 text-sm outline-none focus:border-brand-400"
          />
          <input
            type="url"
            required
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://your-product.com"
            className="w-full rounded-xl border-2 border-line px-3 py-2 text-sm outline-none focus:border-brand-400"
          />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="founder@your-product.com"
            className="w-full rounded-xl border-2 border-line px-3 py-2 text-sm outline-none focus:border-brand-400"
          />

          <div>
            <p className="text-xs font-semibold text-muted">Brand color</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setBrandColor(c)}
                  aria-label={`Use ${c}`}
                  className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{ background: c, borderColor: brandColor === c ? "#0b1a12" : "transparent" }}
                />
              ))}
            </div>
          </div>

          <label className="block text-xs font-semibold text-muted">
            Logo <span className="font-normal">(PNG/JPEG/WebP, under 300KB)</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleLogo}
              className="mt-1 block w-full text-xs file:mr-2 file:rounded-full file:border-0 file:bg-brand-50 file:px-2.5 file:py-1 file:font-semibold file:text-brand-700"
            />
            {logoPreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoPreview} alt="" className="mt-2 h-10 w-10 rounded-xl border border-line object-cover" />
            )}
          </label>

          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p>}

          <button type="submit" disabled={submitting} className="btn btn-primary w-full text-sm">
            {submitting ? "Opening checkout…" : `Own This Land · ${formatUsd(price)}`}
          </button>
          <p className="text-center text-[11px] text-muted">One payment via Dodo Payments. Yours for good.</p>
        </form>
      </div>
    </div>
  );
}
