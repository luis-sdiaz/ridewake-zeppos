const assert = require('assert').strict
const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const simulatorPath = path.join(projectRoot, 'utils', 'routeSimulator.js')
const expectedStates = ['MONITORING', 'EARLY_ALERT', 'NEAR', 'ARRIVED']
const expectedProgress = [0.10, 0.50, 0.90, 1.0]

async function loadSimulator() {
  const source = fs.readFileSync(simulatorPath, 'utf8')
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
  return import(moduleUrl)
}

async function run() {
  let assertions = 0
  const check = (condition, message) => {
    assertions += 1
    assert.ok(condition, message)
  }

  check(fs.existsSync(simulatorPath), `No existe ${simulatorPath}`)
  const simulator = await loadSimulator()
  check(typeof simulator.getRouteSteps === 'function', 'getRouteSteps no está exportada')

  const destinations = ['home', 'Casa', 'university', 'Universidad', 'fallback']
  for (const destination of destinations) {
    const steps = simulator.getRouteSteps(destination)
    check(Array.isArray(steps), `${destination}: la ruta debe ser un arreglo`)
    check(steps.length === 4, `${destination}: la ruta debe contener 4 pasos`)

    assertions += 2
    assert.deepStrictEqual(steps.map((step) => step.state), expectedStates,
      `${destination}: secuencia de estados incorrecta`)
    assert.deepStrictEqual(steps.map((step) => step.progress), expectedProgress,
      `${destination}: progresos incorrectos`)

    for (let index = 1; index < steps.length; index += 1) {
      check(steps[index].progress > steps[index - 1].progress,
        `${destination}: el progreso no es estrictamente creciente`)
      check(parseFloat(steps[index].distance) < parseFloat(steps[index - 1].distance),
        `${destination}: la distancia no disminuye estrictamente`)
    }

    check(steps[steps.length - 1].distance === '0.0 km',
      `${destination}: la ruta no termina en 0.0 km`)
    check(steps.every((step) => typeof step.stop === 'string' && step.stop.trim().length > 0),
      `${destination}: todas las paradas deben tener nombre`)
  }

  const firstHomeRoute = simulator.getRouteSteps('home')
  firstHomeRoute[0].stop = 'Mutada'
  const secondHomeRoute = simulator.getRouteSteps('home')
  check(secondHomeRoute[0].stop === 'Parque Bolívar',
    'getRouteSteps debe devolver copias independientes')
  check(simulator.getRouteSteps('unknown')[0].stop === 'Parque Bolívar',
    'Un destino desconocido debe usar la ruta Casa como fallback')

  return {
    name: 'Simulador de rutas',
    assertions,
    detail: 'Rutas Casa/Universidad, fallback, progreso, distancia y estados validados'
  }
}

if (require.main === module) {
  run()
    .then((result) => {
      console.log(`PASS ${result.name}: ${result.assertions} aserciones`)
    })
    .catch((error) => {
      console.error(`FAIL Simulador de rutas: ${error.message}`)
      process.exitCode = 1
    })
}

module.exports = { run }
