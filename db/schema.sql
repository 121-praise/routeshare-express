-- =========================================================
-- RouteShare initial schema
-- Run this in your Supabase SQL editor (Dashboard → SQL → New query).
-- Safe to re-run.
-- =========================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

-- ---------- ROUTES ----------
create table if not exists public.routes (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid not null,
  rider_name text not null,
  rider_phone text not null,
  rider_rating numeric(2,1) default 5.0,
  rider_trips int default 0,
  pickup_area text not null,
  destination_area text not null,
  departure_time timestamptz not null,
  capacity int not null check (capacity > 0),
  price_per_package int not null,
  vehicle text not null check (vehicle in ('Bike','Keke','Van')),
  eta_minutes int not null default 60,
  min_slots_to_start int not null default 3,
  status text not null default 'scheduled' check (status in ('scheduled','ongoing','completed','cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists routes_pickup_idx on public.routes (lower(pickup_area));
create index if not exists routes_dest_idx on public.routes (lower(destination_area));
create index if not exists routes_status_idx on public.routes (status);

drop trigger if exists trg_routes_updated on public.routes;
create trigger trg_routes_updated before update on public.routes
for each row execute function public.set_updated_at();

-- ---------- DELIVERY REQUESTS ----------
create table if not exists public.delivery_requests (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id) on delete cascade,
  customer_id uuid not null,
  customer_name text not null,
  customer_phone text not null,
  sender_name text not null,
  receiver_name text not null,
  receiver_phone text not null,
  pickup_address text not null,
  dropoff_address text not null,
  amount int not null,
  otp text not null,
  status text not null default 'pending' check (status in ('pending','accepted','declined','paid','in_transit','delivered','cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists dr_route_idx on public.delivery_requests (route_id);
create index if not exists dr_customer_idx on public.delivery_requests (customer_id);
create index if not exists dr_status_idx on public.delivery_requests (status);

drop trigger if exists trg_dr_updated on public.delivery_requests;
create trigger trg_dr_updated before update on public.delivery_requests
for each row execute function public.set_updated_at();

-- ---------- BROADCASTS ----------
create table if not exists public.broadcasts (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id) on delete cascade,
  text text not null,
  kind text not null default 'message' check (kind in ('message','trip_started','trip_completed')),
  created_at timestamptz default now()
);
create index if not exists b_route_idx on public.broadcasts (route_id, created_at desc);

-- ============= RLS =============
alter table public.routes enable row level security;
alter table public.delivery_requests enable row level security;
alter table public.broadcasts enable row level security;

do $$
declare p record;
begin
  for p in select tablename, policyname from pg_policies
           where schemaname='public' and tablename in ('routes','delivery_requests','broadcasts')
  loop
    execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

create policy "routes read all" on public.routes for select using (true);
create policy "routes insert all" on public.routes for insert with check (true);
create policy "routes update all" on public.routes for update using (true) with check (true);
create policy "routes delete all" on public.routes for delete using (true);

create policy "dr read all" on public.delivery_requests for select using (true);
create policy "dr insert all" on public.delivery_requests for insert with check (true);
create policy "dr update all" on public.delivery_requests for update using (true) with check (true);
create policy "dr delete all" on public.delivery_requests for delete using (true);

create policy "b read all" on public.broadcasts for select using (true);
create policy "b insert all" on public.broadcasts for insert with check (true);

-- ============= REALTIME =============
do $$
begin
  begin alter publication supabase_realtime add table public.routes; exception when others then null; end;
  begin alter publication supabase_realtime add table public.delivery_requests; exception when others then null; end;
  begin alter publication supabase_realtime add table public.broadcasts; exception when others then null; end;
end $$;
