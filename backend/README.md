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

## SDK version note

Pin `dodopayments[webhooks]==1.115.0` (already set in `requirements.txt`).
An earlier draft of this integration was written against a stale pinned
version (1.7.0) that predates `checkout_sessions` and `webhooks.unwrap()`
entirely — it would fail with `AttributeError` immediately. The current
pin was verified directly against the installed SDK's source (not just
docs): `checkout_sessions.create(product_cart=[{product_id, quantity,
amount}], customer={email}, metadata, return_url)` returns
`.checkout_url` / `.session_id`; `client.webhooks.unwrap(payload: str,
headers=...)` needs the `[webhooks]` extra (`standardwebhooks` package)
and a `webhook_key` (passed at client construction in `dodo_client.py`);
and the `payment.succeeded` event's `.data` is a `Payment` object with
real `.metadata` (plain dict), `.payment_id`, and `.checkout_session_id`
fields — all exactly what `routers/webhooks.py` expects. No guesswork
left in this path.

## ⚠️ Sandboxed dev environments may block Dodo's API outright

If checkout creation fails with `Could not start checkout with Dodo
Payments`, check whether it's a network policy block before assuming a
code bug: some sandboxed/cloud dev containers (including the one this was
originally built in) run outbound traffic through an egress proxy that
only allows a fixed set of hosts, and `test.dodopayments.com` /
`live.dodopayments.com` may not be on it. That shows up as
`dodopayments.APIConnectionError` under the hood. It's an environment
setting, not an app bug — check your sandbox's network/egress policy (or
just run the backend somewhere with normal internet access, e.g. your own
machine or a real host like Railway/Fly) and it resolves itself.
