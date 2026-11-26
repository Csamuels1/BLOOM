/* global __dirname */
const assert = require('node:assert/strict');
const { readFileSync, readdirSync, statSync } = require('node:fs');
const { join, relative } = require('node:path');
const { test } = require('node:test');

const root = join(__dirname, '../..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

// Screens that host text input, directly or through a feature component. On
// Android (edge-to-edge) the keyboard covers their actions unless they scroll
// inside KeyboardSafeScrollView (#146).
const INPUT_SCREENS = [
  'src/features/auth/AuthScaffold.tsx',
  'src/features/onboarding/OnboardingFlow.tsx',
  'src/app/(app)/weight-log.tsx',
  'src/app/(app)/cycle.tsx',
  'src/app/(app)/(tabs)/community.tsx',
];

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

test('every input screen scrolls inside KeyboardSafeScrollView (#146)', () => {
  for (const file of INPUT_SCREENS) {
    const source = read(file);
    assert.ok(
      source.includes('<KeyboardSafeScrollView'),
      `${file} must use KeyboardSafeScrollView`,
    );
    assert.ok(!/<ScrollView\b/.test(source), `${file} uses a bare ScrollView`);
  }
});

test('no file renders a text field inside a bare ScrollView (#146)', () => {
  const offenders = walk(join(root, 'src'))
    .filter((path) => /\.tsx$/.test(path) && !/\.web\.tsx$/.test(path))
    .filter((path) => {
      const source = readFileSync(path, 'utf8');
      return (
        /<ScrollView\b/.test(source) &&
        /<(Controlled)?TextField\b|<TextInput\b/.test(source)
      );
    })
    .map((path) => relative(root, path));
  assert.deepEqual(offenders, []);
});

test('KeyboardSafeScrollView avoids the keyboard on every platform', () => {
  const source = read('src/components/KeyboardSafeScrollView.tsx');
  assert.match(source, /behavior="padding"/);
  assert.doesNotMatch(source, /Platform\.OS/);
  assert.match(source, /keyboardShouldPersistTaps="handled"/);
});

// #146: on Android (Expo Go, SDK 57) a Pressable style *function* was not
// applied. The primary button lost its plum fill and "Sign in" vanished,
// ivory on ivory. Visuals belong on a plain inner View (Pressable's children
// function provides `pressed`).
test('no Pressable styles itself with a style function (#146)', () => {
  const offenders = walk(join(root, 'src'))
    .filter((path) => /\.tsx$/.test(path))
    .filter((path) => /style=\{\(\{\s*pressed/.test(readFileSync(path, 'utf8')))
    .map((path) => relative(root, path));
  assert.deepEqual(offenders, []);
});

test('no style hands the native view transform: undefined (#146)', () => {
  const offenders = walk(join(root, 'src'))
    .filter((path) => /\.tsx$/.test(path))
    .filter((path) =>
      /transform:[^,}]*:\s*undefined/.test(readFileSync(path, 'utf8')),
    )
    .map((path) => relative(root, path));
  assert.deepEqual(offenders, []);
});
