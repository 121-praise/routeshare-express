-- =========================================================
-- RouteShare migration 0002b — Movers feature (run AFTER 0002a)
-- Tables, RLS, grants, storage bucket, realtime, admin snippet.
-- Safe to re-run (idempotent where possible).
-- =========================================================

-- ---------- 1. MOVER PROFILES (public, non-sensitive fields only) ----------
create table if not exists public.mover_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected','suspended')),
  rejection_reason text not null default '',
  vehicle_type text check (vehicle_type in ('car','suv','van','minibus','bus','pickup','truck')),
  vehicle_make text not null default '',
  vehicle_model text not null default '',
  vehicle_year int,
  vehicle_color text not null default '',
  vehicle_reg text not null default '',
  service_areas text[] not null default '{}',
  item_categories text[] not null default '{}',
  capacity_kg int,
  capacity_desc text not null default '',
  online boolean not null default false,
  rating numeric(2,1) not null default 5.0,
  jobs_completed int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.mover_profiles to authenticated;
grant all on public.mover_profiles to service_role;
alter table public.mover_profiles enable row level security;
create policy "Anyone signed in can see mover service profiles"
  on public.mover_profiles for select to authenticated using (true);
create policy "Mover manages own profile"
  on public.mover_profiles for insert to authenticated with check (auth.uid() = id);
create policy "Mover or admin updates profile"
  on public.mover_profiles for update to authenticated
  using (auth.uid() = id or public.has_role(auth.uid(), 'admin'));

-- ---------- 2. MOVER DOCUMENTS (private: licence, vehicle photos, insurance) ----------
create table if not exists public.mover_documents (
  id uuid primary key default gen_random_uuid(),
  mover_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('licence','vehicle_photo','insurance','id_card','other')),
  path text not null,
  note text not null default '',
  created_at timestamptz not null default now(),
  unique (mover_id, kind, path)
);
grant select, insert, update, delete on public.mover_documents to authenticated;
grant all on public.mover_documents to service_role;
alter table public.mover_documents enable row level security;
create policy "Mover reads own documents"
  on public.mover_documents for select to authenticated
  using (auth.uid() = mover_id or public.has_role(auth.uid(), 'admin'));
create policy "Mover uploads own documents"
  on public.mover_documents for insert to authenticated with check (auth.uid() = mover_id);
create policy "Mover updates own documents"
  on public.mover_documents for update to authenticated using (auth.uid() = mover_id);
create policy "Mover deletes own documents"
  on public.mover_documents for delete to authenticated using (auth.uid() = mover_id);

