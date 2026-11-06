const assert = require('assert').strict
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const projectRoot = path.resolve(__dirname, '..')
const tripPath = path.join(projectRoot, 'page', 'trip.js')

function stripImports(source) {
  return source.replace(/^import\s+[\s\S]*?\s+from\s+['"][^'"]+['"]\s*\r?\n/gm, '')
}

function createHarness() {
  const routeSteps = [
    { stop: 'Parque Bolívar', distance: '3.2 km', eta: '12 min', progress: 0.10, state: 'MONITORING' },
    { stop: 'Av. Las Américas', distance: '1.5 km', eta: '5 min', progress: 0.50, state: 'EARLY_ALERT' },
    { stop: 'Calle 18 (Cerca)', distance: '0.3 km', eta: '1 min', progress: 0.90, state: 'NEAR' },
    { stop: 'Destino Casa', distance: '0.0 km', eta: '¡Ahora!', progress: 1.0, state: 'ARRIVED' }
  ]
  const theme = {
    bg: 1, cardBg: 2, btnSecondary: 3, textPrimary: 4, textSecondary: 5,
    accent: 6, success: 7, warning: 8, danger: 9, onAccent: 10, divider: 11
  }
  const translations = {
    trip_status_monitoring: 'En camino',
    trip_status_early: 'Aviso temprano',
    trip_status_near: 'Cerca de tu parada',
    trip_status_arrived: '¡Llegaste a tu parada!',
    trip_now: '¡Ahora!',
    trip_title: 'VIAJE EN CURSO',
    dest_home: 'Casa',
    trip_next_stop: 'PRÓXIMA PARADA',
    trip_distance_remaining: 'DISTANCIA RESTANTE',
    trip_eta_remaining: 'LLEGADA ESTIMADA',
    trip_btn_finish: 'Finalizar viaje'
  }
  const calls = {
    timersCreated: [],
    timersStopped: [],
    short: 0,
    warning: 0,
    stopVibration: 0,
    destroyHaptics: 0,
    clearSession: 0,
    brightScreen: 0,
    routes: []
  }
  const widgets = []
  let page = null
  let nextTimerId = 1

  const hmUI = {
    widget: { FILL_RECT: 'FILL_RECT', TEXT: 'TEXT', BUTTON: 'BUTTON' },
    prop: { MORE: 'MORE', TEXT: 'TEXT' },
    align: { CENTER_H: 'CENTER_H', CENTER_V: 'CENTER_V' },
    text_style: { WRAP: 'WRAP' },
    createWidget(type, options) {
      const widget = {
        type,
        props: { ...options },
        setProperty(property, value) {
          if (property === hmUI.prop.TEXT) this.props.text = value
          else Object.assign(this.props, value)
        }
      }
      widgets.push(widget)
      return widget
    }
  }

  const timer = {
    createTimer(delay, period, callback, options) {
      const record = { id: nextTimerId, delay, period, callback, options }
      nextTimerId += 1
      calls.timersCreated.push(record)
      return record.id
    },
    stopTimer(timerId) { calls.timersStopped.push(timerId) }
  }

  const context = {
    Page(definition) { page = definition },
    hmUI,
    timer,
    hmApp: { gotoPage(options) { calls.routes.push(options.url) } },
    hmSetting: { setBrightScreen() { calls.brightScreen += 1 } },
    Layout: {
      width: 192,
      height: 490,
      contentWidth: 152,
      leftMargin: 20,
      innerWidth: 136,
      innerMargin: 28,
      cardRadius: 20,
      y: (value) => value,
      h: (value) => value
    },
    Type: { brand: 18, body: 14, button: 16 },
    getTheme: () => theme,
    getThemeMode: () => 'light',
    t: (key) => translations[key] || key,
    getRouteSteps: () => routeSteps.map((step) => ({ ...step })),
    getSelectedDestination: () => 'home',
    clearSession: () => { calls.clearSession += 1 },
    initHaptics() {},
    stopVibration() { calls.stopVibration += 1 },
    destroyHaptics() { calls.destroyHaptics += 1 },
    vibrateShort() { calls.short += 1 },
    vibrateWarning() { calls.warning += 1 },
    console,
    Math
  }

  vm.runInNewContext(stripImports(fs.readFileSync(tripPath, 'utf8')), context, {
    filename: tripPath
  })

  return { calls, widgets, theme, getPage: () => page }
}

