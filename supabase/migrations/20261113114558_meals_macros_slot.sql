-- Phase 7 prerequisite (issue #107): macros and meal slot on the meal catalog.
--
-- The Phase 7 catalogs (#29 Nigerian, #30 US) require every meal to carry its
-- macronutrients and a meal slot. These columns are added here so both catalogs
-- can be built in parallel on one shared schema.
--
-- Columns are nullable at the column level: catalog rows are seeded as
-- unreviewed drafts and the values are confirmed during dietitian review (#33)
-- before anything is activated. Macros are non-negative grams; the slot is a
-- small fixed vocabulary. No change to RLS, grants, or existing rows.

alter table public.meals
  add column protein_g numeric(5, 1) check (protein_g is null or protein_g >= 0),
  add column carbs_g numeric(5, 1) check (carbs_g is null or carbs_g >= 0),
  add column fat_g numeric(5, 1) check (fat_g is null or fat_g >= 0),
  add column slot text check (slot in ('breakfast', 'lunch', 'dinner', 'snack'));

comment on column public.meals.protein_g is 'Protein per serving in grams (draft until dietitian review).';
comment on column public.meals.carbs_g is 'Carbohydrate per serving in grams (draft until dietitian review).';
comment on column public.meals.fat_g is 'Fat per serving in grams (draft until dietitian review).';
comment on column public.meals.slot is 'Meal slot: breakfast, lunch, dinner, or snack.';

-- Help recommendation filtering (#31) select by region + slot efficiently.
create index meals_region_slot_idx on public.meals (region, slot);
