/* global __dirname */
const assert = require('node:assert/strict');
const { readFileSync, readdirSync, statSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');

const root = join(__dirname, '../..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

// Third-party telemetry, analytics, and session-replay SDKs. BLOOM's telemetry
// is first-party only (ADR-0014) and session replay must not exist (#53).
const FORBIDDEN_PACKAGE = new RegExp(
  [
    'sentry',
    'bugsnag',
    'crashlytics',
    'logrocket',
    'fullstory',
    'hotjar',
    'smartlook',
    'uxcam',
    'instabug',
    'datadog',
    'posthog',
    'amplitude',
    'mixpanel',
    'segment',
    'appsflyer',
    'adjust',
    'clarity',
    'replay',
  ].join('|'),
  'i',
);

function sourceFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full));
    else if (/\.(ts|tsx|js|jsx)$/.test(entry)) out.push(full);
  }
  return out;
}

test('no third-party telemetry or session-replay SDK is a dependency', () => {
  const pkg = JSON.parse(read('package.json'));
  const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
  const offenders = deps.filter((d) => FORBIDDEN_PACKAGE.test(d));
  assert.deepEqual(offenders, [], `forbidden telemetry deps: ${offenders}`);
});

test('no app source imports a telemetry or replay SDK', () => {
  const offenders = [];
  for (const file of sourceFiles(join(root, 'src'))) {
    const text = readFileSync(file, 'utf8');
    for (const match of text.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
      const spec = match[1];
      if (
        !spec.startsWith('.') &&
        !spec.startsWith('@/') &&
        FORBIDDEN_PACKAGE.test(spec)
      ) {
        offenders.push(`${file}: ${spec}`);
      }
    }
  }
  assert.deepEqual(offenders, []);
});

test('the client analytics allowlist matches the server allowlist exactly', () => {
  const sql = read(
    'supabase/migrations/20261111061014_product_catalog_community_subscriptions.sql',
  );
  const block = sql.slice(
    sql.indexOf('insert into public.analytics_event_types'),
  );
  const serverEvents = [
    ...block.slice(0, block.indexOf(';')).matchAll(/\('([a-z_]+)',/g),
  ].map((m) => m[1]);

  const client = read('src/features/telemetry/analytics.ts');
  const listBlock = client.slice(
    client.indexOf('ANALYTICS_EVENTS = ['),
    client.indexOf('] as const'),
  );
  const clientEvents = [...listBlock.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);

  assert.ok(serverEvents.length > 0, 'parsed server allowlist');
  assert.deepEqual(clientEvents.sort(), serverEvents.sort());
});

test('every allowlisted analytics event has an emitter in the app (no dead events)', () => {
  const client = read('src/features/telemetry/analytics.ts');
  const listBlock = client.slice(
    client.indexOf('ANALYTICS_EVENTS = ['),
    client.indexOf('] as const'),
  );
  const events = [...listBlock.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
  const appSource = sourceFiles(join(root, 'src'))
    .filter((f) => !f.includes(join('features', 'telemetry')))
    .map((f) => readFileSync(f, 'utf8'))
    .join('\n');
  const missing = events.filter((e) => !appSource.includes(`track('${e}')`));
  assert.deepEqual(missing, [], `allowlisted events never emitted: ${missing}`);
});

test('crash payloads are fixed-schema: the reporter exposes no context bag', () => {
  const reporter = read('src/features/telemetry/crashReporter.ts');
  for (const banned of [
    'breadcrumb',
    'setUser',
    'setContext',
    'setExtra',
    'screenshot',
  ]) {
    assert.ok(
      !new RegExp(banned, 'i').test(reporter.replace(/\/\*[\s\S]*?\*\//g, '')),
      `crash reporter must not implement ${banned}`,
    );
  }
});
