const assert = require('assert').strict
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const hapticsPath = path.join(__dirname, '..', 'utils', 'haptics.js')

function createHarness() {
  let enabled = true
  let intensity = 'normal'
  const calls = { created: 0, started: 0, stopped: 0 }
  const vibrator = {
    scene: null,
    start() { calls.started += 1 },
    stop() { calls.stopped += 1 }
  }
  const context = {
    isVibrationEnabled: () => enabled,
    getVibrationIntensity: () => intensity,
    hmSensor: {
      id: { VIBRATE: 1 },
      createSensor() { calls.created += 1; return vibrator }
    },
    console
  }
  let source = fs.readFileSync(hapticsPath, 'utf8')
    .replace(/^import[^\n]+\n/, '')
    .replace(/export function /g, 'function ')
  source += '\nthis.api = { vibrateForState, stopVibration, destroyHaptics }'
  vm.runInNewContext(source, context, { filename: hapticsPath })
  return {
    api: context.api,
    calls,
    vibrator,
    setEnabled(value) { enabled = value },
    setIntensity(value) { intensity = value }
  }
}

function run() {
  let assertions = 0
  const check = (condition, message) => {
    assertions += 1
    assert.ok(condition, message)
  }
  const harness = createHarness()

  check(!harness.api.vibrateForState('MONITORING'), 'MONITORING no debe vibrar')
  check(harness.calls.created === 0, 'El sensor no debe crearse antes de necesitarse')
  check(harness.api.vibrateForState('EARLY_ALERT'), 'EARLY_ALERT debe vibrar')
  check(harness.vibrator.scene === 23, 'Intensidad normal debe usar escena 23')
  harness.setIntensity('strong')
  harness.api.vibrateForState('EARLY_ALERT')
  check(harness.vibrator.scene === 24, 'Intensidad fuerte anticipada debe usar escena 24')
  harness.api.vibrateForState('NEAR')
  check(harness.vibrator.scene === 25, 'NEAR debe usar escena 25')
  harness.api.vibrateForState('ARRIVED')
  check(harness.vibrator.scene === 9, 'ARRIVED debe usar escena finita 9 (cuatro pulsos)')
  check(harness.calls.created === 1, 'Debe existir una sola instancia VIBRATE')
  check(harness.calls.stopped === harness.calls.started,
    'Cada start debe ir precedido por stop')

  harness.api.destroyHaptics()
  check(harness.calls.stopped === harness.calls.started + 1,
    'destroyHaptics debe detener el sensor')
  harness.setEnabled(false)
  check(!harness.api.vibrateForState('NEAR'), 'Vibración desactivada debe respetarse')
  check(harness.calls.created === 1, 'No debe crear sensor con vibración desactivada')

  return {
    name: 'Vibración Zepp OS 1.0',
    assertions,
    detail: 'Escenas finitas 23/24/25/9, instancia única, desactivación y limpieza validadas'
  }
}

if (require.main === module) {
  try { const result = run(); console.log(`PASS ${result.name}: ${result.assertions} aserciones`) }
  catch (error) { console.error(error); process.exitCode = 1 }
}

module.exports = { run }
