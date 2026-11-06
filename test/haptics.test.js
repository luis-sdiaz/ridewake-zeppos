const assert = require('assert').strict
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const projectRoot = path.resolve(__dirname, '..')
const hapticsPath = path.join(projectRoot, 'utils', 'haptics.js')

function createHarness() {
  let mode = 'normal'
  let nextTimerId = 1
  const calls = { starts: 0, stops: 0, timers: [], stoppedTimers: [] }
  const vibrator = {
    scene: null,
    start() { calls.starts += 1 },
    stop() { calls.stops += 1 }
  }
  const context = {
    getHapticMode: () => mode,
    hmSensor: {
      id: { VIBRATE: 'VIBRATE' },
      createSensor: () => vibrator
    },
    timer: {
      createTimer(delay, period, callback, options) {
        const record = { id: nextTimerId, delay, period, callback, options }
        nextTimerId += 1
        calls.timers.push(record)
        return record.id
      },
      stopTimer(id) { calls.stoppedTimers.push(id) }
    },
    console
  }

  let source = fs.readFileSync(hapticsPath, 'utf8')
    .replace(/^import[^\n]+\n/, '')
    .replace(/export function /g, 'function ')
  source += '\nthis.hapticsApi = { initHaptics, stopVibration, vibrateShort, vibrateWarning, destroyHaptics }\n'
  vm.runInNewContext(source, context, { filename: hapticsPath })

  return {
    api: context.hapticsApi,
    calls,
    vibrator,
    setMode(value) { mode = value }
  }
}

function run() {
  let assertions = 0
  const check = (condition, message) => {
    assertions += 1
    assert.ok(condition, message)
  }
  const harness = createHarness()

  harness.api.vibrateShort()
  check(harness.calls.starts === 1, 'vibrateShort no inició el sensor')
  check(harness.vibrator.scene === 1, 'vibrateShort no configuró la escena corta')
  check(harness.calls.timers[0].delay === 90, 'La vibración normal corta debe durar 90 ms')
  harness.calls.timers[0].callback()
  check(harness.calls.stoppedTimers.includes(harness.calls.timers[0].id),
    'El callback corto no eliminó su temporizador')

  harness.setMode('strong')
  harness.api.vibrateWarning()
  check(harness.calls.starts === 2, 'vibrateWarning no inició el sensor')
  check(harness.vibrator.scene === 5, 'vibrateWarning no configuró la escena de alerta')
  check(harness.calls.timers[1].delay === 650, 'La alerta intensa debe durar 650 ms')

  harness.api.destroyHaptics()
  check(harness.calls.stoppedTimers.includes(harness.calls.timers[1].id),
    'destroyHaptics no detuvo el temporizador pendiente')
  check(harness.calls.stops >= 3, 'destroyHaptics no detuvo el vibrador')

  return {
    name: 'Ciclo de vida háptico',
    assertions,
    detail: 'Duraciones, escenas y liberación de temporizadores/sensor verificadas'
  }
}

if (require.main === module) {
  try {
    const result = run()
    console.log(`PASS ${result.name}: ${result.assertions} aserciones`)
  } catch (error) {
    console.error(`FAIL Ciclo de vida háptico: ${error.stack || error.message}`)
    process.exitCode = 1
  }
}

module.exports = { run }
