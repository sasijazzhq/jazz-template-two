# Data model

## Today
Everything is in the browser (`localStorage` key `rusi.v1`, `src/lib/store.ts`): the current session, up to 20 past sessions, 5 recent searches and the location. Screenshots are never persisted. "Delete my data" removes the key.

## Optional Supabase schema (designed, not wired up)
All money columns are `bigint` paise. All user tables have `user_id uuid references auth.users on delete cascade`.

```sql
create table restaurants (id uuid primary key default gen_random_uuid(), name text not null, provider text, provider_ref text);
create table branches (id uuid primary key default gen_random_uuid(), restaurant_id uuid references restaurants, area text not null,
  address text, lat double precision, lng double precision, phone_e164 text, phone_verified_at timestamptz);
create table food_items (id uuid primary key default gen_random_uuid(), restaurant_id uuid references restaurants, name text not null, portion text);

create table comparison_sessions (id uuid primary key default gen_random_uuid(), user_id uuid not null, branch_id uuid references branches,
  item_name text not null, quantity int not null check (quantity between 1 and 99), preference text not null,
  selected_option text, created_at timestamptz not null default now());
create table price_quotes (id uuid primary key default gen_random_uuid(), session_id uuid not null references comparison_sessions on delete cascade,
  user_id uuid not null, source text not null check (source in ('swiggy','zomato','takeaway','courier')),
  amount_paise bigint not null check (amount_paise > 0), status text not null, eta_minutes int, breakdown jsonb,
  captured_at timestamptz not null);
create table screenshot_extractions (id uuid primary key default gen_random_uuid(), quote_id uuid references price_quotes on delete cascade,
  user_id uuid not null, storage_path text, raw_output jsonb, confidence real, warnings text[],
  created_at timestamptz not null default now(), delete_after timestamptz not null default now() + interval '24 hours');
create table orders (id uuid primary key default gen_random_uuid(), session_id uuid not null references comparison_sessions on delete cascade,
  user_id uuid not null, status text not null, mode text not null, approved boolean not null default false,
  confirmed_price_paise bigint, ready_in_minutes int, call_attempts int not null default 0);
create table call_sessions (id uuid primary key default gen_random_uuid(), order_id uuid not null references orders on delete cascade,
  user_id uuid not null, idempotency_key uuid not null unique, mode text not null, consent_at timestamptz not null,
  provider_call_id text, outcome text, started_at timestamptz, ended_at timestamptz);
create table courier_quotes (id uuid primary key default gen_random_uuid(), order_id uuid not null references orders on delete cascade,
  user_id uuid not null, quote_paise bigint not null, source text not null, approved_at timestamptz, booked_at timestamptz);
create table audit_events (id bigint generated always as identity primary key, order_id uuid not null references orders on delete cascade,
  user_id uuid not null, type text not null, from_status text not null, to_status text not null, source text not null,
  note text, at timestamptz not null default now());
```

## Row-level security
Enable RLS on every table. Catalogue tables (`restaurants`, `branches`, `food_items`) are read-only to clients. Every user table gets:
```sql
create policy own_rows on <table> for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```
`audit_events` is insert + select only (no update or delete policy).

## Retention and deletion
- Screenshots: private bucket, deleted after extraction or at `delete_after` (24h) by a scheduled job; prefer not storing them at all.
- Call audio and transcripts are not stored by Rusi.
- Account deletion cascades from `auth.users`. A "delete my data" action deletes the user's sessions (cascading to quotes, orders, calls, audit).
