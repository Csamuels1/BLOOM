const { readFileSync } = require('node:fs');

function selectSimulator(inventory) {
  const candidates = Object.entries(inventory.devices ?? {})
    .filter(([runtime]) => runtime.includes('.iOS-'))
    .sort(([a], [b]) => b.localeCompare(a, undefined, { numeric: true }))
    .flatMap(([, devices]) => devices)
    .filter(
      (device) =>
        device.isAvailable === true &&
        device.state === 'Shutdown' &&
        device.name.startsWith('iPhone') &&
        /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(
          device.udid,
        ),
    );
  if (!candidates[0])
    throw new Error('No available shutdown iPhone simulator found');
  return candidates[0].udid;
}

if (require.main === module) {
  console.log(selectSimulator(JSON.parse(readFileSync(0, 'utf8'))));
}

module.exports = { selectSimulator };
