-- Phase 4, issue #18: meals, community, subscriptions, resources, moderation,
-- and analytics schema.
--
-- Models the remaining product areas with audit and version fields for
-- traceability. Meals and support resources carry sourcing and safety-review
-- metadata (content requires qualified review before production, ADR-0003).
-- RLS is ENABLED deny-by-default on every table; grants and operation-specific
-- policies are added in issue #19. public.set_updated_at() is defined in the
-- issue #17 migration and reused here.

-- ---------------------------------------------------------------------------
-- Meal catalog (used by recommendations in Phase 7). Calories are a RANGE.
-- ---------------------------------------------------------------------------
create table public.meals (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 200),
  region text not null check (region in ('nigeria', 'united_states', 'both')),
  goals text[] not null default '{}',
  calories_min integer not null check (calories_min >= 0),
  calories_max integer not null check (calories_max >= calories_min),
  ingredients text[] not null default '{}',
  allergens text[] not null default '{}',
  dietary_tags text[] not null default '{}',
  -- Sourcing metadata (provenance).
  source text,
  author text,
  -- Safety metadata (qualified review before a meal can go live).
  review_status text not null default 'draft'
    check (review_status in ('draft', 'in_review', 'approved', 'rejected')),
  reviewed_by uuid references auth.users (id),
  reviewed_at timestamptz,
  -- Traceability.
  version integer not null default 1 check (version >= 1),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- A meal may only be active once its content is approved.
  constraint meals_active_requires_approved
    check (not is_active or review_status = 'approved')
);

comment on table public.meals is
  'Regional meal catalog with sourcing and safety-review metadata. Calories are a range.';

create index meals_region_status_idx on public.meals (region, review_status);
create index meals_active_idx on public.meals (is_active) where is_active;

create trigger meals_set_updated_at
  before update on public.meals
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Verified regional support resources (safety-reviewed).
-- ---------------------------------------------------------------------------
create table public.support_resources (
  id uuid primary key default gen_random_uuid(),
  region text not null check (region in ('nigeria', 'united_states', 'global')),
  category text not null
    check (category in ('crisis', 'mental_health', 'dietitian', 'postpartum', 'general')),
  name text not null check (char_length(name) between 1 and 200),
  description text,
  contact_phone text,
  contact_url text,
  verified boolean not null default false,
  reviewed_by uuid references auth.users (id),
  reviewed_at timestamptz,
  version integer not null default 1 check (version >= 1),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint support_resources_active_requires_verified
    check (not is_active or verified)
);

comment on table public.support_resources is
  'Verified regional support resources; safety content requires review.';

create index support_resources_region_category_idx
  on public.support_resources (region, category);

create trigger support_resources_set_updated_at
  before update on public.support_resources
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Entitlements (Free/Pro), enforced server-side in later phases.
-- ---------------------------------------------------------------------------
create table public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  tier text not null default 'free' check (tier in ('free', 'pro')),
  status text not null default 'active'
    check (status in ('active', 'expired', 'in_grace', 'paused')),
  source text not null default 'revenuecat',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.subscriptions is
  'Per-user entitlement; authorization is enforced server-side, not from this row alone.';

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Community: posts, support reactions, reports, blocks.
-- ---------------------------------------------------------------------------
create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.community_posts is
  'Community posts; pending until moderation approves. Not public while pending.';

create index community_posts_status_idx on public.community_posts (status);
create index community_posts_author_idx
  on public.community_posts (author_id, created_at desc);

create trigger community_posts_set_updated_at
  before update on public.community_posts
  for each row execute function public.set_updated_at();

create table public.post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  reaction text not null default 'support' check (reaction in ('support')),
  created_at timestamptz not null default now(),
  constraint post_reactions_unique unique (post_id, user_id, reaction)
);

create index post_reactions_post_idx on public.post_reactions (post_id);

create table public.post_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reason text not null
    check (reason in ('spam', 'harassment', 'unsafe', 'other')),
  details text check (char_length(details) <= 1000),
  status text not null default 'open'
    check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- One report per reporter per post. Reporter identity is protected by RLS (#19).
  constraint post_reports_unique unique (post_id, reporter_id)
);

create index post_reports_status_idx on public.post_reports (status);

create trigger post_reports_set_updated_at
  before update on public.post_reports
  for each row execute function public.set_updated_at();

create table public.user_blocks (
  blocker_id uuid not null references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint user_blocks_not_self check (blocker_id <> blocked_id)
);

-- ---------------------------------------------------------------------------
-- Moderation audit: append-only history (immutability enforced in #19).
-- ---------------------------------------------------------------------------
create table public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  moderator_id uuid not null references auth.users (id),
  target_type text not null check (target_type in ('post', 'user', 'report')),
  target_id uuid not null,
  action text not null
    check (action in ('approve', 'remove', 'warn', 'block', 'dismiss_report', 'resolve_report')),
  reason text check (char_length(reason) <= 1000),
  created_at timestamptz not null default now()
);

comment on table public.moderation_actions is
  'Append-only moderation audit history; immutability is enforced by policy in #19.';

create index moderation_actions_target_idx
  on public.moderation_actions (target_type, target_id);

-- ---------------------------------------------------------------------------
-- Analytics: a fixed allowlist of event names, no arbitrary property bags
-- (docs/SECURITY_BASELINE.md).
-- ---------------------------------------------------------------------------
create table public.analytics_event_types (
  name text primary key,
  description text not null
);

comment on table public.analytics_event_types is
  'Allowlist of permitted product analytics event names.';

insert into public.analytics_event_types (name, description) values
  ('onboarding_started', 'User opened the onboarding flow'),
  ('onboarding_completed', 'User finished onboarding'),
  ('weight_logged', 'User saved a weight entry'),
  ('meal_viewed', 'User viewed a meal suggestion'),
  ('community_post_created', 'User created a community post');

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null references public.analytics_event_types (name),
  user_id uuid references auth.users (id) on delete set null,
  occurred_at timestamptz not null default now()
);

comment on table public.analytics_events is
  'Allowlisted product events only; no weight, meals, free text, email, or location.';

create index analytics_events_name_time_idx
  on public.analytics_events (event_name, occurred_at desc);
create index analytics_events_user_idx on public.analytics_events (user_id);

-- ---------------------------------------------------------------------------
-- Deny-by-default until policies are added in issue #19.
-- ---------------------------------------------------------------------------
alter table public.meals enable row level security;
alter table public.support_resources enable row level security;
alter table public.subscriptions enable row level security;
alter table public.community_posts enable row level security;
alter table public.post_reactions enable row level security;
alter table public.post_reports enable row level security;
alter table public.user_blocks enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.analytics_event_types enable row level security;
alter table public.analytics_events enable row level security;
