# LandOfSaaS — building slot board

Next.js app where founders buy a plot scattered across a floating isometric
board, brand it, and keep it until somebody buys it out from under them.

## Run it

```bash
npm install
cp .env.example .env.local
npm run dev
```

With no Supabase credentials set, the board runs against a local JSON store at
`.data/buildings.json` (auto-created from `src/data/buildings.seed.json`), so
`npm run dev` works on a fresh clone with nothing else configured. Add the
Supabase vars and the same code paths switch to Postgres.

## Supabase

1. Run `supabase/schema.sql` in the SQL editor.
2. Put `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.
3. `npm run seed` — inserts any plots that don't exist yet, and never touches
   plots that already sold.
4. For logo uploads, create a public Storage bucket named `logos`.

RLS is enabled with no anon policies: the browser never talks to Supabase
directly, only this app's server routes using the service role key.

## Dodo Payments

Create one **one-time product with Pay What You Want pricing** enabled and a
low minimum, then set `DODO_PAYMENTS_PRODUCT_ID`. Every purchase reuses that
product and overrides the exact amount server-side, which is how one product
covers small/medium/large plus takeovers at any price.

Point a webhook at `https://<your-app>/api/webhooks/dodo` and copy its signing
secret into `DODO_PAYMENTS_WEBHOOK_KEY`. Locally, tunnel it (`ngrok http 3000`
or `cloudflared tunnel --url http://localhost:3000`) — Dodo can't reach
`localhost`.

## The rules the code enforces

- **Price is never taken from the browser.** `POST /api/checkout` recomputes
  the floor from stored state; a submitted amount can only ever raise it.
- **Takeover floor** is 1.5× what the current owner paid, rounded up to whole
  dollars ($20 owned → $30 to take it).
- **The outgoing owner** is credited half the uplift as a row in `payouts`.
  That's a ledger for the team to settle — nothing in this app moves money out.
- **Only the webhook grants a plot.** The browser's return from checkout is
  cosmetic and polls until the signed `payment.succeeded` event lands.
- **Claiming is atomic.** A single conditional UPDATE moves a plot to `pending`,
  so two people clicking the same tile can't both win it. Unpaid holds expire
  after `CHECKOUT_HOLD_MINUTES`.
- **Uploaded logos** are checked by magic bytes, not filename or Content-Type;
  only real PNG/JPEG/WebP pass, and SVG is rejected because these files are
  served back to every visitor.
- **Pending branding stays private** until payment confirms, so browsing the
  board can't leak a company mid-checkout.

## Hero artwork

The hero renders a built-in SVG landscape. To use your own image instead, drop
it at `public/hero.jpg` — it layers on top automatically, blurred and veiled by
`.hero-bg` / `.hero-veil` in `globals.css`.

## Not built yet

- **Supabase Auth.** The schema and routes are auth-ready (`owner_email` is the
  identity anchor), but there's no login or owner dashboard — the buy/takeover
  loop works without an account today.
- Payout settlement beyond the ledger row.
