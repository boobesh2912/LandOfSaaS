export function PricingBanner() {
  return (
    <section id="pricing" className="bg-land-700 py-16 text-parchment">
      <div className="mx-auto max-w-4xl px-5 text-center">
        <h2 className="text-3xl font-bold">One formula. No surprises.</h2>
        <p className="mt-4 font-display text-2xl">
          Price = Area (km²) <span className="text-gold-300">×</span> $2
        </p>
        <p className="mx-auto mt-3 max-w-lg text-land-100">
          A cozy 25 km² patch runs about $50. A sprawling 70 km² territory is around $140. Pay it once — there's no
          subscription to cancel later because there isn't one to begin with.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm font-bold">
          <span className="chip bg-land-600 text-parchment">✅ One-time payment</span>
          <span className="chip bg-land-600 text-parchment">✅ No renewals</span>
          <span className="chip bg-land-600 text-parchment">✅ No algorithm to beat</span>
        </div>
      </div>
    </section>
  );
}
