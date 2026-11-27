/* global __dirname */
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');

const {
  parseMealsInsert,
} = require('../../scripts/generate-draft-catalog.cjs');

/**
 * SAFETY-CRITICAL (#160). The canonical allergen vocabulary in
 * src/features/recommendations/allergens.ts must match the catalog migrations
 * and the onboarding options, so a profile allergen can never miss a meal.
 */

const root = join(__dirname, '../..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

const CANONICAL = 'src/features/recommendations/allergens.ts';
const ONBOARDING = 'src/features/onboarding/screens/DietaryAllergensStep.tsx';
const MIGRATIONS = [
  'supabase/migrations/20261113120000_nigerian_meal_catalog.sql',
  'supabase/migrations/20261113120100_us_meal_catalog.sql',
];

/** The string values of `export const NAME = [ ... ] as const;` in a source. */
function constArray(source, name) {
  const match = source.match(
    new RegExp(`export const ${name} = \\[([^\\]]*)\\] as const;`),
  );
  assert.ok(match, `${CANONICAL} must export ${name} as a const array`);
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

/** The `value: '...'` entries of `const NAME = [ ... ] as const;` in a source. */
function optionValues(source, name) {
  const match = source.match(
    new RegExp(`const ${name} = \\[([\\s\\S]*?)\\] as const;`),
  );
  assert.ok(match, `${ONBOARDING} must declare ${name} options`);
  return [...match[1].matchAll(/value:\s*'([^']+)'/g)].map((m) => m[1]);
}

const canonical = read(CANONICAL);
const CATALOG_ALLERGENS = new Set(constArray(canonical, 'CATALOG_ALLERGENS'));

test('every allergen in the catalog migrations is in the canonical vocabulary (#160)', () => {
  let seen = 0;
  for (const file of MIGRATIONS) {
    const rows = parseMealsInsert(read(file));
    assert.ok(rows.length > 0, `${file}: no meals parsed`);
    for (const row of rows) {
      assert.ok(Array.isArray(row.allergens), `${file}: allergens not parsed`);
      for (const value of row.allergens) {
        seen += 1;
        assert.ok(
          CATALOG_ALLERGENS.has(value),
          `${file}: "${row.name}" uses allergen "${value}", which is not in CATALOG_ALLERGENS (${CANONICAL})`,
        );
      }
    }
  }
  assert.ok(seen > 0, 'expected some allergen values in the catalogs');
});

test('the canonical profile vocabulary matches the onboarding options (#160)', () => {
  const step = read(ONBOARDING);
  assert.deepEqual(
    [...constArray(canonical, 'PROFILE_ALLERGENS')].sort(),
    [...optionValues(step, 'ALLERGENS')].sort(),
    'PROFILE_ALLERGENS must list exactly the onboarding allergen options',
  );
  assert.deepEqual(
    [...constArray(canonical, 'DIETARY_PREFERENCES')].sort(),
    [...optionValues(step, 'DIETARY')].sort(),
    'DIETARY_PREFERENCES must list exactly the onboarding dietary options',
  );
});

test('every onboarding allergen maps to at least one catalog allergen (#160)', () => {
  const block = canonical.match(
    /PROFILE_TO_CATALOG_ALLERGENS[^=]*=\s*\{([^}]*)\}/,
  );
  assert.ok(block, 'PROFILE_TO_CATALOG_ALLERGENS not found');
  const mapping = new Map(
    [...block[1].matchAll(/(\w+):\s*\[([^\]]*)\]/g)].map((m) => [
      m[1],
      [...m[2].matchAll(/'([^']+)'/g)].map((v) => v[1]),
    ]),
  );
  for (const allergen of optionValues(read(ONBOARDING), 'ALLERGENS')) {
    const mapped = mapping.get(allergen) ?? [];
    assert.ok(
      mapped.length > 0,
      `onboarding allergen "${allergen}" is unmapped`,
    );
    for (const value of mapped) {
      assert.ok(
        CATALOG_ALLERGENS.has(value),
        `"${allergen}" maps to unknown catalog allergen "${value}"`,
      );
    }
  }
});

test('the engine path routes profile allergens through the canonical mapping (#160)', () => {
  const draft = read('src/features/today/draftMeals.ts');
  assert.match(draft, /catalogAllergensFor\(/);
  assert.doesNotMatch(
    draft,
    /const (CATALOG_ALLERGENS|PREFERENCE_AVOIDS)\b/,
    'draftMeals.ts must not keep its own allergen mapping; delegate to allergens.ts',
  );
});
