-- Phase 7, issue #29: sourced Nigerian meal seed catalog (DRAFT scaffold).
--
-- Twenty-eight authentic Nigerian meals, spread across the four meal slots
-- (7 breakfast, 7 lunch, 7 dinner, 7 snack) so a seven-day plan with swaps has
-- real variety per slot. The owner chose a "draft scaffold, reviewed at #33":
--
--   * Every row is seeded review_status = 'in_review' and is_active = false.
--     Nothing here is approved or active. The dietitian review at issue #33
--     validates the content and the macros and activates meals later.
--   * Calories and macros (protein_g/carbs_g/fat_g) are ROUGH DRAFT ESTIMATES
--     for a typical home portion, internally consistent but unverified.
--   * The `source` column records honest draft provenance -- "typical home
--     preparation, rough estimates pending review" -- not fabricated citations.
--   * Allergens are tagged conservatively: dishes that typically carry dried
--     crayfish are flagged 'shellfish', smoked/dried fish 'fish', groundnut
--     'peanuts', milk/butter 'dairy', egg 'egg', wheat 'gluten'. When unsure we
--     include the allergen rather than omit it.
--
-- Names and descriptions stay neutral and respectful: no shame, no
-- body-transformation framing, no "good/bad food" language (AGENTS.md).
--
-- This migration is INSERT-only; it does not alter the public.meals schema.

insert into public.meals
  (name, region, goals, calories_min, calories_max, protein_g, carbs_g, fat_g,
   slot, ingredients, allergens, dietary_tags, source, review_status, is_active,
   version)
