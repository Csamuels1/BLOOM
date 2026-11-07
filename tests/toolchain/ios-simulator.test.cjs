const assert = require('node:assert/strict');
const { test } = require('node:test');
const { selectSimulator } = require('../../scripts/select-ios-simulator.cjs');

const oldId = '11111111-1111-1111-1111-111111111111';
const newId = '22222222-2222-2222-2222-222222222222';
const device = (udid, overrides = {}) => ({
  name: 'iPhone 17',
  udid,
  isAvailable: true,
  state: 'Shutdown',
  ...overrides,
});

test('selects the newest available iOS iPhone runtime, not another platform', () => {
  assert.equal(
    selectSimulator({
      devices: {
        'com.apple.CoreSimulator.SimRuntime.iOS-18-5': [device(oldId)],
        'com.apple.CoreSimulator.SimRuntime.iOS-26-0': [device(newId)],
        'com.apple.CoreSimulator.SimRuntime.tvOS-27-0': [device(oldId)],
      },
    }),
    newId,
  );
});

test('ignores unavailable, already booted, non-phone and malformed devices', () => {
  assert.equal(
    selectSimulator({
      devices: {
        'com.apple.CoreSimulator.SimRuntime.iOS-26-0': [
          device(oldId, { isAvailable: false }),
          device(oldId, { state: 'Booted' }),
          device(oldId, { name: 'iPad' }),
          device('not-a-device-id'),
          device(newId),
        ],
      },
    }),
    newId,
  );
});

test('fails explicitly when no usable simulator is installed', () => {
  assert.throws(() => selectSimulator({ devices: {} }), /No available/);
});
