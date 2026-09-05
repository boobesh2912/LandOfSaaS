interface Props {
  claimedCount: number;
  total: number;
  search: string;
  onSearchChange: (v: string) => void;
}

export function Header({ claimedCount, total, search, onSearchChange }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b-2 border-land-100 bg-parchment/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-3">
        <a href="#map" className="flex items-center gap-2 font-display text-xl font-bold text-land-700">
          <span className="text-2xl">🌍</span>
          <span>
            LandOfSaaS
            <span className="hidden pl-2 align-middle text-xs font-semibold text-land-500 sm:inline">
              One world. Endless opportunities.
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-5 pl-4 text-sm font-bold text-land-700 lg:flex">
          <a href="#map" className="hover:text-land-900">
            Explore
          </a>
          <a href="#how" className="hover:text-land-900">
            How it works
          </a>
          <a href="#rules" className="hover:text-land-900">
            Rules
          </a>
          <a href="#pricing" className="hover:text-land-900">
            Pricing
          </a>
          <a href="#claimed" className="hover:text-land-900">
            Leaderboard
          </a>
        </nav>

        <div className="ml-auto flex flex-1 items-center justify-end gap-3">
          <div className="hidden max-w-[220px] flex-1 items-center gap-1.5 rounded-full border-2 border-land-100 bg-white px-3 py-1.5 md:flex">
            <span aria-hidden="true">🔍</span>
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search territories..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-land-500"
            />
          </div>
          <span className="hidden rounded-full bg-land-100 px-3 py-1 text-xs font-bold text-land-700 sm:inline">
            🚩 {claimedCount}/{total} claimed
          </span>
          <button
            type="button"
            title="Coming soon"
            className="hidden text-sm font-bold text-land-700 hover:text-land-900 sm:inline"
          >
            Sign in
          </button>
          <a href="#map" className="btn-liquid !px-4 !py-2 text-sm">
            Get Started
          </a>
        </div>
      </div>
    </header>
  );
}
