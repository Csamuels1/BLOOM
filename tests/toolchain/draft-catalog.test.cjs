/* global __dirname */
const assert = require('node:assert/strict');
const { readFileSync, readdirSync, statSync } = require('node:fs');
const { join, relative } = require('node:path');
const { test } = require('node:test');

const {
  OUTPUT,
  readDraftMeals,
  renderDraftCatalog,
} = require('../../scripts/generate-draft-catalog.cjs');

const root = join(__dirname, '../..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

test('the generated draft catalog is fresh (#159)', async () => {
  const rendered = await renderDraftCatalog();
  assert.equal(
    read(OUTPUT),
    rendered,
    `${OUTPUT} is stale. Run: node scripts/generate-draft-catalog.cjs`,
  );
});

test('the draft catalog holds only unreviewed drafts, 28 per region (#159)', () => {
  // readDraftMeals throws on any approved/active row (ADR-0010).
  const meals = readDraftMeals();
  assert.equal(meals.filter((meal) => meal.region === 'nigeria').length, 28);
  assert.equal(
    meals.filter((meal) => meal.region === 'united_states').length,
    28,
  );
});

test('draft meals load only behind the production gate (#159)', () => {
  const source = read('src/features/today/draftMeals.ts');

  // The gate: allowed for every environment except production.
  assert.match(
    source,
    /function draftMealsAllowed\([^)]*\)[^{]*\{\s*return appEnv !== 'production';\s*\}/,
  );

  // The dataset is required ONLY inside the env check, which also reads the
  // inlined build-time value so a production bundle can drop the require.
  const gated =
    /if \(\s*draftMealsAllowed\(appEnv\) &&\s*process\.env\.EXPO_PUBLIC_APP_ENV !== 'production'\s*\) \{[^}]*require\('\.\/draftCatalog\.generated'\)/;
  assert.match(source, gated);
  assert.equal(
    source.match(/require\('\.\/draftCatalog\.generated'\)/g)?.length,
    1,
    'draftMeals.ts must require the draft dataset exactly once, inside the gate',
  );

  // Nothing in the app imports the dataset at runtime; type-only imports are
  // erased and do not pull it into a bundle.
  for (const file of walk(join(root, 'src'))) {
    if (!/\.(ts|tsx)$/.test(file)) continue;
    const rel = relative(root, file).replace(/\\/g, '/');
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      if (/from ['"].*draftCatalog\.generated['"]/.test(line)) {
        assert.match(
          line,
          /^import type /,
          `${rel} must not import the draft dataset at runtime: ${line}`,
        );
      }
    }
  }
});
