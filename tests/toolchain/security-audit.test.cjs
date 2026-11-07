const assert = require('node:assert/strict');
const { test } = require('node:test');

const {
  ALLOWLIST,
  collectAdvisories,
  evaluate,
} = require('../../scripts/security-audit.cjs');

function advisory(ghsa, name, severity) {
  return {
    vulnerabilities: {
      [name]: {
        name,
        severity,
        via: [
          {
            name,
            severity,
            title: `${name} advisory`,
            url: `https://github.com/advisories/${ghsa}`,
          },
        ],
      },
    },
  };
}

test('collectAdvisories extracts GHSA ids from npm audit JSON', () => {
  const advisories = collectAdvisories(
    advisory('GHSA-aaaa-bbbb-cccc', 'left-pad', 'high'),
  );
  assert.equal(advisories.size, 1);
  assert.equal(advisories.get('GHSA-aaaa-bbbb-cccc').module, 'left-pad');
});

test('evaluate passes when every advisory is allowlisted', () => {
  const allowed = [...ALLOWLIST.keys()][0];
  const advisories = collectAdvisories(advisory(allowed, 'glob', 'moderate'));
  const { unexpected } = evaluate(advisories, ALLOWLIST);
  assert.deepEqual(unexpected, []);
});

test('evaluate fails on an advisory that is not allowlisted', () => {
  const advisories = collectAdvisories(
    advisory('GHSA-dead-beef-0000', 'shipped-pkg', 'high'),
  );
  const { unexpected } = evaluate(advisories, ALLOWLIST);
  assert.equal(unexpected.length, 1);
  assert.equal(unexpected[0].module, 'shipped-pkg');
});

test('evaluate reports stale allowlist entries that are no longer present', () => {
  const { stale } = evaluate(new Map(), ALLOWLIST);
  assert.equal(stale.length, ALLOWLIST.size);
});

test('the shipped zod advisory is fixed, not allowlisted for runtime', () => {
  // zod GHSA is allowlisted only for the build-time @expo/cli instance; the
  // app pins zod 4.6.7. Guard that the app dependency stays fixed.
  const pkg = require('../../package.json');
  assert.equal(pkg.dependencies.zod, '4.6.7');
});
