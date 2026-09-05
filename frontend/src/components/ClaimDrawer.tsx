import { useState } from "react";
import { startCheckout } from "../api";
import type { Territory } from "../types";

const SWATCHES = ["#4ADE80", "#38BDF8", "#F472B6", "#FBBF24", "#A78BFA", "#FB7185", "#2DD4BF", "#F97316"];

export function ClaimDrawer({ territory, onClose }: { territory: Territory; onClose: () => void }) {
  const [companyName, setCompanyName] = useState("");
  const [tagline, setTagline] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("https://");
  const [bgColor, setBgColor] = useState(SWATCHES[0]);
  const [buyerEmail, setBuyerEmail] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priceLabel = `$${(territory.price_cents / 100).toFixed(0)}`;
  const already = territory.status !== "available";

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setLogo(file);
    setLogoPreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await startCheckout(territory.id, {
        companyName,
        tagline,
        websiteUrl,
        bgColor,
        buyerEmail,
        logo,
      });
      window.location.href = res.checkout_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-land-900/40" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-md flex-col overflow-y-auto bg-parchment p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="self-end text-sm font-bold text-land-700 hover:text-land-900">
          ✕ close
        </button>

        <h2 className="mt-2 text-2xl font-bold text-land-900">🚩 {territory.name}</h2>
        <p className="mt-1 text-sm text-land-700">
          {territory.region} region · {territory.area_km2} km²
        </p>

        {already ? (
          territory.status === "pending" ? (
            <div className="mt-6 rounded-2xl border-2 border-dashed border-gold-500 bg-gold-300/20 p-4 text-sm font-bold text-land-800">
              Someone's mid-claim on this patch right now. Give it 15 minutes, or go plant your flag somewhere else on
              the map.
            </div>
          ) : (
            <div className="mt-6 space-y-3 rounded-2xl border-2 border-land-300 bg-white p-4">
              <div className="flex items-center gap-3">
                {territory.has_logo && (
                  <img
                    src={`${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"}/api/territories/${territory.id}/logo`}
                    alt={`${territory.company_name} logo`}
                    className="h-12 w-12 rounded-full border-2 border-land-700 object-cover"
                  />
                )}
                <div>
                  <p className="font-display font-bold text-land-900">{territory.company_name}</p>
                  <p className="text-sm text-land-700">{territory.tagline}</p>
                </div>
              </div>
              {territory.website_url && (
                <a href={territory.website_url} target="_blank" rel="noreferrer" className="btn-liquid-outline w-full justify-center text-sm">
                  Visit site →
                </a>
              )}
              <p className="text-xs text-land-600">This patch has already been claimed and flies its owner's flag for good.</p>
            </div>
          )
        ) : (
          <>
            <div className="mt-4 rounded-2xl bg-land-100 p-4">
              <p className="font-display text-3xl font-bold text-land-800">{priceLabel}</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-land-600">
                one payment · yours forever · no rent, ever
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 flex flex-1 flex-col gap-4">
              <label className="text-sm font-bold text-land-800">
                Company / product name
                <input
                  required
                  maxLength={60}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme AI"
                  className="mt-1 w-full rounded-xl border-2 border-land-300 bg-white px-3 py-2 outline-none focus:border-land-600"
                />
              </label>

              <label className="text-sm font-bold text-land-800">
                Caption / tagline
                <input
                  maxLength={120}
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Ship faster than your roadmap"
                  className="mt-1 w-full rounded-xl border-2 border-land-300 bg-white px-3 py-2 outline-none focus:border-land-600"
                />
              </label>

              <label className="text-sm font-bold text-land-800">
                Website
                <input
                  type="url"
                  required
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://your-product.com"
                  className="mt-1 w-full rounded-xl border-2 border-land-300 bg-white px-3 py-2 outline-none focus:border-land-600"
                />
              </label>

              <label className="text-sm font-bold text-land-800">
                Your email (for the receipt)
                <input
                  type="email"
                  required
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  placeholder="founder@your-product.com"
                  className="mt-1 w-full rounded-xl border-2 border-land-300 bg-white px-3 py-2 outline-none focus:border-land-600"
                />
              </label>

              <div>
                <p className="text-sm font-bold text-land-800">Flag color</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {SWATCHES.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setBgColor(c)}
                      aria-label={`Choose ${c}`}
                      className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
                      style={{ backgroundColor: c, borderColor: bgColor === c ? "#163a1d" : "transparent" }}
                    />
                  ))}
                </div>
              </div>

              <label className="text-sm font-bold text-land-800">
                Logo (optional, PNG/JPG/WEBP, under 300KB)
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleLogoChange}
                  className="mt-1 block w-full text-sm text-land-700 file:mr-3 file:rounded-full file:border-0 file:bg-land-100 file:px-3 file:py-1.5 file:font-bold file:text-land-700"
                />
                {logoPreview && <img src={logoPreview} alt="Logo preview" className="mt-2 h-14 w-14 rounded-full border-2 border-land-300 object-cover" />}
              </label>

              {error && <p className="rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}

              <button type="submit" disabled={submitting} className="btn-liquid mt-auto w-full justify-center disabled:opacity-60">
                {submitting ? "Opening secure checkout…" : `Pay ${priceLabel} & plant my flag`}
              </button>
              <p className="text-center text-xs text-land-600">
                Payment handled by Dodo Payments. We never see or store your card details.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
