/**
 * Built-in hero scenery: a plotted green field running down to water, in the
 * spirit of the reference art (aerial field, parcels along the edges, calm
 * lake at the horizon). Sits behind `/hero.jpg` — drop that file in and it
 * covers this automatically; without it, the hero still looks composed.
 */
export function HeroBackdrop() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 -z-[3] h-full w-full"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eafaf1" />
          <stop offset="60%" stopColor="#dff5e8" />
          <stop offset="100%" stopColor="#cdeddb" />
        </linearGradient>
        <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#bfe9de" />
          <stop offset="100%" stopColor="#a7e0d2" />
        </linearGradient>
        <linearGradient id="field" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a9e2c0" />
          <stop offset="100%" stopColor="#8fd6ab" />
        </linearGradient>
        <radialGradient id="sun" cx="15%" cy="8%" r="45%">
          <stop offset="0%" stopColor="#fffceb" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#fffceb" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="1440" height="900" fill="url(#sky)" />
      <rect width="1440" height="900" fill="url(#sun)" />
      <path d="M0,300 C300,260 600,310 900,270 C1100,244 1300,280 1440,258 L1440,420 L0,420 Z" fill="url(#water)" opacity="0.7" />
      <path d="M0,360 C260,320 560,368 860,332 C1080,306 1280,340 1440,318 L1440,900 L0,900 Z" fill="url(#field)" />
    </svg>
  );
}
