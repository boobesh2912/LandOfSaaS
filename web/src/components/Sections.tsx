import { formatUsd } from "@/lib/pricing";
import type { PublicBuilding } from "@/lib/types";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5">
        <a href="#top" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-b from-brand-400 to-brand-600 font-display text-sm font-extrabold text-white shadow-[0_8px_16px_-8px_rgba(11,109,71,0.9)]">
            L
          </span>
          <span className="font-display text-lg font-extrabold">LandOfSaaS</span>
        </a>
        <nav className="hidden items-center gap-6 text-sm font-semibold text-muted md:flex">
          <a href="#top" className="hover:text-ink">The board</a>
          <a href="#how" className="hover:text-ink">How it works</a>
          <a href="#pricing" className="hover:text-ink">Pricing</a>
        </nav>
        <a href="#top" className="btn btn-primary !px-4 !py-2 text-sm">Start Claiming</a>
      </div>
    </header>
  );
}

const STEPS = [
  { n: "1", title: "Pick a plot", body: "Choose any open tile on the grid, then size it small, medium, or large." },
  { n: "2", title: "Pay once", body: "One payment for the slot. No subscription, no renewal, nothing to cancel later." },
  { n: "3", title: "Own visibility", body: "Your logo, colour, and link sit on the board until somebody buys it out from under you." },
];

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-5xl px-5 py-20">
      <h2 className="text-center text-3xl font-extrabold sm:text-4xl">Three steps. That&rsquo;s the whole game.</h2>
      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        {STEPS.map((s) => (
          <div key={s.n} className="rounded-3xl border border-line bg-white p-6 shadow-[0_24px_48px_-40px_rgba(7,61,40,0.5)]">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 font-display font-extrabold text-brand-700">
              {s.n}
            </span>
            <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
            <p className="mt-1.5 text-sm text-muted">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Pricing() {
  return (
    <section id="pricing" className="bg-brand-900 py-20 text-white">
      <div className="mx-auto max-w-4xl px-5 text-center">
        <h2 className="text-3xl font-extrabold sm:text-4xl">Buy it, or take it.</h2>
        <p className="mx-auto mt-4 max-w-xl text-brand-100">
          Open plots sell at their list price. Owned plots can be taken over by anyone willing to pay half
          again what the current owner paid — and the owner they replace keeps half of that increase.
        </p>
        <div className="mx-auto mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
          {[
            { k: "Owner paid", v: "$20" },
            { k: "You pay", v: "$30" },
            { k: "They receive", v: "$5" },
          ].map((x) => (
            <div key={x.k} className="rounded-2xl bg-white/10 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-200">{x.k}</p>
              <p className="mt-1 font-display text-2xl font-extrabold">{x.v}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-brand-200">Every takeover raises the floor. Prices only go up.</p>
      </div>
    </section>
  );
}

/** Real numbers off the board — no invented traction. */
export function BoardStats({ buildings }: { buildings: PublicBuilding[] }) {
  const owned = buildings.filter((b) => b.status === "owned");
  const claimedValue = owned.reduce((sum, b) => sum + b.current_price_cents, 0);
  const takeovers = owned.reduce((sum, b) => sum + b.takeover_count, 0);

  const stats = [
    { k: "Plots owned", v: `${owned.length} / ${buildings.length}` },
    { k: "Claimed value", v: formatUsd(claimedValue) },
    { k: "Takeovers so far", v: String(takeovers) },
  ];

  return (
    <section className="mx-auto max-w-4xl px-5 py-16">
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.k} className="rounded-3xl border border-line bg-white p-6 text-center">
            <p className="font-display text-3xl font-extrabold text-brand-600">{s.v}</p>
            <p className="mt-1 text-sm font-semibold text-muted">{s.k}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line bg-white py-10 text-center text-sm text-muted">
      <p className="font-display font-bold text-ink">LandOfSaaS</p>
      <p className="mt-1">Visibility you own, not rent. Payments handled by Dodo Payments.</p>
    </footer>
  );
}
