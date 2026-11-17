/* global __dirname */
const assert = require('node:assert/strict');
const { readFileSync, readdirSync, statSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');

const repoRoot = join(__dirname, '../..');
const srcRoot = join(repoRoot, 'src');

/** All source files under src/, recursively. */
function sourceFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...sourceFiles(full));
    } else if (/\.(ts|tsx|js|jsx|cjs|mjs)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

const read = (rel) => readFileSync(join(repoRoot, rel), 'utf8');

/**
 * Strip comments so a scan sees only executable code. Documentation that
 * explains the *absence* of a service key (as this codebase does) must not count
 * as a reference. `//` is only treated as a line comment at line start or after
 * whitespace, so `https://` inside a string is left intact.
 */
function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|\s)\/\/[^\n]*/g, '$1');
}

// 1. No service-role key may reach the app bundle — the browser and device both
//    only ever hold the public anon/publishable key (acceptance: "No service key
//    reaches browser").
test('no service-role key reference exists anywhere in src/', () => {
  const needles = [
    'service_role',
    'serviceRole',
    'SERVICE_ROLE',
    'serviceKey',
    'SUPABASE_SERVICE',
  ];
  const offenders = [];
  for (const file of sourceFiles(srcRoot)) {
    const text = stripComments(readFileSync(file, 'utf8'));
    for (const needle of needles) {
      if (text.includes(needle)) {
        offenders.push(`${file}: ${needle}`);
      }
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `service-role references found:\n${offenders.join('\n')}`,
  );
});

// 2. The Supabase client is built from the publishable (anon) key only.
test('supabase client uses the publishable key, never a service key', () => {
  const client = read('src/lib/supabase.ts');
  assert.ok(
    client.includes('supabasePublishableKey'),
    'client should use the publishable key',
  );
  assert.ok(
    !/service/i.test(stripComments(client)),
    'client code must not reference a service key',
  );
});

// 3. The moderation data layer is web-only: the NATIVE screen (the file Metro
//    resolves for iOS/Android) must contain no queries, no RPCs and no signed
//    URLs, and must not import the service or store (acceptance: "Staff routes
//    are web-only").
test('native moderation stub contains no data access', () => {
  const stub = read('src/features/moderation/ModerationQueueScreen.tsx');
  for (const forbidden of [
    './moderationService',
    './moderationStore',
    '.from(',
    '.rpc(',
    'createSignedUrl',
    'getSupabaseClient',
  ]) {
    assert.ok(
      !stub.includes(forbidden),
      `native moderation stub must not contain "${forbidden}"`,
    );
  }
});

// 4. The feature barrel exports only the platform-resolved screen, so importing
//    it from a native route never pulls the web-only data layer into the native
//    bundle.
test('moderation barrel does not import the web data layer', () => {
  const barrel = read('src/features/moderation/index.ts');
  // Ignore comments; only a real import/export statement would bundle the code.
  const code = barrel
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|\s)\/\/[^\n]*/g, '');
  assert.ok(!/from '\.\/moderationService'/.test(code));
  assert.ok(!/from '\.\/moderationStore'/.test(code));
  assert.ok(code.includes('./ModerationQueueScreen'));
});

// 5. The web screen DOES carry the real data layer (guards against the split
//    being inverted or emptied).
test('web moderation screen wires the real queue', () => {
  const web = read('src/features/moderation/ModerationQueueScreen.web.tsx');
  assert.ok(web.includes('useModerationStore'));
  assert.ok(web.includes('isModeratorSession'));
});
