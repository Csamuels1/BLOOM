-- Phase 4, issue #17: profile, measurement, cycle, and preference schema.
--
-- Models private per-user data with canonical units (height in cm, weight in
-- kg). Row-Level Security is ENABLED on every table here with no policies yet,
-- so access is denied by default; operation-specific grants and policies are
-- added in issue #19. Nothing is exposed until then.

-- Keep updated_at current on profile edits.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- One private profile per authenticated user.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  goal text not null check (goal in ('loss', 'maintenance', 'gain')),
  height_cm integer check (height_cm between 120 and 230),
  country_code char(2) check (country_code ~ '^[A-Z]{2}$'),
  unit_system text not null default 'metric'
    check (unit_system in ('metric', 'imperial')),
  postpartum_status text
    check (postpartum_status in ('postpartum', 'not_postpartum', 'prefer_not_to_say')),
  postpartum_months integer check (postpartum_months between 0 and 24),
  feeding_context text
    check (feeding_context in ('breastfeeding', 'mixed', 'formula', 'not_feeding', 'prefer_not_to_say')),
  dietary_preferences text[] not null default '{}',
  allergens text[] not null default '{}',
  track_cycle boolean not null default false,
  age_confirmed boolean not null default false,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Months are only meaningful for a postpartum profile.
  constraint postpartum_months_requires_status
    check (postpartum_months is null or postpartum_status = 'postpartum')
);

comment on table public.profiles is
  'Private per-user profile derived from onboarding. Canonical units: height in cm.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- Weight logging, stored canonically in kilograms.
create table public.weight_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  weight_kg numeric(5, 2) not null check (weight_kg > 0 and weight_kg < 400),
  measured_at date not null default current_date,
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now()
);

comment on table public.weight_measurements is
  'Private weight entries, canonical unit kilograms.';

create index weight_measurements_user_measured_idx
  on public.weight_measurements (user_id, measured_at desc);

-- Optional cycle context: one entry per start date per user.
create table public.cycle_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  started_on date not null,
  created_at timestamptz not null default now(),
  constraint cycle_logs_unique_start unique (user_id, started_on)
);

comment on table public.cycle_logs is
  'Private, optional cycle start dates.';

create index cycle_logs_user_started_idx
  on public.cycle_logs (user_id, started_on desc);

-- Deny-by-default until policies are added in issue #19.
alter table public.profiles enable row level security;
alter table public.weight_measurements enable row level security;
alter table public.cycle_logs enable row level security;
