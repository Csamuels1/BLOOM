/**
 * Generate the typed DRAFT meal catalog for test builds (issue #159).
 *
 * Reads the two catalog seed migrations (Nigerian #29, US #30) and writes
 * src/features/today/draftCatalog.generated.ts. Every source row must still be
 * an unreviewed draft (review_status 'in_review', is_active false, ADR-0010);
 * the generator refuses to run otherwise, so this dataset can never quietly
 * carry approved content. The app loads it only outside production.
 *
 *   node scripts/generate-draft-catalog.cjs          write the file
 *   node scripts/generate-draft-catalog.cjs --check  exit 1 if it is stale
 *
 * Output is formatted with the repo's Prettier config, so it is stable under
 * `npm run format:check` and the freshness test can compare it byte-for-byte.
 */
const { readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');

const SOURCES = [
  {
    file: 'supabase/migrations/20261113120000_nigerian_meal_catalog.sql',
    prefix: 'draft-ng',
    expectedCount: 28,
  },
  {
    file: 'supabase/migrations/20261113120100_us_meal_catalog.sql',
    prefix: 'draft-us',
    expectedCount: 28,
  },
];

const OUTPUT = 'src/features/today/draftCatalog.generated.ts';

const ARRAY_COLUMNS = new Set([
  'goals',
  'ingredients',
  'allergens',
  'dietary_tags',
]);
const REGIONS = new Set(['nigeria', 'united_states']);
const SLOTS = new Set(['breakfast', 'lunch', 'dinner', 'snack']);
const GOALS = new Set(['loss', 'maintenance', 'gain']);

/** Split SQL into string, number, word, and punctuation tokens; drop comments. */
function tokenize(sql) {
  const tokens = [];
  let i = 0;
  while (i < sql.length) {
    const ch = sql[i];
    if (/\s/.test(ch)) {
      i += 1;
    } else if (ch === '-' && sql[i + 1] === '-') {
      while (i < sql.length && sql[i] !== '\n') i += 1;
    } else if (ch === "'") {
      let value = '';
      i += 1;
      for (;;) {
        if (i >= sql.length) throw new Error('Unterminated SQL string');
        if (sql[i] === "'" && sql[i + 1] === "'") {
          value += "'";
          i += 2;
        } else if (sql[i] === "'") {
          i += 1;
          break;
        } else {
          value += sql[i];
          i += 1;
        }
      }
      tokens.push({ type: 'string', value });
    } else if (/[0-9]/.test(ch)) {
      const match = /^[0-9]+(\.[0-9]+)?/.exec(sql.slice(i));
      tokens.push({ type: 'number', value: Number(match[0]) });
      i += match[0].length;
    } else if (/[A-Za-z_]/.test(ch)) {
      const match = /^[A-Za-z_][A-Za-z0-9_.]*/.exec(sql.slice(i));
      tokens.push({ type: 'word', value: match[0].toLowerCase() });
      i += match[0].length;
    } else if (ch === ':' && sql[i + 1] === ':') {
      tokens.push({ type: 'punct', value: '::' });
      i += 2;
    } else if ('()[],;'.includes(ch)) {
      tokens.push({ type: 'punct', value: ch });
      i += 1;
    } else {
      throw new Error(`Unexpected SQL character ${JSON.stringify(ch)}`);
    }
  }
  return tokens;
}

/** Parse a Postgres array literal such as '{a,b c,d (e)}' (no quoting used). */
function parseArrayLiteral(text) {
  if (!text.startsWith('{') || !text.endsWith('}') || text.includes('"')) {
    throw new Error(`Unsupported array literal ${JSON.stringify(text)}`);
  }
  const inner = text.slice(1, -1).trim();
  return inner === '' ? [] : inner.split(',').map((item) => item.trim());
}

/** Parse `insert into public.meals (cols) values (...), (...);` into rows. */
function parseMealsInsert(sql) {
  const tokens = tokenize(sql);
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => {
    const token = tokens[pos];
    if (!token) throw new Error('Unexpected end of SQL');
    pos += 1;
    return token;
  };
  const expect = (type, value) => {
    const token = next();
    if (token.type !== type || (value !== undefined && token.value !== value)) {
      throw new Error(
        `Expected ${value ?? type}, got ${JSON.stringify(token.value)}`,
      );
    }
    return token;
  };

  for (const word of ['insert', 'into', 'public.meals']) expect('word', word);
  expect('punct', '(');
  const columns = [];
  for (;;) {
    columns.push(expect('word').value);
    if (next().value === ')') break;
  }
  expect('word', 'values');

  // A value may carry a cast such as `array[]::text[]`; the cast is dropped.
  const skipCast = () => {
    if (peek()?.value !== '::') return;
    next();
    expect('word');
    if (peek()?.value === '[') {
      next();
      expect('punct', ']');
    }
  };

  const readValue = () => {
    const value = readBareValue();
    skipCast();
    return value;
  };

  const readBareValue = () => {
    const token = next();
    if (token.type === 'string' || token.type === 'number') return token.value;
    if (
      token.type === 'word' &&
      (token.value === 'true' || token.value === 'false')
    ) {
      return token.value === 'true';
    }
    if (token.type === 'word' && token.value === 'array') {
      expect('punct', '[');
      const items = [];
      if (peek().value === ']') {
        next();
        return items;
      }
      for (;;) {
        items.push(expect('string').value);
        if (next().value === ']') break;
      }
      return items;
    }
    throw new Error(`Unsupported SQL value ${JSON.stringify(token.value)}`);
  };

  const rows = [];
  for (;;) {
    expect('punct', '(');
    const values = [];
    for (;;) {
      values.push(readValue());
      if (next().value === ')') break;
    }
    if (values.length !== columns.length) {
      throw new Error(
        `Row has ${values.length} values for ${columns.length} columns`,
      );
    }
    const row = {};
    columns.forEach((column, index) => {
      const value = values[index];
      row[column] =
        ARRAY_COLUMNS.has(column) && typeof value === 'string'
          ? parseArrayLiteral(value)
          : value;
    });
    rows.push(row);
    const separator = next();
    if (separator.value === ';') break;
    if (separator.value !== ',')
      throw new Error('Expected , or ; between rows');
  }
  return rows;
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toDraftMeal(row, prefix, file) {
  const where = `${file}: ${row.name}`;
  if (row.review_status !== 'in_review' || row.is_active !== false) {
    throw new Error(
      `${where} is not an unreviewed draft; this generator only handles drafts (ADR-0010)`,
    );
  }
  if (!REGIONS.has(row.region)) throw new Error(`${where}: bad region`);
  if (!SLOTS.has(row.slot)) throw new Error(`${where}: bad slot`);
  if (row.goals.length === 0 || !row.goals.every((goal) => GOALS.has(goal))) {
    throw new Error(`${where}: bad goals`);
  }
  const macro = (value) => (typeof value === 'number' ? value : null);
  return {
    id: `${prefix}-${slugify(row.name)}`,
    name: row.name,
    region: row.region,
    slot: row.slot,
    goals: row.goals,
    calories_min: row.calories_min,
    calories_max: row.calories_max,
    protein_g: macro(row.protein_g),
    carbs_g: macro(row.carbs_g),
    fat_g: macro(row.fat_g),
    ingredients: row.ingredients,
    allergens: row.allergens,
    dietary_tags: row.dietary_tags,
  };
}

/** Parse both migrations into the ordered, validated draft meal list. */
function readDraftMeals() {
  const meals = [];
  for (const source of SOURCES) {
    const rows = parseMealsInsert(
      readFileSync(join(root, source.file), 'utf8'),
    );
    if (rows.length !== source.expectedCount) {
      throw new Error(
        `${source.file}: expected ${source.expectedCount} meals, found ${rows.length}`,
      );
    }
    meals.push(
      ...rows.map((row) => toDraftMeal(row, source.prefix, source.file)),
    );
  }
  const ids = new Set(meals.map((meal) => meal.id));
  if (ids.size !== meals.length) throw new Error('Duplicate draft meal ids');
  return meals;
}

/** Render the generated module, formatted with the repo's Prettier config. */
async function renderDraftCatalog() {
  const meals = readDraftMeals();
  const source = `// GENERATED by scripts/generate-draft-catalog.cjs — do not edit by hand.
// Sources:
${SOURCES.map((source) => `//   ${source.file}`).join('\n')}
// Regenerate with \`node scripts/generate-draft-catalog.cjs\`.
//
// UNREVIEWED DRAFTS (ADR-0010): every meal here is review_status 'in_review'
// and is_active false. Calories and macros are rough estimates pending
// dietitian review (#33). Loaded only outside production (see draftMeals.ts).

import type { CandidateMeal, MealGoal } from '@/features/recommendations';

export interface DraftMeal extends CandidateMeal {
  readonly region: 'nigeria' | 'united_states';
  readonly goals: readonly MealGoal[];
  readonly protein_g: number | null;
  readonly carbs_g: number | null;
  readonly fat_g: number | null;
  readonly ingredients: readonly string[];
}

export const DRAFT_CATALOG: readonly DraftMeal[] = ${JSON.stringify(meals)};
`;
  const prettier = require('prettier');
  const filepath = join(root, OUTPUT);
  const options = (await prettier.resolveConfig(filepath)) ?? {};
  return prettier.format(source, { ...options, filepath });
}

async function main() {
  const rendered = await renderDraftCatalog();
  const target = join(root, OUTPUT);
  if (process.argv.includes('--check')) {
    let current = '';
    try {
      current = readFileSync(target, 'utf8');
    } catch {
      // Missing file counts as stale.
    }
    if (current !== rendered) {
      console.error(
        `${OUTPUT} is stale. Run: node scripts/generate-draft-catalog.cjs`,
      );
      process.exit(1);
    }
    return;
  }
  writeFileSync(target, rendered);
  console.log(`Wrote ${OUTPUT}`);
}

module.exports = {
  OUTPUT,
  parseMealsInsert,
  readDraftMeals,
  renderDraftCatalog,
};

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
