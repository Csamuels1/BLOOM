-- Phase 4 exit gate (issue #21): deterministic development seed.
--
-- Loaded after migrations on every `supabase db reset` (config.toml
-- [db.seed]). Its only job is to make a freshly reconstructed database
-- useful for local development and to prove reconstruction is repeatable.
--
-- SAFETY (AGENTS.md): support-resource content requires qualified review
-- before it can go live. These fixtures are therefore seeded as unreviewed
-- drafts -- verified false, is_active false -- so nothing here is ever served
-- to a user as approved content. They exist only so queries and screens have
-- shape to render against locally. Meal catalogs are no longer seeded here:
-- the Phase 7 catalog migrations (#29 Nigerian, #30 US) provide them as
-- unreviewed drafts. The analytics event-name allowlist is part of the schema
-- migration, not this seed.
--
-- No user data, auth.users rows, PII, secrets, or production content.
-- Explicit UUIDs + ON CONFLICT DO NOTHING keep the seed idempotent.

-- Meal catalogs are provided by the Phase 7 catalog migrations (#29 Nigerian,
-- #30 US) as unreviewed drafts, so this seed no longer inserts placeholder
-- meals. Support-resource fixtures remain for local screen shape.

-- ---------------------------------------------------------------------------
-- Support-resource fixtures (unreviewed; not verified, not active).
-- Placeholder contact details only -- real resources are verified in-product.
-- ---------------------------------------------------------------------------
insert into public.support_resources
  (id, region, category, name, description, contact_url, verified, is_active)
values
  ('b0000000-0000-4000-8000-000000000001', 'global', 'postpartum',
   'Postpartum support directory (placeholder)',
   'Development fixture; replace with a verified resource before launch.',
   'https://example.org/postpartum', false, false),
  ('b0000000-0000-4000-8000-000000000002', 'global', 'mental_health',
   'Maternal mental-health line (placeholder)',
   'Development fixture; replace with a verified resource before launch.',
   'https://example.org/mental-health', false, false),
  ('b0000000-0000-4000-8000-000000000003', 'nigeria', 'dietitian',
   'Registered dietitian directory (placeholder)',
   'Development fixture; replace with a verified resource before launch.',
   'https://example.org/ng/dietitian', false, false),
  ('b0000000-0000-4000-8000-000000000004', 'united_states', 'crisis',
   'Crisis support (placeholder)',
   'Development fixture; replace with a verified resource before launch.',
   'https://example.org/us/crisis', false, false)
on conflict (id) do nothing;
