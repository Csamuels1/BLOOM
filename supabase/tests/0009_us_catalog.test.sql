-- US meal seed catalog coverage (issue #30, Phase 7).
-- Confirms the seeded United States catalog is a complete, auditable DRAFT:
-- every meal carries provenance, macros, and a slot; nothing is approved or
-- active; and there is seven-day plus swap coverage (>= 6 meals per slot across
-- all four slots). Runs as superuser (RLS bypassed); meal writes are otherwise
-- service-role only.
begin;
select plan(11);

-- Every US meal has honest, non-empty provenance.
select is(
  (select count(*) from public.meals
     where region = 'united_states'
       and (source is null or btrim(source) = '')),
  0::bigint,
  'every US meal has a non-null, non-empty source');

-- Every US meal has a slot.
select is(
  (select count(*) from public.meals
     where region = 'united_states' and slot is null),
  0::bigint,
  'every US meal has a slot');

-- Every US meal has all three macros populated.
select is(
  (select count(*) from public.meals
     where region = 'united_states'
       and (protein_g is null or carbs_g is null or fat_g is null)),
  0::bigint,
  'every US meal has protein_g, carbs_g, and fat_g');

-- DRAFT safety: nothing active.
select is(
  (select count(*) from public.meals
     where region = 'united_states' and is_active is not false),
  0::bigint,
  'every US meal is is_active = false');

-- DRAFT safety: everything still in review.
select is(
  (select count(*) from public.meals
     where region = 'united_states' and review_status is distinct from 'in_review'),
  0::bigint,
  'every US meal is review_status = in_review');

-- Seven-day plus swap coverage: all four slots present.
select is(
  (select count(distinct slot) from public.meals where region = 'united_states'),
  4::bigint,
  'all four meal slots are represented in the US catalog');

-- At least six meals per slot (7-day plan with swaps).
select is(
  (select count(*) from (
     select slot from public.meals
       where region = 'united_states'
       group by slot
       having count(*) >= 6
   ) covered),
  4::bigint,
  'each US slot has at least 6 meals');

-- Breakfast coverage spelled out (guards against a single slot slipping).
select cmp_ok(
  (select count(*) from public.meals
     where region = 'united_states' and slot = 'breakfast'),
  '>=', 6::bigint,
  'US breakfast has at least 6 meals');
select cmp_ok(
  (select count(*) from public.meals
     where region = 'united_states' and slot = 'lunch'),
  '>=', 6::bigint,
  'US lunch has at least 6 meals');

-- No surprising calorie rows.
select is(
  (select count(*) from public.meals
     where region = 'united_states'
       and (calories_max < calories_min or calories_min < 0)),
  0::bigint,
  'no US meal has an inverted or negative calorie range');

-- No surprising macro rows.
select is(
  (select count(*) from public.meals
     where region = 'united_states'
       and (protein_g < 0 or carbs_g < 0 or fat_g < 0)),
  0::bigint,
  'no US meal has a negative macro');

select * from finish();
rollback;
