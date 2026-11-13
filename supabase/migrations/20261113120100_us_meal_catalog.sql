-- US meal seed catalog (issue #30, Phase 7).
--
-- Seeds a culturally relevant catalog of United States meals with auditable,
-- per-meal provenance so the recommendation engine (#31) has seven-day plus
-- swap coverage to draw on. Depends on the macros and slot columns added by
-- #107 (20261113114558_meals_macros_slot.sql).
--
-- SAFETY (AGENTS.md: health content requires qualified review). This is a DRAFT
-- scaffold. Every row is inserted with review_status = 'in_review' and
-- is_active = false so NOTHING is approved or active. Calories and macros are
-- rough draft estimates and the `source` field is honest draft provenance, not
-- a fabricated citation. The dietitian review at issue #33 validates the macros,
-- confirms the sources, and activates meals. The meals_active_requires_approved
-- constraint is trivially satisfied because is_active is false on every row.
--
-- Coverage: 7 meals per slot (breakfast, lunch, dinner, snack) = 28 meals,
-- enough variety for a 7-day plan with swaps. Allergens follow a conservative,
-- consistent vocabulary and are included rather than omitted when uncertain.

insert into public.meals (
  name,
  region,
  goals,
  calories_min,
  calories_max,
  protein_g,
  carbs_g,
  fat_g,
  slot,
  ingredients,
  allergens,
  dietary_tags,
  source,
  review_status,
  is_active,
  version
)
values
  -- ------------------------------------------------------------------ breakfast
  (
    'Oatmeal with Berries and Walnuts',
    'united_states',
    array['loss', 'maintenance'],
    320, 400, 10.0, 55.0, 12.0, 'breakfast',
    array['rolled oats', 'milk', 'blueberries', 'walnuts', 'honey'],
    array['dairy', 'tree_nuts'],
    array['vegetarian', 'high_fibre', 'balanced'],
    'Draft (#30): typical home preparation; macros are rough estimates pending dietitian review (#33).',
    'in_review', false, 1
  ),
  (
    'Scrambled Eggs with Whole Wheat Toast',
    'united_states',
    array['maintenance', 'gain'],
    350, 430, 22.0, 30.0, 18.0, 'breakfast',
    array['eggs', 'whole wheat bread', 'butter', 'salt', 'black pepper'],
    array['egg', 'gluten', 'dairy'],
    array['high_protein', 'balanced'],
    'Draft (#30): common diner-style preparation; calories and macros are unverified estimates for #33 review.',
    'in_review', false, 1
  ),
  (
    'Greek Yogurt Parfait with Granola',
    'united_states',
    array['loss', 'maintenance'],
    300, 380, 20.0, 45.0, 8.0, 'breakfast',
    array['greek yogurt', 'granola', 'strawberries', 'honey'],
    array['dairy', 'tree_nuts', 'gluten'],
    array['high_protein', 'vegetarian'],
    'Draft (#30): standard layered parfait; macros vary by yogurt and granola brand, rough draft pending #33.',
    'in_review', false, 1
  ),
  (
    'Avocado Toast with Egg',
    'united_states',
    array['maintenance'],
    380, 460, 16.0, 35.0, 22.0, 'breakfast',
    array['whole grain bread', 'avocado', 'egg', 'chili flakes', 'salt'],
    array['gluten', 'egg'],
    array['high_fibre', 'balanced', 'vegetarian'],
    'Draft (#30): typical cafe-style portion; macros are rough estimates awaiting dietitian review (#33).',
    'in_review', false, 1
  ),
  (
    'Blueberry Pancakes with Maple Syrup',
    'united_states',
    array['gain', 'maintenance'],
    400, 500, 10.0, 65.0, 14.0, 'breakfast',
    array['flour', 'milk', 'egg', 'blueberries', 'maple syrup', 'butter'],
    array['gluten', 'egg', 'dairy'],
    array['vegetarian', 'balanced'],
    'Draft (#30): classic weekend breakfast; syrup quantity drives carbs, estimates unverified pending #33.',
    'in_review', false, 1
  ),
  (
    'Veggie Breakfast Burrito',
    'united_states',
    array['maintenance', 'gain'],
    420, 520, 20.0, 50.0, 20.0, 'breakfast',
    array['flour tortilla', 'eggs', 'black beans', 'bell peppers', 'cheddar cheese', 'salsa'],
    array['gluten', 'egg', 'dairy'],
    array['high_protein', 'vegetarian', 'high_fibre'],
    'Draft (#30): Tex-Mex home preparation; macros are rough estimates for dietitian confirmation at #33.',
    'in_review', false, 1
  ),
  (
    'Peanut Butter Banana Smoothie',
    'united_states',
    array['gain', 'maintenance'],
    330, 410, 15.0, 48.0, 12.0, 'breakfast',
    array['banana', 'peanut butter', 'milk', 'greek yogurt', 'rolled oats'],
    array['peanuts', 'dairy'],
    array['high_protein', 'balanced'],
    'Draft (#30): blended smoothie, typical home recipe; nutrition is an unverified draft pending #33.',
    'in_review', false, 1
  ),
  -- ---------------------------------------------------------------------- lunch
  (
    'Grilled Chicken Caesar Salad',
    'united_states',
    array['loss', 'maintenance'],
    400, 500, 35.0, 20.0, 24.0, 'lunch',
    array['romaine lettuce', 'grilled chicken breast', 'parmesan cheese', 'croutons', 'caesar dressing'],
    array['dairy', 'egg', 'gluten', 'fish'],
    array['high_protein'],
    'Draft (#30): classic Caesar (dressing typically contains anchovy and egg); macros rough, pending #33.',
    'in_review', false, 1
  ),
  (
    'Turkey and Cheddar Sandwich',
    'united_states',
    array['maintenance'],
    400, 500, 28.0, 42.0, 16.0, 'lunch',
    array['whole wheat bread', 'sliced turkey', 'cheddar cheese', 'lettuce', 'tomato', 'mustard'],
    array['gluten', 'dairy'],
    array['high_protein', 'balanced'],
    'Draft (#30): standard deli sandwich; macros are rough estimates awaiting dietitian review (#33).',
    'in_review', false, 1
  ),
  (
    'Black Bean and Corn Burrito Bowl',
    'united_states',
    array['maintenance', 'loss'],
    420, 520, 16.0, 70.0, 12.0, 'lunch',
    array['brown rice', 'black beans', 'corn', 'avocado', 'salsa', 'lime'],
    array[]::text[],
    array['vegan', 'high_fibre', 'gluten_free'],
    'Draft (#30): plant-based bowl, typical home portion; nutrition is an unverified draft pending #33.',
    'in_review', false, 1
  ),
  (
    'Tuna Salad Wrap',
    'united_states',
    array['loss', 'maintenance'],
    380, 470, 26.0, 38.0, 16.0, 'lunch',
    array['canned tuna', 'mayonnaise', 'celery', 'whole wheat tortilla', 'lettuce'],
    array['fish', 'gluten', 'egg'],
    array['high_protein'],
    'Draft (#30): common tuna wrap (mayonnaise contains egg); macros are rough estimates pending #33.',
    'in_review', false, 1
  ),
  (
    'Quinoa and Roasted Vegetable Bowl',
    'united_states',
    array['maintenance', 'loss'],
    400, 490, 15.0, 60.0, 14.0, 'lunch',
    array['quinoa', 'roasted vegetables', 'chickpeas', 'olive oil', 'lemon'],
    array[]::text[],
    array['vegan', 'high_fibre', 'gluten_free'],
    'Draft (#30): grain bowl, typical home preparation; macros rough and unverified, pending #33.',
    'in_review', false, 1
  ),
  (
    'Grilled Cheese with Tomato Soup',
    'united_states',
    array['gain', 'maintenance'],
    450, 560, 18.0, 55.0, 22.0, 'lunch',
    array['white bread', 'cheddar cheese', 'butter', 'tomato soup'],
    array['gluten', 'dairy'],
    array['vegetarian', 'balanced'],
    'Draft (#30): comfort-food pairing; macros are rough estimates awaiting dietitian review (#33).',
    'in_review', false, 1
  ),
  (
    'Chicken Burrito Bowl',
    'united_states',
    array['gain', 'maintenance'],
    480, 580, 38.0, 55.0, 16.0, 'lunch',
    array['brown rice', 'grilled chicken breast', 'black beans', 'cheddar cheese', 'salsa', 'lettuce'],
    array['dairy'],
    array['high_protein', 'gluten_free'],
    'Draft (#30): fast-casual style bowl; macros are rough estimates for dietitian confirmation at #33.',
    'in_review', false, 1
  ),
  -- --------------------------------------------------------------------- dinner
  (
    'Grilled Salmon with Roasted Vegetables',
    'united_states',
    array['loss', 'maintenance'],
    450, 560, 38.0, 30.0, 24.0, 'dinner',
    array['salmon fillet', 'broccoli', 'carrots', 'olive oil', 'lemon'],
    array['fish'],
    array['high_protein', 'gluten_free', 'balanced'],
    'Draft (#30): baked/grilled fillet with sides; macros are rough estimates pending dietitian review (#33).',
    'in_review', false, 1
  ),
  (
    'Spaghetti and Meatballs',
    'united_states',
    array['gain', 'maintenance'],
    550, 680, 30.0, 70.0, 22.0, 'dinner',
    array['spaghetti', 'marinara sauce', 'beef meatballs', 'parmesan cheese'],
    array['gluten', 'egg', 'dairy'],
    array['high_protein', 'balanced'],
    'Draft (#30): classic Italian-American plate (meatballs typically bound with egg); rough, pending #33.',
    'in_review', false, 1
  ),
  (
    'Baked Chicken with Sweet Potato',
    'united_states',
    array['loss', 'maintenance', 'gain'],
    480, 580, 40.0, 45.0, 16.0, 'dinner',
    array['chicken breast', 'sweet potato', 'green beans', 'olive oil'],
    array[]::text[],
    array['high_protein', 'gluten_free', 'balanced'],
    'Draft (#30): simple baked dinner, typical home portion; nutrition is an unverified draft pending #33.',
    'in_review', false, 1
  ),
  (
    'Beef and Broccoli Stir-Fry with Rice',
    'united_states',
    array['gain', 'maintenance'],
    520, 640, 32.0, 60.0, 20.0, 'dinner',
    array['beef strips', 'broccoli', 'soy sauce', 'garlic', 'white rice'],
    array['soy', 'gluten'],
    array['high_protein'],
    'Draft (#30): American-Chinese stir-fry (soy sauce contains wheat); macros rough, pending #33.',
    'in_review', false, 1
  ),
  (
    'Three-Bean Vegetarian Chili',
    'united_states',
    array['loss', 'maintenance'],
    400, 500, 20.0, 65.0, 10.0, 'dinner',
    array['kidney beans', 'black beans', 'pinto beans', 'tomatoes', 'onion', 'chili spices'],
    array[]::text[],
    array['vegan', 'high_fibre', 'gluten_free', 'high_protein'],
    'Draft (#30): hearty bean chili, typical home pot; macros are rough estimates awaiting #33 review.',
    'in_review', false, 1
  ),
  (
    'Shrimp Tacos with Cabbage Slaw',
    'united_states',
    array['loss', 'maintenance'],
    450, 560, 30.0, 48.0, 18.0, 'dinner',
    array['shrimp', 'corn tortillas', 'cabbage slaw', 'lime crema', 'cilantro'],
    array['shellfish', 'dairy'],
    array['high_protein'],
    'Draft (#30): coastal-style tacos; macros are rough estimates for dietitian confirmation at #33.',
    'in_review', false, 1
  ),
  (
    'Baked Tofu with Brown Rice and Vegetables',
    'united_states',
    array['maintenance', 'loss'],
    420, 520, 22.0, 55.0, 14.0, 'dinner',
    array['tofu', 'brown rice', 'broccoli', 'carrots', 'soy sauce'],
    array['soy', 'gluten'],
    array['vegan', 'high_protein', 'high_fibre'],
    'Draft (#30): plant-based plate (soy sauce contains wheat); nutrition is an unverified draft pending #33.',
    'in_review', false, 1
  ),
  -- ---------------------------------------------------------------------- snack
  (
    'Apple Slices with Peanut Butter',
    'united_states',
    array['maintenance', 'loss'],
    200, 260, 7.0, 25.0, 12.0, 'snack',
    array['apple', 'peanut butter'],
    array['peanuts'],
    array['vegetarian', 'balanced', 'gluten_free'],
    'Draft (#30): simple fruit-and-nut-butter snack; macros are rough estimates pending #33 review.',
    'in_review', false, 1
  ),
  (
    'Greek Yogurt with Honey',
    'united_states',
    array['loss', 'maintenance'],
    150, 200, 15.0, 20.0, 4.0, 'snack',
    array['greek yogurt', 'honey'],
    array['dairy'],
    array['high_protein', 'vegetarian', 'gluten_free'],
    'Draft (#30): single-serving yogurt cup; macros vary by brand, rough draft awaiting #33.',
    'in_review', false, 1
  ),
  (
    'Hummus with Carrots and Cucumber',
    'united_states',
    array['loss', 'maintenance'],
    180, 240, 7.0, 22.0, 10.0, 'snack',
    array['hummus', 'carrots', 'cucumber'],
    array[]::text[],
    array['vegan', 'high_fibre', 'gluten_free'],
    'Draft (#30): veggies-and-dip snack, typical portion; nutrition is an unverified draft pending #33.',
    'in_review', false, 1
  ),
  (
    'Trail Mix',
    'united_states',
    array['gain', 'maintenance'],
    200, 280, 7.0, 22.0, 14.0, 'snack',
    array['almonds', 'cashews', 'peanuts', 'raisins', 'dark chocolate'],
    array['tree_nuts', 'peanuts', 'dairy'],
    array['vegetarian', 'balanced'],
    'Draft (#30): mixed nut snack (dark chocolate may contain milk); macros rough, pending #33.',
    'in_review', false, 1
  ),
  (
    'Cottage Cheese with Pineapple',
    'united_states',
    array['loss', 'maintenance'],
    160, 220, 14.0, 18.0, 5.0, 'snack',
    array['cottage cheese', 'pineapple'],
    array['dairy'],
    array['high_protein', 'vegetarian', 'gluten_free'],
    'Draft (#30): classic protein snack; macros are rough estimates awaiting dietitian review (#33).',
    'in_review', false, 1
  ),
  (
    'Whole Grain Crackers with Cheese',
    'united_states',
    array['maintenance'],
    200, 270, 9.0, 24.0, 12.0, 'snack',
    array['whole grain crackers', 'cheddar cheese'],
    array['gluten', 'dairy'],
    array['vegetarian', 'balanced'],
    'Draft (#30): crackers-and-cheese snack, typical portion; nutrition is an unverified draft pending #33.',
    'in_review', false, 1
  ),
  (
    'Banana with Almond Butter',
    'united_states',
    array['maintenance', 'gain'],
    220, 290, 6.0, 32.0, 12.0, 'snack',
    array['banana', 'almond butter'],
    array['tree_nuts'],
    array['vegetarian', 'gluten_free', 'balanced'],
    'Draft (#30): fruit-and-nut-butter snack; macros are rough estimates for dietitian confirmation at #33.',
    'in_review', false, 1
  );
