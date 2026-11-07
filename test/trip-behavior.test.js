const assert = require('assert').strict
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const projectRoot = path.join(__dirname, '..')

function stripImports(source) {
  return source.replace(/^import\s+[\s\S]*?\s+from\s+['"][^'"]+['"]\s*\r?\n/gm, '')
}

async function loadPrediction() {
  const modelSource = fs.readFileSync(path.join(projectRoot, 'utils', 'mlModel.js'), 'utf8')
  const modelUrl = `data:text/javascript;base64,${Buffer.from(modelSource).toString('base64')}`
  const source = fs.readFileSync(path.join(projectRoot, 'utils', 'prediction.js'), 'utf8')
    .replace("'./mlModel'", `'${modelUrl}'`)
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
}

function createRuntime(shared, predictionApi) {
  const widgets = []
  const calls = { routes: [], back: 0, haptics: [], destroyHaptics: 0 }
  const timers = new Map()
  let nextTimer = 0
  let page
  const hmUI = {
    widget: { TEXT: 'TEXT', BUTTON: 'BUTTON', FILL_RECT: 'FILL_RECT' },
    prop: { MORE: 'MORE', TEXT: 'TEXT' },
    align: { CENTER_H: 1, CENTER_V: 2 },
    text_style: { NONE: 0, WRAP: 1 },
    createWidget(type, props) {
      const widget = {
        type, props: Object.assign({}, props), updates: 0,
        setProperty(property, value) {
          this.updates += 1
          if (property === 'TEXT') this.props.text = value
          else Object.assign(this.props, value)
        }
      }
      widgets.push(widget); return widget
    }
  }
  const context = {
    Page(value) { page = value }, hmUI, console, Object, Math,
    timer: {
      createTimer(delay, repeat, callback) { const id = nextTimer++; timers.set(id, callback); return id },
      stopTimer(id) { timers.delete(id) }
    },
    getGlobalState: () => shared,
    hmApp: {
      gotoPage(options) { calls.routes.push(options.url) },
      goBack() { calls.back += 1 }
    },
    t: (key) => key,
    getLanguage: () => shared.language,
    getSelectedDestination: () => shared.destination,
    getCustomDestination: () => null,
    clearCustomDestination() {},
    getTheme: () => 'dark',
    setSelectedDestination(value) { shared.destination = value; return value },
    getRouteSummary: predictionApi.getRouteSummary,
    createPrediction: predictionApi.createPrediction,
    advancePrediction: predictionApi.advancePrediction,
    formatDistance: predictionApi.formatDistance,
    formatEta: predictionApi.formatEta,
    getActiveTheme: () => ({ bg: 0, title: 1, textPrimary: 2, textSecondary: 3, btnSecondary: 4, btnSecondaryPress: 5, btnSecondaryText: 6, accent: 7, accentPress: 8, onAccent: 9, alertNear: 10, alertEarly: 11 }),
    createPageBackground: () => null,
    startTripSession() { shared.tripRunId += 1; shared.tripActive = true; return shared.tripRunId },
    finishTripSession() { shared.tripActive = false },
    vibrateForState(state) { calls.haptics.push(state); return true },
    destroyHaptics() { calls.destroyHaptics += 1 },
    layoutValue: (compactValue, expandedValue) => expandedValue,
    measureWrappedText: (text, size, width, minimumHeight) => minimumHeight
  }
  vm.runInNewContext(fs.readFileSync(path.join(projectRoot, 'utils', 'nativeTimer.js'), 'utf8')
    .replace(/export function /g, 'function '), context)
  return {
    context, widgets, calls, timers,
    tick() { Array.from(timers.values()).forEach((callback) => callback()) },
    load(name) {
      const source = fs.readFileSync(path.join(projectRoot, 'page', `${name}.js`), 'utf8')
      vm.runInNewContext(stripImports(source), context, { filename: `${name}.js` })
      page.build()
      return page
    }
  }
}

