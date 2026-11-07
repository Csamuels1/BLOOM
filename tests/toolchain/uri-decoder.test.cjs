const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { createRequire } = require('node:module');
const { dirname, join } = require('node:path');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');

const routerRequire = createRequire(
  require.resolve('expo-router/package.json'),
);
const queryPath = routerRequire.resolve('query-string');
const queryRequire = createRequire(queryPath);
const query = routerRequire('query-string');

test('Router resolves the patched decoder through its actual query-string consumer', () => {
  const decoderPath = queryRequire.resolve('decode-uri-component');
  const metadata = JSON.parse(
    readFileSync(join(dirname(decoderPath), 'package.json'), 'utf8'),
  );
  assert.equal(metadata.version, '0.5.0');
  assert.equal(typeof queryRequire('decode-uri-component').default, 'function');
  assert.match(
    readFileSync(queryPath, 'utf8'),
    /require\('decode-uri-component'\)\.default/,
  );
});

test('query parsing preserves spaces, Unicode, arrays, empty values and fragments', () => {
  assert.deepEqual(
    { ...query.parse('name=Ol%C3%BA+Ada&tag=a&tag=b&empty=&flag&plus=%2B') },
    { name: 'Olú Ada', tag: ['a', 'b'], empty: '', flag: null, plus: '+' },
  );
  const result = query.parseUrl('/foundation?name=Ol%C3%BA#hello%20there', {
    parseFragmentIdentifier: true,
  });
  assert.equal(result.url, '/foundation');
  assert.equal(result.query.name, 'Olú');
  assert.equal(result.fragmentIdentifier, 'hello there');
  const values = { name: 'Olú Ada', plus: '+', empty: '' };
  assert.deepEqual({ ...query.parse(query.stringify(values)) }, values);
});

test('malformed percent sequences remain tolerated', () => {
  assert.deepEqual(
    { ...query.parse('bad=%C2&raw=%ZZ&bare=%') },
    {
      bad: '\uFFFD',
      raw: '%ZZ',
      bare: '%',
    },
  );
});

test('long malformed URL input finishes in a bounded child process', () => {
  // A timeout kills a regressed decoder rather than hanging the test runner.
  const source = `const q = require(${JSON.stringify(queryPath)});
    for (const input of ['%C2'.repeat(10000), '%FF%41'.repeat(10000), '%E0%A4'.repeat(10000)]) {
      if (typeof q.parse('value=' + input).value !== 'string') process.exit(2);
    }`;
  const result = spawnSync(process.execPath, ['-e', source], {
    timeout: 10000,
    encoding: 'utf8',
  });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
});
