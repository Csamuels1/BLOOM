-- Nigerian meal seed catalog coverage (issue #29, Phase 7).
-- Confirms the seeded draft catalog is complete, honest, and inactive.
-- Runs as superuser (RLS bypassed); meal writes are otherwise service-role only.
begin;
select plan(11);

-- Every Nigerian meal carries honest provenance.
select is(
  (select count(*)::int from public.meals
     where region = 'nigeria'
       and (source is null or btrim(source) = '')),
  0,
  'every Nigerian meal has a non-null, non-empty source');

-- Every Nigerian meal has a slot.
select is(
  (select count(*)::int from public.meals
     where region = 'nigeria' and slot is null),
  0,
  'every Nigerian meal has a meal slot');

-- Every Nigerian meal has macros.
select is(
  (select count(*)::int from public.meals
     where region = 'nigeria'
       and (protein_g is null or carbs_g is null or fat_g is null)),
  0,
  'every Nigerian meal has protein, carbs, and fat');

-- Nothing is active before dietitian review (#33).
select is(
  (select count(*)::int from public.meals
     where region = 'nigeria' and is_active is distinct from false),
  0,
  'no Nigerian meal is active pre-review');

-- Everything is in_review (draft scaffold), nothing approved/rejected/draft.
select is(
  (select count(*)::int from public.meals
     where region = 'nigeria' and review_status is distinct from 'in_review'),
  0,
  'every Nigerian meal is review_status = in_review');

-- Calories range and macros are sane across the catalog.
select is(
  (select count(*)::int from public.meals
     where region = 'nigeria' and calories_max < calories_min),
  0,
  'calories_max >= calories_min for every Nigerian meal');

select is(
  (select count(*)::int from public.meals
     where region = 'nigeria'
       and (protein_g < 0 or carbs_g < 0 or fat_g < 0)),
  0,
  'no Nigerian meal has a negative macro');

-- All four slots are represented.
select is(
  (select count(distinct slot)::int from public.meals
     where region = 'nigeria'
       and slot in ('breakfast', 'lunch', 'dinner', 'snack')),
  4,
  'all four meal slots are present in the Nigerian catalog');

-- At least six meals per slot (seven-day + swap coverage).
select cmp_ok(
  (select min(c)::int from (
     select count(*) as c from public.meals
       where region = 'nigeria'
       group by slot) per_slot),
  '>=', 6,
  'the thinnest Nigerian slot still has at least six meals (>= 6 each)');

-- Overall catalog size (4 slots x >= 6).
select cmp_ok(
  (select count(*)::int from public.meals where region = 'nigeria'),
  '>=', 24,
  'at least 24 Nigerian meals are seeded');

-- Allergens stay within the agreed controlled vocabulary (safety-critical).
select is(
  (select count(*)::int from public.meals m
     where m.region = 'nigeria'
       and exists (
         select 1 from unnest(m.allergens) a
         where a not in ('shellfish', 'fish', 'tree_nuts', 'peanuts',
                         'dairy', 'egg', 'gluten', 'soy'))),
  0,
  'every Nigerian meal uses only the controlled allergen vocabulary');

select * from finish();
rollback;