async function run() {
  let assertions = 0
  const check = (condition, message) => { assertions += 1; assert.ok(condition, message) }
  const predictionApi = await loadPrediction()
  const shared = { destination: null, language: 'es', tripRunId: 0, tripActive: false }

  let runtime = createRuntime(shared, predictionApi)
  runtime.load('index')
  let byText = (text) => runtime.widgets.find((widget) => widget.props.text === text)
  byText('IR').props.click_func()
  check(runtime.calls.routes.length === 0, 'IR navegó sin destino')
  check(byText('home_first'), 'IR sin destino no mostró el aviso')
  byText('Casa').props.click_func()
  check(shared.destination === 'Casa', 'Casa no se guardó')
  byText('IR').props.click_func()
  check(runtime.calls.routes[0] === 'page/destination', 'IR no abrió Destino')

  runtime = createRuntime(shared, predictionApi)
  runtime.load('destination')
  byText = (text) => runtime.widgets.find((widget) => widget.props.text === text)
  check(byText('destination_distance2.4 km'), 'Destino Casa no mostró 2.4 km')
  byText('destination_change').props.click_func()
  check(runtime.calls.back === 1, 'CAMBIAR no regresó a Inicio')

  runtime = createRuntime(shared, predictionApi)
  runtime.load('destination')
  byText = (text) => runtime.widgets.find((widget) => widget.props.text === text)
  byText('destination_continue').props.click_func()
  check(runtime.calls.routes[0] === 'page/confirmation', 'SEGUIR no abrió Confirmación')

  runtime = createRuntime(shared, predictionApi)
  runtime.load('confirmation')
  byText = (text) => runtime.widgets.find((widget) => widget.props.text === text)
  const start = byText('confirmation_start')
  start.props.click_func(); start.props.click_func()
  check(runtime.calls.routes.filter((route) => route === 'page/trip').length === 1,
    'INICIAR permitió navegación duplicada')
  check(shared.tripRunId === 1 && shared.tripActive, 'INICIAR no reinició la sesión')

  runtime = createRuntime(shared, predictionApi)
  const tripPage = runtime.load('trip')
  byText = (text) => runtime.widgets.find((widget) => widget.props.text === text)
  check(!byText('trip_advance') && runtime.timers.size === 1, 'Viaje no inició automáticamente')
  const staleCallback = Array.from(runtime.timers.values())[0]
  runtime.tick()
  check(byText('state_early'), 'Casa no pasó a EARLY_ALERT')
  runtime.tick()
  check(byText('state_near'), 'Casa no pasó a NEAR')
  runtime.tick()
  check(byText('state_arrived'), 'Casa no pasó a ARRIVED')
  check(runtime.calls.haptics.join(',') === 'EARLY_ALERT,NEAR,ARRIVED',
    'Vibró más de una vez o con estados incorrectos')
  runtime.tick()
  check(runtime.timers.size === 0, 'ARRIVED no detuvo el timer')
  check(runtime.calls.haptics.length === 3, 'ARRIVED volvió a vibrar sin transición')
  byText('trip_finish').props.click_func()
  check(runtime.calls.routes.includes('page/index') && shared.tripActive === false,
    'FINALIZAR no volvió a Inicio o dejó el viaje activo')
  tripPage.onDestroy()
  const updatesAfterDestroy = runtime.widgets.reduce((sum, widget) => sum + widget.updates, 0)
  staleCallback()
  check(runtime.widgets.reduce((sum, widget) => sum + widget.updates, 0) === updatesAfterDestroy,
    'Un callback actualizó widgets después de onDestroy')
  check(runtime.calls.destroyHaptics >= 1, 'Viaje no liberó vibración')

  shared.destination = null
  runtime = createRuntime(shared, predictionApi)
  runtime.load('index')
  byText = (text) => runtime.widgets.find((widget) => widget.props.text === text)
  byText('Uni').props.click_func(); byText('IR').props.click_func()
  check(shared.destination === 'Universidad', 'Uni no guardó Universidad')
  runtime = createRuntime(shared, predictionApi)
  runtime.load('destination')
  byText = (text) => runtime.widgets.find((widget) => widget.props.text === text)
  check(byText('destination_distance4.1 km') && byText('destination_eta20 min'),
    'Universidad no mostró 4.1 km y 20 min')

  return {
    name: 'Flujo completo RideWake', assertions,
    detail: 'Inicio, Destino, Confirmación, Viaje, regreso, doble toque y ambas rutas validados'
  }
}

if (require.main === module) {
  run().then((result) => console.log(`PASS ${result.name}: ${result.assertions} aserciones`))
    .catch((error) => { console.error(error); process.exitCode = 1 })
}

module.exports = { run }
