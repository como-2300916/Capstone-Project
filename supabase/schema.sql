-- AquaGuard starter schema for Supabase.
-- Run this file in Supabase Dashboard > SQL Editor on a new project.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('receptionist', 'lifeguard')),
  created_at timestamptz not null default now()
);

create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (length(trim(full_name)) > 0),
  age smallint check (age between 0 and 120),
  contact text not null default '',
  notes text not null default '',
  registered_by uuid not null references public.profiles(user_id),
  created_at timestamptz not null default now()
);

create table if not exists public.wristbands (
  band_id text primary key check (length(trim(band_id)) > 0),
  guest_id uuid references public.guests(id) on delete set null,
  assigned_by uuid references public.profiles(user_id),
  status text not null default 'unknown' check (status in ('unknown', 'safe', 'caution', 'restricted', 'offline')),
  zone text not null default 'unknown' check (zone in ('unknown', 'green', 'yellow', 'red')),
  pulse_bpm smallint check (pulse_bpm between 20 and 240),
  battery_percent smallint check (battery_percent between 0 and 100),
  latitude double precision,
  longitude double precision,
  last_seen timestamptz,
  assigned_at timestamptz not null default now()
);

create table if not exists public.monitoring_records (
  id uuid primary key default gen_random_uuid(),
  band_id text not null references public.wristbands(band_id) on delete cascade,
  pulse_bpm smallint check (pulse_bpm between 20 and 240),
  battery_percent smallint check (battery_percent between 0 and 100),
  latitude double precision,
  longitude double precision,
  zone text not null default 'unknown' check (zone in ('unknown', 'green', 'yellow', 'red')),
  sos_pressed boolean not null default false,
  recorded_at timestamptz not null default now()
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  band_id text not null references public.wristbands(band_id) on delete cascade,
  alert_type text not null check (alert_type in ('sos', 'zone', 'low_battery', 'pulse_rate')),
  message text not null,
  status text not null default 'open' check (status in ('open', 'acknowledged', 'resolved')),
  acknowledged_by uuid references public.profiles(user_id),
  acknowledged_at timestamptz,
  created_at timestamptz not null default now()
);

-- Device credentials are hashed. Never place a Supabase service key in device firmware.
create table if not exists public.device_credentials (
  band_id text primary key references public.wristbands(band_id) on delete cascade,
  token_sha256 text not null unique,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists guests_created_at_idx on public.guests (created_at desc);
create index if not exists monitoring_band_recorded_idx on public.monitoring_records (band_id, recorded_at desc);
create index if not exists alerts_status_created_idx on public.alerts (status, created_at desc);

-- RLS helper functions avoid recursive reads of profiles from profile policies.
create or replace function public.current_staff_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.user_id = (select auth.uid())
$$;

create or replace function public.is_aqua_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.current_staff_role() in ('receptionist', 'lifeguard')
$$;

create or replace function public.is_receptionist()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.current_staff_role() = 'receptionist'
$$;

revoke all on function public.current_staff_role() from public;
revoke all on function public.is_aqua_staff() from public;
revoke all on function public.is_receptionist() from public;
grant execute on function public.current_staff_role() to authenticated;
grant execute on function public.is_aqua_staff() to authenticated;
grant execute on function public.is_receptionist() to authenticated;

alter table public.profiles enable row level security;
alter table public.guests enable row level security;
alter table public.wristbands enable row level security;
alter table public.monitoring_records enable row level security;
alter table public.alerts enable row level security;
alter table public.device_credentials enable row level security;

drop policy if exists "staff can read own profile" on public.profiles;
create policy "staff can read own profile" on public.profiles for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "staff can read guests" on public.guests;
create policy "staff can read guests" on public.guests for select to authenticated using ((select public.is_aqua_staff()));
drop policy if exists "receptionists can register guests" on public.guests;
create policy "receptionists can register guests" on public.guests for insert to authenticated with check ((select public.is_receptionist()) and registered_by = (select auth.uid()));
drop policy if exists "receptionists can update guests" on public.guests;
create policy "receptionists can update guests" on public.guests for update to authenticated using ((select public.is_receptionist())) with check ((select public.is_receptionist()));

drop policy if exists "staff can read wristbands" on public.wristbands;
create policy "staff can read wristbands" on public.wristbands for select to authenticated using ((select public.is_aqua_staff()));
drop policy if exists "receptionists can assign wristbands" on public.wristbands;
create policy "receptionists can assign wristbands" on public.wristbands for insert to authenticated with check ((select public.is_receptionist()) and assigned_by = (select auth.uid()));
drop policy if exists "receptionists can update wristbands" on public.wristbands;
create policy "receptionists can update wristbands" on public.wristbands for update to authenticated using ((select public.is_receptionist())) with check ((select public.is_receptionist()));

drop policy if exists "staff can read monitoring records" on public.monitoring_records;
create policy "staff can read monitoring records" on public.monitoring_records for select to authenticated using ((select public.is_aqua_staff()));
-- Intentionally no client insert policy. ESP32 telemetry should be sent to a
-- Supabase Edge Function that validates a device credential before insertion.

drop policy if exists "staff can read alerts" on public.alerts;
create policy "staff can read alerts" on public.alerts for select to authenticated using ((select public.is_aqua_staff()));
drop policy if exists "staff can acknowledge alerts" on public.alerts;
create policy "staff can acknowledge alerts" on public.alerts for update to authenticated using ((select public.is_aqua_staff())) with check ((select public.is_aqua_staff()) and acknowledged_by = (select auth.uid()));

grant select on public.profiles to authenticated;
grant select, insert, update on public.guests to authenticated;
grant select, insert, update on public.wristbands to authenticated;
grant select on public.monitoring_records to authenticated;
grant select, update on public.alerts to authenticated;
revoke all on public.device_credentials from anon, authenticated;

create or replace function public.apply_monitoring_record()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  derived_status text;
  event_type text;
  event_message text;
begin
  derived_status := case
    when new.zone = 'red' then 'restricted'
    when new.zone = 'yellow' then 'caution'
    when new.zone = 'green' then 'safe'
    else 'unknown'
  end;

  update public.wristbands
  set pulse_bpm = coalesce(new.pulse_bpm, pulse_bpm),
      battery_percent = coalesce(new.battery_percent, battery_percent),
      latitude = coalesce(new.latitude, latitude),
      longitude = coalesce(new.longitude, longitude),
      zone = new.zone,
      status = derived_status,
      last_seen = new.recorded_at
  where band_id = new.band_id;

  if new.sos_pressed then
    event_type := 'sos'; event_message := 'SOS button pressed';
  elsif new.zone in ('yellow', 'red') then
    event_type := 'zone'; event_message := 'Wristband entered the ' || new.zone || ' zone';
  elsif new.battery_percent is not null and new.battery_percent < 20 then
    event_type := 'low_battery'; event_message := 'Wristband battery is below 20%';
  elsif new.pulse_bpm is not null and (new.pulse_bpm < 50 or new.pulse_bpm > 130) then
    event_type := 'pulse_rate'; event_message := 'Pulse rate is outside the configured safe range';
  else
    return new;
  end if;

  insert into public.alerts (band_id, alert_type, message) values (new.band_id, event_type, event_message);
  return new;
end;
$$;

drop trigger if exists monitoring_record_updates_band on public.monitoring_records;
create trigger monitoring_record_updates_band after insert on public.monitoring_records
for each row execute function public.apply_monitoring_record();

-- Enable Supabase Realtime for the tables streamed by the Flutter app.
do $$
declare
  t text;
begin
  foreach t in array array['guests', 'wristbands', 'alerts'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end;
$$;
