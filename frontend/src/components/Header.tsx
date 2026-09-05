export function Header({ claimedCount, total }: { claimedCount: number; total: number }) {
  return (
    <header className="sticky top-0 z-30 border-b-2 border-land-100 bg-parchment/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <a href="#map" className="flex items-center gap-2 font-display text-xl font-bold text-land-700">
          <span className="text-2xl">🌍</span>
          LandOfSaaS
        </a>
        <div className="hidden items-center gap-6 text-sm font-bold text-land-700 sm:flex">
          <a href="#how" className="hover:text-land-900">
            How it works
          </a>
          <a href="#claimed" className="hover:text-land-900">
            The map so far
          </a>
          <a href="#pricing" className="hover:text-land-900">
            Pricing
          </a>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden rounded-full bg-land-100 px-3 py-1 text-xs font-bold text-land-700 sm:inline">
            🚩 {claimedCount}/{total} claimed
          </span>
          <a href="#map" className="btn-liquid !px-4 !py-2 text-sm">
            Claim land
          </a>
        </div>
      </div>
    </header>
  );
}
