/* global __dirname, Buffer */
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');

// Release-candidate secrets scan (issue #55). Scans every git-tracked text file
// for credentials that must never be committed (AGENTS.md, SECURITY_BASELINE).
// Repeatable: it runs in CI with the toolchain tests.

const root = join(__dirname, '../..');
const BINARY = /\.(png|jpe?g|gif|webp|ico|ttf|otf|woff2?|lock)$/i;
const SKIP = new Set(['package-lock.json']); // integrity hashes, not secrets

function trackedFiles() {
  return execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
    .filter((f) => !BINARY.test(f) && !SKIP.has(f));
}

/** Decode a JWT-shaped string's payload; null if it is not a real JWT. */
function jwtPayload(token) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const json = Buffer.from(
      parts[1].replace(/-/g, '+').replace(/_/g, '/'),
      'base64',
    ).toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const PATTERNS = [
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/],
  ['Supabase secret key', /\bsb_secret_[A-Za-z0-9_-]{10,}/],
  ['secret API key (sk_)', /\bsk_(?:live|test)_[A-Za-z0-9]{16,}/],
  ['RevenueCat secret key', /\bsk_[A-Za-z0-9]{28,}\b/],
  ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/],
];

test('no tracked file contains a credential', () => {
  const findings = [];
  for (const file of trackedFiles()) {
    let text;
    try {
      text = readFileSync(join(root, file), 'utf8');
    } catch {
      continue;
    }
    for (const [label, pattern] of PATTERNS) {
      if (pattern.test(text)) findings.push(`${file}: ${label}`);
    }
    // A real service-role JWT (decodes to role=service_role) must never appear.
    for (const match of text.matchAll(
      /eyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g,
    )) {
      const payload = jwtPayload(match[0]);
      if (payload && payload.role === 'service_role') {
        findings.push(`${file}: service-role JWT`);
      }
    }
  }
  assert.deepEqual(findings, [], `credentials found:\n${findings.join('\n')}`);
});

test('the scanner actually detects credentials (self-check)', () => {
  // Built at runtime so this file never contains a literal credential.
  const samples = {
    'private key': '-----BEGIN ' + 'PRIVATE KEY-----',
    'Supabase secret key': 'sb_' + 'secret_' + 'abcdefghij1234',
    'secret API key (sk_)': 'sk_' + 'live_' + 'abcdefghijklmnop1234',
    'RevenueCat secret key': 'sk_' + 'a'.repeat(30),
    'AWS access key': 'AKIA' + 'ABCDEFGHIJKLMNOP',
  };
  for (const [label, pattern] of PATTERNS) {
    assert.ok(pattern.test(samples[label]), `${label} pattern must match`);
  }
  const fakeServiceJwt = [
    'eyJhbGciOiJIUzI1NiJ9',
    Buffer.from(JSON.stringify({ role: 'service_role', pad: 'xxxxxxxx' }))
      .toString('base64')
      .replace(/=+$/, ''),
    'signaturexyz',
  ].join('.');
  assert.equal(jwtPayload(fakeServiceJwt)?.role, 'service_role');
});

test('no environment file other than .env.example is tracked', () => {
  const envFiles = trackedFiles().filter((f) => /(^|\/)\.env($|\.)/.test(f));
  assert.deepEqual(envFiles, ['.env.example']);
});

test('.env.example holds names only, never values', () => {
  const lines = readFileSync(join(root, '.env.example'), 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
  // EXPO_PUBLIC_APP_ENV=local is a non-secret default; everything else is empty.
  const withValues = lines.filter(
    (l) => !/=$/.test(l) && l !== 'EXPO_PUBLIC_APP_ENV=local',
  );
  assert.deepEqual(withValues, []);
});