function run() {
  let assertions = 0
  const check = (condition, message) => {
    assertions += 1
    assert.ok(condition, message)
  }

  const harness = createHarness()
  const page = harness.getPage()
  check(page && typeof page.build === 'function', 'La página Viaje no registró build()')
  page.build()

  check(harness.calls.timersCreated.length === 1, 'Viaje debe crear un solo temporizador')
  const tripTimer = harness.calls.timersCreated[0]
  check(tripTimer.delay === 4000 && tripTimer.period === 4000,
    'El temporizador del viaje debe conservar el intervalo de 4 segundos')

  const byText = (text) => harness.widgets.find((widget) => widget.props.text === text)
  const status = byText('En camino')
  const distance = byText('3.2 km')
  const eta = byText('12 min')
  const finish = byText('Finalizar viaje')
  const progress = harness.widgets.find((widget) =>
    widget.type === 'FILL_RECT' && widget.props.y === 207 && widget.props.color === harness.theme.success)

  for (const [name, widget] of Object.entries({ status, distance, eta, finish, progress })) {
    check(Boolean(widget), `No se encontró el widget de viaje ${name}`)
  }

  tripTimer.callback()
  check(status.props.text === 'Aviso temprano', 'EARLY_ALERT no actualizó el estado')
  check(distance.props.text === '1.5 km' && eta.props.text === '5 min',
    'EARLY_ALERT no actualizó distancia y ETA')
  check(harness.calls.short === 1 && harness.calls.warning === 0,
    'EARLY_ALERT no emitió la vibración corta esperada')

  tripTimer.callback()
  check(status.props.text === 'Cerca de tu parada', 'NEAR no actualizó el estado')
  check(distance.props.text === '0.3 km' && eta.props.text === '1 min',
    'NEAR no actualizó distancia y ETA')
  check(harness.calls.warning === 1 && harness.calls.brightScreen === 1,
    'NEAR no activó alerta y brillo temporal')

  tripTimer.callback()
  check(status.props.text === '¡Llegaste a tu parada!', 'ARRIVED no actualizó el estado')
  check(distance.props.text === '0.0 km' && eta.props.text === '¡Ahora!',
    'ARRIVED no actualizó distancia y ETA')
  check(progress.props.w === 152, 'ARRIVED no completó el progreso visual')
  check(harness.calls.warning === 2 && harness.calls.brightScreen === 2,
    'ARRIVED no activó la alerta final')
  check(harness.calls.timersStopped.includes(tripTimer.id),
    'ARRIVED no detuvo el temporizador')
  check(finish.props.normal_color === harness.theme.danger &&
    finish.props.color === harness.theme.onAccent,
  'ARRIVED no actualizó el botón Finalizar')

  finish.props.click_func()
  check(harness.calls.routes.includes('page/index'), 'Finalizar no navegó a Inicio')
  check(harness.calls.clearSession === 1, 'Finalizar no limpió el destino de sesión')
  page.onDestroy()
  check(harness.calls.stopVibration === 1 && harness.calls.destroyHaptics === 1,
    'Viaje no liberó vibración y hápticos al cerrarse')

  const abandoned = createHarness()
  const abandonedPage = abandoned.getPage()
  abandonedPage.build()
  const abandonedTimer = abandoned.calls.timersCreated[0]
  abandonedPage.onDestroy()
  check(abandoned.calls.timersStopped.includes(abandonedTimer.id),
    'Abandonar Viaje no detuvo su temporizador')
  check(abandoned.calls.clearSession === 1,
    'Abandonar un viaje incompleto no limpió el destino')
  check(abandoned.calls.stopVibration === 1 && abandoned.calls.destroyHaptics === 1,
    'Abandonar Viaje no liberó los recursos hápticos')

  return {
    name: 'Comportamiento del viaje',
    assertions,
    detail: 'Cuatro etapas, UI, navegación y limpieza verificadas con runtime simulado'
  }
}

if (require.main === module) {
  try {
    const result = run()
    console.log(`PASS ${result.name}: ${result.assertions} aserciones`)
  } catch (error) {
    console.error(`FAIL Comportamiento del viaje: ${error.stack || error.message}`)
    process.exitCode = 1
  }
}

module.exports = { run }