-- ---------- 3. MOVING REQUESTS (customer posts; full address revealed via RLS) ----------
create table if not exists public.moving_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  customer_name text not null default '',
  pickup_area text not null default '',
  dest_area text not null default '',
  pickup_address text not null default '',
  dest_address text not null default '',
  pickup_date date,
  pickup_time text not null default '',
  items jsonb not null default '[]'::jsonb, -- [{name, qty, size}]
  vehicle_category text not null default 'any',
  floor_pickup int not null default 0,
  lift_pickup boolean not null default false,
  floor_dest int not null default 0,
  lift_dest boolean not null default false,
  assistance_needed boolean not null default false,
  instructions text not null default '',
  budget int,
  status text not null default 'open' check (status in ('open','quoted','booked','en_route','arrived_pickup','in_transit','delivered','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists moving_requests_status_idx on public.moving_requests (status);
grant select, insert, update, delete on public.moving_requests to authenticated;
grant all on public.moving_requests to service_role;
alter table public.moving_requests enable row level security;
create policy "Request visible to owner, participants, or approved movers while open"
  on public.moving_requests for select to authenticated using (
    customer_id = auth.uid()
    or exists (
      select 1 from public.moving_bookings b
      where b.request_id = moving_requests.id
        and (b.customer_id = auth.uid() or b.mover_id = auth.uid())
    )
    or (
      exists (
        select 1 from public.mover_profiles m
        where m.id = auth.uid() and m.status = 'approved'
      )
      and status in ('open','quoted')
    )
  );
create policy "Customer creates own request"
  on public.moving_requests for insert to authenticated with check (customer_id = auth.uid());
create policy "Customer or assigned mover updates request"
  on public.moving_requests for update to authenticated using (
    customer_id = auth.uid()
    or exists (
      select 1 from public.moving_bookings b
      where b.request_id = moving_requests.id and b.mover_id = auth.uid()
    )
  );

-- ---------- 4. MOVING QUOTES ----------
create table if not exists public.moving_quotes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.moving_requests(id) on delete cascade,
  mover_id uuid not null references auth.users(id) on delete cascade,
  price int not null,
  note text not null default '',
  status text not null default 'pending' check (status in ('pending','accepted','declined','withdrawn')),
  created_at timestamptz not null default now()
);
create index if not exists moving_quotes_request_idx on public.moving_quotes (request_id);
grant select, insert, update, delete on public.moving_quotes to authenticated;
grant all on public.moving_quotes to service_role;
alter table public.moving_quotes enable row level security;
create policy "Quotes visible to quoting mover and request owner"
  on public.moving_quotes for select to authenticated using (
    mover_id = auth.uid()
    or exists (
      select 1 from public.moving_requests r
      where r.id = request_id and r.customer_id = auth.uid()
    )
  );
create policy "Approved mover quotes own price"
  on public.moving_quotes for insert to authenticated with check (
    mover_id = auth.uid()
    and exists (
      select 1 from public.mover_profiles m
      where m.id = auth.uid() and m.status = 'approved'
    )
  );
create policy "Mover or customer updates quote"
  on public.moving_quotes for update to authenticated using (
    mover_id = auth.uid()
    or exists (
      select 1 from public.moving_requests r
      where r.id = request_id and r.customer_id = auth.uid()
    )
  );

-- ---------- 5. MOVING BOOKINGS ----------
create table if not exists public.moving_bookings (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.moving_requests(id) on delete cascade,
  quote_id uuid references public.moving_quotes(id) on delete set null,
  customer_id uuid not null references auth.users(id) on delete cascade,
  mover_id uuid not null references auth.users(id) on delete cascade,
  agreed_price int not null,
  otp text not null default '',
  status text not null default 'booked' check (status in ('booked','en_route','arrived_pickup','in_transit','delivered','completed','cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','paid')),
  customer_confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists moving_bookings_customer_idx on public.moving_bookings (customer_id);
create index if not exists moving_bookings_mover_idx on public.moving_bookings (mover_id);
grant select, insert, update, delete on public.moving_bookings to authenticated;
grant all on public.moving_bookings to service_role;
alter table public.moving_bookings enable row level security;
create policy "Booking visible to its participants"
  on public.moving_bookings for select to authenticated
  using (customer_id = auth.uid() or mover_id = auth.uid());
create policy "Customer creates booking when accepting a quote"
  on public.moving_bookings for insert to authenticated with check (customer_id = auth.uid());
create policy "Participants update booking"
  on public.moving_bookings for update to authenticated
  using (customer_id = auth.uid() or mover_id = auth.uid());

-- Server-side guard: only valid status transitions allowed.
create or replace function public.guard_booking_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status <> old.status then
    if not (
      (old.status = 'booked' and new.status in ('en_route','cancelled'))
      or (old.status = 'en_route' and new.status in ('arrived_pickup','cancelled'))
      or (old.status = 'arrived_pickup' and new.status in ('in_transit','cancelled'))
      or (old.status = 'in_transit' and new.status in ('delivered','cancelled'))
      or (old.status = 'delivered' and new.status in ('completed','cancelled'))
    ) then
      raise exception 'Invalid job status transition % -> %', old.status, new.status;
    end if;
    if new.status = 'completed' and new.customer_confirmed is not true then
      raise exception 'Customer must confirm before a job can be completed';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists guard_booking_transition_trg on public.moving_bookings;
create trigger guard_booking_transition_trg
  before update on public.moving_bookings
  for each row execute function public.guard_booking_transition();

-- ---------- 6. MOVING MESSAGES (booking-linked chat) ----------
create table if not exists public.moving_messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.moving_bookings(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null default '',
  image_path text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists moving_messages_booking_idx on public.moving_messages (booking_id, created_at);
grant select, insert, update, delete on public.moving_messages to authenticated;
grant all on public.moving_messages to service_role;
alter table public.moving_messages enable row level security;
create policy "Participants read booking chat"
  on public.moving_messages for select to authenticated using (
    exists (
      select 1 from public.moving_bookings b
      where b.id = booking_id and (b.customer_id = auth.uid() or b.mover_id = auth.uid())
    )
  );
create policy "Participants send booking chat"
  on public.moving_messages for insert to authenticated with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.moving_bookings b
      where b.id = booking_id and (b.customer_id = auth.uid() or b.mover_id = auth.uid())
    )
  );
create policy "Participants mark messages read"
  on public.moving_messages for update to authenticated using (
    exists (
      select 1 from public.moving_bookings b
      where b.id = booking_id and (b.customer_id = auth.uid() or b.mover_id = auth.uid())
    )
  );

-- ---------- 7. CALL SESSIONS (in-app voice calls, no phone numbers) ----------
create table if not exists public.call_sessions (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.moving_bookings(id) on delete cascade,
  caller_id uuid not null references auth.users(id) on delete cascade,
  callee_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'ringing' check (status in ('ringing','active','ended','declined','missed')),
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.call_sessions to authenticated;
grant all on public.call_sessions to service_role;
alter table public.call_sessions enable row level security;
create policy "Participants see their calls"
  on public.call_sessions for select to authenticated
  using (caller_id = auth.uid() or callee_id = auth.uid());
create policy "Caller starts a call"
  on public.call_sessions for insert to authenticated with check (caller_id = auth.uid());
create policy "Participants update their calls"
  on public.call_sessions for update to authenticated
  using (caller_id = auth.uid() or callee_id = auth.uid());

-- ---------- 8. MOVING PAYMENTS ----------
create table if not exists public.moving_payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.moving_bookings(id) on delete cascade,
  amount int not null,
  status text not null default 'pending' check (status in ('pending','paid','refunded','failed')),
  method text not null default '',
  reference text not null default '',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.moving_payments to authenticated;
grant all on public.moving_payments to service_role;
alter table public.moving_payments enable row level security;
create policy "Payment visible to booking participants"
  on public.moving_payments for select to authenticated using (
    exists (
      select 1 from public.moving_bookings b
      where b.id = booking_id and (b.customer_id = auth.uid() or b.mover_id = auth.uid())
    )
  );
create policy "Participants record payments"
  on public.moving_payments for insert to authenticated with check (
    exists (
      select 1 from public.moving_bookings b
      where b.id = booking_id and (b.customer_id = auth.uid() or b.mover_id = auth.uid())
    )
  );
create policy "Participants update payments"
  on public.moving_payments for update to authenticated using (
    exists (
      select 1 from public.moving_bookings b
      where b.id = booking_id and (b.customer_id = auth.uid() or b.mover_id = auth.uid())
    )
  );

-- ---------- 9. PRIVATE DOCS STORAGE BUCKET ----------
insert into storage.buckets (id, name, public)
values ('mover-docs', 'mover-docs', false)
on conflict (id) do nothing;

drop policy if exists "Mover docs owner read" on storage.objects;
create policy "Mover docs owner read"
  on storage.objects for select to authenticated
  using (bucket_id = 'mover-docs' and (auth.uid()::text = (storage.foldername(name))[1] or public.has_role(auth.uid(), 'admin')));
drop policy if exists "Mover docs owner write" on storage.objects;
create policy "Mover docs owner write"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'mover-docs' and auth.uid()::text = (storage.foldername(name))[1]);
drop policy if exists "Mover docs owner update" on storage.objects;
create policy "Mover docs owner update"
  on storage.objects for update to authenticated
  using (bucket_id = 'mover-docs' and auth.uid()::text = (storage.foldername(name))[1]);
drop policy if exists "Mover docs owner delete" on storage.objects;
create policy "Mover docs owner delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'mover-docs' and auth.uid()::text = (storage.foldername(name))[1]);

-- ---------- 10. REALTIME ----------
alter publication supabase_realtime add table public.moving_requests;
alter publication supabase_realtime add table public.moving_quotes;
alter publication supabase_realtime add table public.moving_bookings;
alter publication supabase_realtime add table public.moving_messages;
alter publication supabase_realtime add table public.call_sessions;

-- ---------- 11. OPTIONAL: promote an admin account (uncomment and run) ----------
-- Replaces the local admin flag with a real database role so the Admin
-- dashboard can approve/reject movers. Run once:
--   insert into public.user_roles (user_id, role)
--   select id, 'admin' from auth.users where email = 'angeljamgbadi@gmail.com'
--   on conflict (user_id, role) do nothing;
-- To also promote someone to mover instantly for testing:
--   insert into public.mover_profiles (id, status, vehicle_type, service_areas, item_categories)
--   select id, 'approved', 'van', '{Yaba,Ikeja}', '{Furniture,Appliances}'
--   from auth.users where email = 'angeljamgbadi@gmail.com'
--   on conflict (id) do update set status = 'approved';
