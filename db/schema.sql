-- =========================================================
-- RouteShare schema (run in Supabase SQL editor)
-- Safe to re-run.
-- =========================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

-- ---------- ROLES (separate table to avoid privilege escalation) ----------
do $$ begin
  create type public.app_role as enum ('admin','rider','customer');
exception when duplicate_object then null; end $$;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

drop policy if exists "user_roles self read" on public.user_roles;
create policy "user_roles self read" on public.user_roles
  for select using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- ---------- PROFILES ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  phone text not null default '',
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.profiles enable row level security;

drop policy if exists "profiles read all" on public.profiles;
drop policy if exists "profiles self insert" on public.profiles;
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles read all" on public.profiles for select using (true);
create policy "profiles self insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles self update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create profile + role on signup (role read from raw_user_meta_data.role)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  _role public.app_role;
begin
  insert into public.profiles (id, name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name',''),
    coalesce(new.raw_user_meta_data->>'phone','')
  )
  on conflict (id) do nothing;

  begin
    _role := (coalesce(new.raw_user_meta_data->>'role','customer'))::public.app_role;
  exception when others then
    _role := 'customer';
  end;

  insert into public.user_roles (user_id, role) values (new.id, _role)
  on conflict do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

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

-- ============= RLS for app tables =============
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
create policy "routes insert auth" on public.routes for insert to authenticated with check (auth.uid() = rider_id);
create policy "routes update owner" on public.routes for update to authenticated using (auth.uid() = rider_id) with check (auth.uid() = rider_id);
create policy "routes delete owner" on public.routes for delete to authenticated using (auth.uid() = rider_id);

create policy "dr read all" on public.delivery_requests for select using (true);
create policy "dr insert auth" on public.delivery_requests for insert to authenticated with check (auth.uid() = customer_id);
create policy "dr update auth" on public.delivery_requests for update to authenticated using (true) with check (true);

create policy "b read all" on public.broadcasts for select using (true);
create policy "b insert auth" on public.broadcasts for insert to authenticated with check (true);

-- ============= STORAGE: avatars =============
insert into storage.buckets (id, name, public)
values ('avatars','avatars', true)
on conflict (id) do nothing;

do $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname='storage' and tablename='objects' and policyname like 'avatars %'
  loop execute format('drop policy if exists %I on storage.objects', p.policyname); end loop;
end $$;

create policy "avatars public read" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars auth write" on storage.objects for insert to authenticated with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars auth update" on storage.objects for update to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars auth delete" on storage.objects for delete to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============= REALTIME =============
do $$
begin
  begin alter publication supabase_realtime add table public.routes; exception when others then null; end;
  begin alter publication supabase_realtime add table public.delivery_requests; exception when others then null; end;
  begin alter publication supabase_realtime add table public.broadcasts; exception when others then null; end;
end $$;
