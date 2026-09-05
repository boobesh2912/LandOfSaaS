-- LandOfSaaS schema. Run in the Supabase SQL editor, then `npm run seed`.

create extension if not exists "pgcrypto";

create table if not exists public.buildings (
  id                  uuid primary key default gen_random_uuid(),
  slug                text unique not null,
  name                text not null,
  size                text not null default 'small' check (size in ('small','medium','large')),
  sort_order          int  not null default 0,

  current_price_cents int  not null default 0,
  status              text not null default 'available'
                        check (status in ('available','pending','owned','locked')),
  takeover_count      int  not null default 0,

  owner_name          text,
  owner_url           text,
  owner_color         text,
  owner_logo_url      text,
  owner_email         text,
  owned_at            timestamptz,

  -- Set when somebody opens checkout, promoted to owner_* only by the webhook.
  pending_name        text,
  pending_url         text,
  pending_color       text,
  pending_logo_url    text,
  pending_email       text,
  pending_price_cents int,
  pending_size        text check (pending_size in ('small','medium','large')),
  hold_expires_at     timestamptz,

  dodo_session_id     text unique,
  dodo_payment_id     text unique,
  created_at          timestamptz not null default now()
);

create index if not exists buildings_status_idx on public.buildings (status);
create index if not exists buildings_sort_idx   on public.buildings (sort_order);

-- What an outgoing owner is owed after being taken over. This is a ledger the
-- team settles; nothing here moves money on its own.
create table if not exists public.payouts (
  id              uuid primary key default gen_random_uuid(),
  building_id     uuid references public.buildings(id) on delete set null,
  recipient_email text not null,
  recipient_name  text,
  amount_cents    int  not null check (amount_cents >= 0),
  reason          text not null default 'takeover_uplift',
  status          text not null default 'pending' check (status in ('pending','paid','void')),
  created_at      timestamptz not null default now()
);

create index if not exists payouts_status_idx on public.payouts (status);

-- The browser never talks to these tables directly: every read and write goes
-- through this app's server routes using the service role key. RLS is on with
-- no anon policies, so a leaked anon key still reads nothing.
alter table public.buildings enable row level security;
alter table public.payouts   enable row level security;
