const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { test } = require('node:test');

// Resolve through the real consumers so a nested vulnerable copy cannot hide
// behind a patched top-level package. These tests use Node, not RN Jest mocks.
const xcodeRequire = createRequire(require.resolve('xcode'));
const tailwindRequire = createRequire(require.resolve('tailwindcss'));
const nestedRequire = createRequire(tailwindRequire.resolve('postcss-nested'));

test('Xcode resolves the patched CommonJS UUID implementation', () => {
  assert.equal(xcodeRequire('uuid/package.json').version, '11.1.1');
  const uuid = xcodeRequire('uuid');
  assert.equal(uuid.validate(uuid.v4()), true);
  assert.throws(
    () => uuid.v5('bloom', uuid.v5.DNS, new Uint8Array(1)),
    RangeError,
  );
});

test('Xcode still generates unique 24-character project identifiers', () => {
  const project = require('xcode').project('synthetic.pbxproj');
  project.hash = { project: { objects: {} } };
  const ids = Array.from({ length: 100 }, () => project.generateUuid());
  assert.equal(new Set(ids).size, 100);
  for (const id of ids) assert.match(id, /^[A-F0-9]{24}$/);
});

test('both Tailwind and nested CSS resolve the patched selector parser', () => {
  for (const consumer of [tailwindRequire, nestedRequire]) {
    assert.equal(
      consumer('postcss-selector-parser/package.json').version,
      '7.1.6',
    );
  }
});

test('Tailwind still compiles arbitrary colors, touch targets and state variants', async () => {
  const postcss = tailwindRequire('postcss');
  const tailwind = require('tailwindcss');
  const result = await postcss([
    tailwind({
      content: [
        { raw: '<div class="bg-[#3B2A35] min-h-[48px] active:opacity-80" />' },
      ],
      corePlugins: { preflight: false },
    }),
  ]).process('@tailwind utilities;', { from: undefined });
  assert.match(result.css, /min-height: 48px/);
  assert.match(result.css, /59 42 53/);
  assert.match(result.css, /:active/);
  assert.match(result.css, /opacity: 0\.8/);
});

test('nested CSS retains parent selectors and pseudo-class combinations', async () => {
  const postcss = tailwindRequire('postcss');
  const nested = tailwindRequire('postcss-nested');
  const result = await postcss([nested()]).process(
    '.bloom { &:focus, &:active { opacity: 0.8; } .label { color: plum; } }',
    { from: undefined },
  );
  assert.match(result.css, /\.bloom:focus,\s*\.bloom:active/);
  assert.match(result.css, /\.bloom \.label/);
});
