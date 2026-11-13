-- Macros + meal slot on the meal catalog (issue #107, Phase 7 prerequisite).
-- Confirms the new columns exist and their constraints hold. Runs as superuser
-- (RLS bypassed); meal writes are otherwise service-role only.
begin;
select plan(6);

select has_column('public', 'meals', 'protein_g', 'meals has protein_g');
select has_column('public', 'meals', 'slot', 'meals has a meal slot');

select lives_ok(
  $$insert into public.meals
      (name, region, calories_min, calories_max, protein_g, carbs_g, fat_g, slot)
    values ('Test plate', 'both', 400, 600, 30.0, 45.0, 15.0, 'lunch')$$,
  'a meal with valid macros and slot is accepted');

select throws_ok(
  $$insert into public.meals
      (name, region, calories_min, calories_max, slot)
    values ('Bad slot', 'both', 400, 600, 'brunch')$$,
  '23514', null,
  'an unknown meal slot is rejected');

select throws_ok(
  $$insert into public.meals
      (name, region, calories_min, calories_max, protein_g)
    values ('Bad macro', 'both', 400, 600, -5)$$,
  '23514', null,
  'a negative macro is rejected');

select is(
  (select slot from public.meals where name = 'Test plate'),
  'lunch',
  'the slot round-trips');

select * from finish();
rollback;