values
  -- ------------------------------------------------------------------ --
  -- BREAKFAST (7)
  -- ------------------------------------------------------------------ --
  ('Akara and Ogi (Bean Cakes with Fermented Corn Pap)', 'nigeria',
   '{loss,maintenance}', 350, 480, 14.0, 55.0, 12.0, 'breakfast',
   '{black-eyed peas,onion,scotch bonnet pepper,vegetable oil,fermented corn pap (ogi)}',
   '{}', '{high_fibre,vegetarian,vegan}',
   'Draft (#29): typical Lagos home preparation; macros are rough estimates pending dietitian review.',
   'in_review', false, 1),

  ('Moi Moi (Steamed Bean Pudding) with Egg', 'nigeria',
   '{loss,maintenance}', 300, 430, 16.0, 38.0, 11.0, 'breakfast',
   '{black-eyed peas,red bell pepper,onion,boiled egg,dried crayfish,vegetable oil}',
   '{egg,shellfish}', '{high_protein,high_fibre}',
   'Draft (#29): typical home preparation with egg and crayfish; macros are rough estimates pending dietitian review.',
   'in_review', false, 1),

  ('Boiled Yam with Peppered Egg Sauce', 'nigeria',
   '{maintenance,gain}', 450, 620, 15.0, 70.0, 18.0, 'breakfast',
   '{white yam,egg,tomato,red pepper,onion,vegetable oil}',
   '{egg}', '{balanced}',
   'Draft (#29): common breakfast home preparation; macros are rough estimates pending dietitian review.',
   'in_review', false, 1),

  ('Fried Ripe Plantain with Scrambled Egg', 'nigeria',
   '{maintenance,gain}', 400, 560, 13.0, 58.0, 17.0, 'breakfast',
   '{ripe plantain,egg,onion,tomato,vegetable oil}',
   '{egg}', '{balanced}',
   'Draft (#29): typical home preparation; macros are rough estimates pending dietitian review.',
   'in_review', false, 1),

  ('Agege Bread with Akara', 'nigeria',
   '{maintenance}', 380, 520, 12.0, 62.0, 13.0, 'breakfast',
   '{wheat bread,black-eyed peas,onion,scotch bonnet pepper,vegetable oil}',
   '{gluten}', '{vegetarian}',
   'Draft (#29): common street and home breakfast pairing; macros are rough estimates pending dietitian review.',
   'in_review', false, 1),

  ('Boiled Sweet Potato with Garden-Egg Sauce', 'nigeria',
   '{loss,maintenance}', 350, 480, 8.0, 68.0, 10.0, 'breakfast',
   '{sweet potato,garden egg (eggplant),red pepper,onion,palm oil}',
   '{}', '{vegan,high_fibre}',
   'Draft (#29): typical home preparation; macros are rough estimates pending dietitian review.',
   'in_review', false, 1),

  ('Fried Yam (Dundun) with Pepper Sauce', 'nigeria',
   '{maintenance,gain}', 420, 560, 6.0, 72.0, 18.0, 'breakfast',
   '{white yam,vegetable oil,tomato,scotch bonnet pepper,onion}',
   '{}', '{vegan}',
   'Draft (#29): typical home and roadside preparation; macros are rough estimates pending dietitian review.',
   'in_review', false, 1),

  -- ------------------------------------------------------------------ --
  -- LUNCH (7)
  -- ------------------------------------------------------------------ --
  ('Jollof Rice with Grilled Chicken', 'nigeria',
   '{maintenance,gain}', 550, 720, 30.0, 75.0, 20.0, 'lunch',
   '{long-grain rice,tomato,red pepper,onion,chicken,vegetable oil,seasoning}',
   '{}', '{high_protein,balanced}',
   'Draft (#29): typical party-style home preparation; macros are rough estimates pending dietitian review.',
   'in_review', false, 1),

  ('Nigerian Fried Rice with Chicken', 'nigeria',
   '{maintenance,gain}', 520, 700, 26.0, 72.0, 18.0, 'lunch',
   '{rice,mixed vegetables,liver,shrimp,chicken,curry,vegetable oil}',
   '{shellfish}', '{balanced,high_protein}',
   'Draft (#29): typical home preparation including shrimp; macros are rough estimates pending dietitian review.',
   'in_review', false, 1),

  ('Ofada Rice with Ayamase (Designer Stew)', 'nigeria',
   '{maintenance,gain}', 600, 780, 28.0, 68.0, 28.0, 'lunch',
   '{ofada rice,green bell pepper,locust beans (iru),assorted meat,palm oil,dried crayfish}',
   '{shellfish}', '{high_protein}',
   'Draft (#29): typical home preparation of ayamase; macros are rough estimates pending dietitian review.',
   'in_review', false, 1),

  ('Amala with Ewedu and Gbegiri', 'nigeria',
   '{maintenance}', 500, 680, 22.0, 70.0, 20.0, 'lunch',
   '{yam flour (elubo),jute leaves (ewedu),beans (gbegiri),assorted meat,palm oil,dried crayfish,locust beans}',
   '{shellfish}', '{high_fibre,high_protein}',
   'Draft (#29): typical Yoruba home preparation; macros are rough estimates pending dietitian review.',
   'in_review', false, 1),

  ('Ewa Agoyin (Mashed Beans with Spicy Sauce)', 'nigeria',
   '{loss,maintenance}', 450, 600, 18.0, 62.0, 16.0, 'lunch',
   '{black-eyed peas,palm oil,dried pepper,onion,dried crayfish}',
   '{shellfish}', '{high_fibre,high_protein}',
   'Draft (#29): typical home and street preparation; macros are rough estimates pending dietitian review.',
   'in_review', false, 1),

  ('Eba (Garri) with Egusi Soup', 'nigeria',
   '{gain,maintenance}', 600, 800, 26.0, 72.0, 30.0, 'lunch',
   '{cassava flakes (garri),melon seeds (egusi),spinach,assorted meat,smoked fish,dried crayfish,palm oil}',
   '{fish,shellfish}', '{high_protein}',
   'Draft (#29): typical home preparation; macros are rough estimates pending dietitian review.',
   'in_review', false, 1),

  ('Rice and Beans with Pepper Stew', 'nigeria',
   '{maintenance,gain}', 520, 680, 20.0, 82.0, 14.0, 'lunch',
   '{rice,black-eyed peas,tomato,red pepper,onion,vegetable oil}',
   '{}', '{high_fibre,vegetarian,vegan}',
   'Draft (#29): everyday home preparation; macros are rough estimates pending dietitian review.',
   'in_review', false, 1),

  -- ------------------------------------------------------------------ --
  -- DINNER (7)
  -- ------------------------------------------------------------------ --
  ('Pounded Yam with Egusi Soup', 'nigeria',
   '{gain,maintenance}', 650, 850, 28.0, 80.0, 30.0, 'dinner',
   '{pounded yam,melon seeds (egusi),bitterleaf,assorted meat,stockfish,dried crayfish,palm oil}',
   '{fish,shellfish}', '{high_protein}',
   'Draft (#29): typical home preparation; macros are rough estimates pending dietitian review.',
   'in_review', false, 1),

  ('Fufu with Ogbono Soup', 'nigeria',
   '{gain,maintenance}', 600, 800, 26.0, 78.0, 26.0, 'dinner',
   '{cassava fufu,wild mango seeds (ogbono),spinach,goat meat,smoked fish,dried crayfish,palm oil}',
   '{fish,shellfish}', '{high_protein}',
   'Draft (#29): typical home preparation; macros are rough estimates pending dietitian review.',
   'in_review', false, 1),

  ('Semovita with Efo Riro (Vegetable Soup)', 'nigeria',
   '{maintenance}', 550, 720, 24.0, 70.0, 24.0, 'dinner',
   '{semolina,spinach (efo),red pepper,locust beans,assorted meat,dried crayfish,palm oil}',
   '{gluten,shellfish}', '{high_fibre}',
   'Draft (#29): typical home preparation; macros are rough estimates pending dietitian review.',
   'in_review', false, 1),

  ('Tuwo Shinkafa with Miyan Kuka (Baobab Leaf Soup)', 'nigeria',
   '{maintenance}', 520, 700, 24.0, 72.0, 18.0, 'dinner',
   '{soft rice (tuwo),baobab leaf powder (kuka),beef,dried fish,locust beans,palm oil}',
   '{fish}', '{high_fibre,high_protein}',
   'Draft (#29): typical Northern Nigerian home preparation; macros are rough estimates pending dietitian review.',
   'in_review', false, 1),

  ('White Rice with Obe Ata and Fried Fish', 'nigeria',
   '{loss,maintenance}', 500, 680, 24.0, 72.0, 18.0, 'dinner',
   '{rice,tomato,red pepper,onion,fried fish,vegetable oil}',
   '{fish}', '{high_protein,balanced}',
   'Draft (#29): everyday home preparation; macros are rough estimates pending dietitian review.',
   'in_review', false, 1),

  ('Asaro (Yam Porridge) with Vegetables', 'nigeria',
   '{loss,maintenance}', 480, 640, 14.0, 76.0, 16.0, 'dinner',
   '{white yam,palm oil,tomato,red pepper,spinach,smoked fish}',
   '{fish}', '{high_fibre}',
   'Draft (#29): typical home preparation; macros are rough estimates pending dietitian review.',
   'in_review', false, 1),

  ('Unripe Plantain Porridge with Vegetables', 'nigeria',
   '{loss,maintenance}', 450, 600, 12.0, 72.0, 15.0, 'dinner',
   '{unripe plantain,spinach,scotch bonnet pepper,onion,palm oil}',
   '{}', '{high_fibre,vegetarian,vegan}',
   'Draft (#29): typical home preparation; macros are rough estimates pending dietitian review.',
   'in_review', false, 1),

  -- ------------------------------------------------------------------ --
  -- SNACK (7)
  -- ------------------------------------------------------------------ --
  ('Boli (Roasted Plantain) with Groundnut', 'nigeria',
   '{maintenance}', 250, 380, 7.0, 48.0, 9.0, 'snack',
   '{ripe plantain,roasted groundnut}',
   '{peanuts}', '{high_fibre,vegan}',
   'Draft (#29): typical roadside and home snack; macros are rough estimates pending dietitian review.',
   'in_review', false, 1),

  ('Puff Puff (Fried Dough Balls)', 'nigeria',
   '{maintenance,gain}', 220, 340, 4.0, 40.0, 10.0, 'snack',
   '{wheat flour,sugar,yeast,nutmeg,vegetable oil}',
   '{gluten}', '{vegetarian}',
   'Draft (#29): typical home and street snack; macros are rough estimates pending dietitian review.',
   'in_review', false, 1),

  ('Chin Chin (Fried Pastry Bites)', 'nigeria',
   '{gain}', 240, 360, 5.0, 42.0, 12.0, 'snack',
   '{wheat flour,butter,egg,sugar,nutmeg,vegetable oil}',
   '{gluten,egg,dairy}', '{vegetarian}',
   'Draft (#29): typical home-baked snack; macros are rough estimates pending dietitian review.',
   'in_review', false, 1),

  ('Suya (Spiced Grilled Beef Skewers)', 'nigeria',
   '{loss,maintenance}', 220, 340, 26.0, 6.0, 14.0, 'snack',
   '{beef,groundnut spice (yaji),ginger,red pepper,onion}',
   '{peanuts}', '{high_protein}',
   'Draft (#29): typical street and home preparation; yaji spice contains groundnut; macros are rough estimates pending dietitian review.',
   'in_review', false, 1),

  ('Kuli Kuli (Groundnut Snack)', 'nigeria',
   '{maintenance}', 200, 320, 12.0, 14.0, 16.0, 'snack',
   '{roasted groundnut,ginger,red pepper}',
   '{peanuts}', '{high_protein,vegan}',
   'Draft (#29): typical home and market snack; macros are rough estimates pending dietitian review.',
   'in_review', false, 1),

  ('Roasted Groundnut with Garden Egg', 'nigeria',
   '{loss,maintenance}', 180, 300, 11.0, 14.0, 14.0, 'snack',
   '{roasted groundnut,garden egg (eggplant)}',
   '{peanuts}', '{high_protein,vegan}',
   'Draft (#29): common pairing sold and eaten at home; macros are rough estimates pending dietitian review.',
   'in_review', false, 1),

  ('Zobo Drink (Hibiscus) with Pineapple', 'nigeria',
   '{loss,maintenance}', 90, 160, 1.0, 30.0, 0.0, 'snack',
   '{dried hibiscus leaves (zobo),pineapple,ginger,cloves}',
   '{}', '{vegan}',
   'Draft (#29): typical home-brewed drink; macros are rough estimates pending dietitian review.',
   'in_review', false, 1);
