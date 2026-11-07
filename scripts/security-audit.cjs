#!/usr/bin/env node
// Dependency-audit gate for BLOOM.
//
// Plain `npm audit` cannot pass while Expo's CLI build toolchain carries known
// transitive advisories that only upstream can fix. This gate keeps the audit
// meaningful: it FAILS on any advisory that is not on the explicit, justified
// allowlist below. That means a newly introduced advisory, or any advisory on a
// package that actually ships to users, still breaks CI. The allowlisted entries
// are limited to Expo CLI / build-time tooling that never reaches the app bundle
// and, where applicable, are additionally mitigated by patch-package or
// package.json `overrides`.
//
// See docs/SECURITY_PATCHES.md for the full justification of each entry and the
// review record. Update both this file and that document together.
//
// Usage: node scripts/security-audit.cjs

'use strict';

const { spawnSync } = require('node:child_process');

/**
 * Accepted advisories (by GHSA id). Every entry is a build-time-only Expo CLI
 * dependency that is not part of the shipped application bundle. Prune an entry
 * once upstream removes the advisory; the gate reports stale entries so the list
 * cannot silently rot.
 */
const ALLOWLIST = new Map([
  [
    'GHSA-qr28-fpjm-wq7f',
    'decode-uri-component (expo-router url parsing, build tooling); patched via overrides + patches/query-string.',
  ],
  [
    'GHSA-gcqx-w48m-w2h4',
    'deepmerge (Expo CLI tooling); low severity, not in app bundle.',
  ],
  [
    'GHSA-3g3m-2fjr-6pw4',
    'glob (Expo CLI / build tooling); not in app bundle.',
  ],
  [
    'GHSA-g3hv-75wg-m249',
    'minimatch (Expo CLI / build tooling); not in app bundle.',
  ],
  [
    'GHSA-86w9-cpqp-85rv',
    'node-forge (@expo/code-signing, build tooling); patched via patches/node-forge.',
  ],
  [
    'GHSA-4642-5mcj-2rqw',
    'node-forge (@expo/code-signing, build tooling); patched via patches/node-forge.',
  ],
  [
    'GHSA-6wvx-3r32-xmcg',
    'node-forge (@expo/code-signing, build tooling); patched via patches/node-forge.',
  ],
  [
    'GHSA-525v-9gp9-w22h',
    'node-forge (@expo/code-signing, build tooling); patched via patches/node-forge.',
  ],
  [
    'GHSA-7wch-p9px-956x',
    'node-forge (@expo/code-signing, build tooling); patched via patches/node-forge.',
  ],
  [
    'GHSA-h6cr-wjv9-3cpp',
    'node-forge (@expo/code-signing, build tooling); patched via patches/node-forge.',
  ],
  [
    'GHSA-4487-j8r4-4g2f',
    'node-forge (@expo/code-signing, build tooling); patched via patches/node-forge.',
  ],
  [
    'GHSA-5cwg-6vw7-rj6p',
    'node-forge (@expo/code-signing, build tooling); patched via patches/node-forge.',
  ],
  [
    'GHSA-jc66-7q78-782g',
    'node-forge (@expo/code-signing, build tooling); patched via patches/node-forge.',
  ],
  [
    'GHSA-8hrf-8g6f-7xwp',
    'node-forge (@expo/code-signing, build tooling); patched via patches/node-forge.',
  ],
  [
    'GHSA-hqq3-7jhf-c5jx',
    'node-forge (@expo/code-signing, build tooling); patched via patches/node-forge.',
  ],
  [
    'GHSA-5x38-2vff-x55p',
    'node-forge (@expo/code-signing, build tooling); patched via patches/node-forge.',
  ],
  [
    'GHSA-mrhx-c7xc-m3w5',
    'zod: shipped zod is pinned to 4.6.7 (fixed). Remaining instance is @expo/cli nested zod@3.25.76, build tooling only.',
  ],
]);

function runAudit() {
  // Static command string with shell:true: works for npm's .cmd shim on
  // Windows and avoids DEP0190 (which only warns on an args array + shell).
  const result = spawnSync('npm audit --json', {
    encoding: 'utf8',
    shell: true,
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.error) {
    throw new Error(`Failed to run npm audit: ${result.error.message}`);
  }
  if (!result.stdout) {
    throw new Error('npm audit produced no output.');
  }
  return JSON.parse(result.stdout);
}

function collectAdvisories(report) {
  const advisories = new Map();
  const vulns = report.vulnerabilities || {};
  for (const node of Object.values(vulns)) {
    for (const via of node.via || []) {
      if (typeof via !== 'object' || !via.url) continue;
      const ghsa = String(via.url).split('/').pop();
      advisories.set(ghsa, {
        ghsa,
        module: via.name,
        severity: via.severity,
        title: via.title,
        url: via.url,
      });
    }
  }
  return advisories;
}

/**
 * Partition advisories against the allowlist. Pure function for testing.
 * @param {Map<string, object>} advisories
 * @param {Map<string, string>} allowlist
 */
function evaluate(advisories, allowlist) {
  const unexpected = [];
  const seen = new Set();
  for (const advisory of advisories.values()) {
    seen.add(advisory.ghsa);
    if (!allowlist.has(advisory.ghsa)) {
      unexpected.push(advisory);
    }
  }
  const stale = [...allowlist.keys()].filter((ghsa) => !seen.has(ghsa));
  return { unexpected, stale, seenCount: seen.size };
}

function main() {
  const report = runAudit();
  const advisories = collectAdvisories(report);

  const { unexpected, stale, seenCount } = evaluate(advisories, ALLOWLIST);
  if (stale.length > 0) {
    console.warn('Allowlisted advisories no longer present (prune them):');
    for (const ghsa of stale) console.warn(`  - ${ghsa}`);
    console.warn('');
  }

  if (unexpected.length > 0) {
    console.error('Dependency audit failed: advisories not on the allowlist.');
    for (const a of unexpected) {
      console.error(`  - [${a.severity}] ${a.module} ${a.ghsa} ${a.title}`);
    }
    console.error('');
    console.error('Fix the dependency, or (only for an accepted build-time');
    console.error(
      'advisory) add it to ALLOWLIST with justification and update',
    );
    console.error('docs/SECURITY_PATCHES.md.');
    process.exit(1);
  }

  console.log(
    `Dependency audit passed: ${seenCount} known advisory(ies), all allowlisted (build-time Expo tooling).`,
  );
}

module.exports = { ALLOWLIST, collectAdvisories, evaluate };

if (require.main === module) {
  main();
}
