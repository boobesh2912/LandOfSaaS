# LandOfSaaS — Frontend (React + Vite + Tailwind)

The playful, map-first storefront: header → interactive territory map →
claim & customize drawer → Dodo Payments checkout → flag planted.

## Setup

```bash
npm install
cp .env.example .env.local   # point VITE_API_BASE_URL at your backend
npm run dev
```

Requires the backend (`../backend`) running and reachable at
`VITE_API_BASE_URL` (defaults to `http://localhost:8000`).

## Notes

- `src/components/WorldMap.tsx` renders the backend-generated Voronoi
  districts and owns all hover/click/claim visuals.
- `src/components/ClaimDrawer.tsx` is the customize-then-pay flow: on
  submit it posts to `/api/territories/{id}/checkout` and redirects the
  browser straight to the returned Dodo Payments checkout URL.
- `src/components/ClaimedReturn.tsx` handles the `/claimed?territory_id=...`
  return URL Dodo redirects to after payment — it polls the territory
  until the backend webhook has confirmed it as `claimed` (payment
  confirmation is webhook-driven, not redirect-driven, so this is a
  "please wait a moment" screen, not the source of truth).
