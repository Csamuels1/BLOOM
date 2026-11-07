/* global __dirname */
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { createRequire } = require('node:module');
const { dirname, join } = require('node:path');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');

const loaderRequire = createRequire(
  require.resolve('@istanbuljs/load-nyc-config'),
);
const yamlPath = loaderRequire.resolve('js-yaml');
const yamlRequire = createRequire(yamlPath);

test('coverage tooling uses YAML 4 and argparse 2 without sprintf-js in the lockfile', () => {
  assert.equal(loaderRequire('js-yaml/package.json').version, '4.3.2');
  assert.equal(yamlRequire('argparse/package.json').version, '2.0.1');
  const lock = JSON.parse(
    readFileSync(join(__dirname, '../../package-lock.json'), 'utf8'),
  );
  assert.equal(
    Object.keys(lock.packages).some((key) => key.endsWith('/sprintf-js')),
    false,
  );
});

test('actual NYC loader reads YAML inheritance and normalizes configuration keys', async () => {
  const { loadNycConfig } = require('@istanbuljs/load-nyc-config');
  const config = await loadNycConfig({
    cwd: join(__dirname, '../fixtures'),
    nycrcPath: join(__dirname, '../fixtures/nyc-override.yml'),
  });
  assert.equal(config.all, true);
  assert.equal(config.checkCoverage, true);
  assert.equal(config.branches, 80);
  assert.deepEqual(config.extension, ['.ts']);
  assert.deepEqual(config.exclude, ['tests/**']);
  assert.deepEqual(config.reporter, ['text', 'json']);
});

test('the scoped YAML CLI preserves help and stdin conversion', () => {
  const cli = join(dirname(yamlPath), 'bin/js-yaml.js');
  const help = spawnSync(process.execPath, [cli, '--help'], {
    encoding: 'utf8',
    timeout: 10000,
  });
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /usage:/i);
  const parsed = spawnSync(process.execPath, [cli], {
    input: 'enabled: true\nthreshold: 80\n',
    encoding: 'utf8',
    timeout: 10000,
  });
  assert.equal(parsed.status, 0, parsed.stderr);
  assert.deepEqual(JSON.parse(parsed.stdout), { enabled: true, threshold: 80 });
});

test('the upgraded YAML parser rejects JavaScript-specific tags and malformed YAML', () => {
  const yaml = loaderRequire('js-yaml');
  assert.throws(() => yaml.load('value: !!js/undefined ""'));
  assert.throws(() => yaml.load('value: [unterminated'));
  assert.equal(yaml.load('code: "0128"').code, '0128');
});
