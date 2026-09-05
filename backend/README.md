# LandOfSaaS — Backend (FastAPI)

Phase 1 MVP API: serves the procedurally-generated territory map, runs the
Dodo Payments checkout, and confirms ownership from a signed webhook.

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Fill in `.env`:

- `DODO_PAYMENTS_API_KEY` — your **test mode** secret key from the Dodo
  Payments dashboard. Never paste this into a chat, PR, or commit — `.env`
  is gitignored for exactly this reason.
- `DODO_PAYMENTS_PRODUCT_ID` — create ONE one-time product in the Dodo
  dashboard (e.g. "LandOfSaaS Territory Claim") with **Pay What You Want**
  pricing enabled and a low minimum (e.g. $1). Every checkout reuses this
  same product but overrides the exact amount per purchase (area × rate),
  which is how one product supports fully dynamic land pricing.
- `DODO_PAYMENTS_WEBHOOK_KEY` — after you register a webhook endpoint in
  the dashboard pointing at `https://<your-api>/api/webhooks/dodo`, copy
  its signing secret here.

Run it:

```bash
uvicorn app.main:app --reload --port 8000
```

On first startup it auto-generates and seeds ~55 territories (see
`app/map_generator.py`). Re-run generation any time with:

```bash
python -m app.map_generator --force
```

## Local webhook testing

Dodo can't reach `localhost` directly. Use a tunnel (e.g. `ngrok http 8000`
or `cloudflared tunnel --url http://localhost:8000`) and point the
dashboard's webhook endpoint at the tunnel URL + `/api/webhooks/dodo`
while you test.

## Security notes (read before going to production)

- **The webhook is the only path that grants ownership.** The
  browser-side "success" redirect is cosmetic only — see the docstring in
  `app/routers/webhooks.py`.
- **Signatures are verified**, not trusted, using the official SDK's
  `client.webhooks.unwrap()` (Standard Webhooks spec: `webhook-id` /
  `webhook-signature` / `webhook-timestamp` headers, HMAC-SHA256).
- **Price is never taken from the client.** `POST /checkout/{id}` always
  recomputes the amount from the territory's fixed, server-generated area.
- **Territory holds are atomic**: claiming a spot is a single conditional
  `UPDATE ... WHERE status = 'available'`, so two buyers racing for the
  same patch can't both win it.
- **Uploaded logos are never trusted as-is**: they're decoded, verified as
  real raster images, and re-encoded to a fresh PNG (see
  `app/services/images.py`) before storage — this strips any
  script/polyglot payload hidden inside an uploaded file.
- **Unclaimed customization data is never exposed.** A `pending` hold's
  company name/logo/etc. isn't shown publicly until the webhook confirms
  payment, so a mid-checkout browse can't leak a brand before it's paid
  for.

## ⚠️ One thing to verify against your live Dodo dashboard

I built the Dodo integration from their public docs and Python SDK source
(this sandbox couldn't reach `docs.dodopayments.com` directly to double
check field-by-field). The mechanics — `checkout_sessions.create(...)`
with a `product_cart` item carrying an explicit `amount`, and
`client.webhooks.unwrap()` for verification — are correct per the SDK.
The one thing worth confirming with a real **test-mode** purchase before
going live: that `metadata.territory_id` actually round-trips onto the
`payment.succeeded` event's `data.metadata`. The webhook handler already
has a fallback match by `dodo_checkout_session_id` in case it doesn't, and
logs a clear error if neither matches (see `routers/webhooks.py`) — but
run one real test purchase and watch the log before trusting it in
production.
