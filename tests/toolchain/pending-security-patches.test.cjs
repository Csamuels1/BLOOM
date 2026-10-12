const assert = require('node:assert/strict');
const { generateKeyPairSync } = require('node:crypto');
const { createRequire } = require('node:module');
const { test } = require('node:test');

const tailwindRequire = createRequire(require.resolve('tailwindcss'));
const braces = tailwindRequire('braces');
const expoRequire = createRequire(require.resolve('expo/package.json'));
const cliRequire = createRequire(expoRequire.resolve('@expo/cli'));
const forge = cliRequire('node-forge');

test('braces preserves ordinary nesting, ranges and escaped braces', () => {
  assert.deepEqual(braces.expand('src/{app,{content,types}}/*.ts'), [
    'src/app/*.ts',
    'src/content/*.ts',
    'src/types/*.ts',
  ]);
  assert.deepEqual(braces.expand('item{1..3}'), ['item1', 'item2', 'item3']);
  assert.equal(braces.stringify(braces.parse('a/{b,c}')), 'a/{b,c}');
  assert.doesNotThrow(() => braces.compile('\\{literal\\}'));
});

test('braces rejects deeply nested strings before recursive AST walkers run', () => {
  for (const pattern of [
    '{'.repeat(4000) + 'a,b' + '}'.repeat(4000),
    '{'.repeat(4000),
    '('.repeat(4000) + 'x' + ')'.repeat(4000),
  ]) {
    for (const operation of ['parse', 'compile', 'expand', 'stringify']) {
      assert.throws(() => braces[operation](pattern), {
        name: 'SyntaxError',
        message: /BLOOM safety limit/,
      });
    }
  }
});

test('braces also bounds directly supplied ASTs, including child cycles', () => {
  let ast = { type: 'text', value: 'x' };
  for (let i = 0; i < 100; i++) ast = { type: 'root', nodes: [ast] };
  const cycle = { type: 'root', nodes: [] };
  cycle.nodes.push(cycle);
  for (const input of [ast, cycle]) {
    for (const operation of ['compile', 'expand', 'stringify']) {
      assert.throws(() => braces[operation](input), {
        name: 'SyntaxError',
        message: /BLOOM safety limit/,
      });
    }
  }
});

// Ephemeral synthetic keys only: no user keys, credentials or stored secrets.
const pem = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
});
const privateKey = forge.pki.privateKeyFromPem(pem.privateKey);
const publicKey = forge.pki.publicKeyFromPem(pem.publicKey);
const digest = forge.md.sha256
  .create()
  .update('BLOOM synthetic test')
  .digest()
  .getBytes();
const asn = (type, value, constructed = false) =>
  forge.asn1.create(forge.asn1.Class.UNIVERSAL, type, constructed, value);
const T = forge.asn1.Type;

function signature({
  omitNull = false,
  nestedExtra = false,
  outerExtra = false,
} = {}) {
  const algorithm = [
    asn(T.OID, forge.asn1.oidToDer(forge.oids.sha256).getBytes()),
  ];
  if (!omitNull) algorithm.push(asn(T.NULL, ''));
  if (nestedExtra) algorithm.push(asn(T.OCTETSTRING, 'unexpected'));
  const info = [asn(T.SEQUENCE, algorithm, true), asn(T.OCTETSTRING, digest)];
  if (outerExtra) info.push(asn(T.OCTETSTRING, 'unexpected'));
  return privateKey.sign(
    forge.asn1.toDer(asn(T.SEQUENCE, info, true)).getBytes(),
    'NONE',
  );
}

test('Forge accepts valid SHA-256 DigestInfo with present or absent NULL', () => {
  assert.equal(publicKey.verify(digest, signature()), true);
  assert.equal(publicKey.verify(digest, signature({ omitNull: true })), true);
  assert.equal(publicKey.verify('wrong digest', signature()), false);
});

test('Forge rejects extra nested elements with or without NULL parameters', () => {
  for (const omitNull of [false, true]) {
    assert.throws(
      () =>
        publicKey.verify(digest, signature({ omitNull, nestedExtra: true })),
      /DigestInfo/,
    );
  }
});

test('Forge retains rejection of extra outer DigestInfo elements', () => {
  assert.throws(
    () => publicKey.verify(digest, signature({ outerExtra: true })),
    /DigestInfo/,
  );
});
