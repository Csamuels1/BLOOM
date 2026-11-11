-- Phase 4 exit gate (issue #21): deterministic development seed.
--
-- Loaded after migrations on every `supabase db reset` (config.toml
-- [db.seed]). Its only job is to make a freshly reconstructed database
-- useful for local development and to prove reconstruction is repeatable.
--
-- SAFETY (AGENTS.md): meal and support-resource content requires qualified
-- review before it can go live. These fixtures are therefore seeded as
-- unreviewed drafts -- review_status 'draft', verified false, is_active
-- false, reviewed_by null -- so nothing here is ever served to a user as
-- approved content. They exist only so queries and screens have shape to
-- render against locally. The analytics event-name allowlist is part of the
-- schema migration, not this seed.
--
-- No user data, auth.users rows, PII, secrets, or production content.
-- Explicit UUIDs + ON CONFLICT DO NOTHING keep the seed idempotent.

-- ---------------------------------------------------------------------------
-- Meal catalog fixtures (unreviewed drafts; not active).
-- ---------------------------------------------------------------------------
insert into public.meals
  (id, name, region, goals, calories_min, calories_max,
   ingredients, allergens, dietary_tags, source, review_status, is_active)
values
  ('a0000000-0000-4000-8000-000000000001', 'Jollof rice with grilled chicken',
   'nigeria', '{maintenance,gain}', 520, 680,
  
  
  '{rice,tomato,chicken,pepper,onion}', '{}', '{high_protein}',
   'seed:dev-fixture', 'draft', false),
  ('a0000000-0000-4000-8000-000000000002', 'Efo riro with lean beef',
   'nigeria', '{loss,maintenance}', 380, 520,
   '{spinach,beef,palm_oil,pepper,crayfish}', '{shellfish}', '{high_protein}',
   'seed:dev-fixture', 'draft', false),
  ('a0000000-0000-4000-8000-000000000003', 'Oatmeal with berries and almonds',
   'united_states', '{loss,maintenance}', 300, 420,
   '{oats,milk,blueberry,almond}', '{tree_nuts,dairy}', '{vegetarian}',
   'seed:dev-fixture', 'draft', false),
  ('a0000000-0000-4000-8000-000000000004', 'Grilled salmon with quinoa',
   'united_states', '{maintenance,gain}', 560, 720,
   '{salmon,quinoa,broccoli,olive_oil}', '{fish}', '{high_protein,gluten_free}',
   'seed:dev-fixture', 'draft', false),
  ('a0000000-0000-4000-8000-000000000005', 'Lentil stew with brown rice',
   'both', '{loss,maintenance,gain}', 440, 600,
   '{lentils,rice,tomato,onion,spinach}', '{}', '{vegan,high_fiber}',
   'seed:dev-fixture', 'draft', false)
on conflict (id) do nothing;

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
