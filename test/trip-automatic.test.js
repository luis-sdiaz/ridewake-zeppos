const assert = require('assert').strict
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const root = path.join(__dirname, '..')

// Run the actual page, session, translations, palette, predictor and haptics together.
function harness(options = {}) {
  const state = Object.assign({ selectedDestination: 'Casa', language: 'es', theme: 'dark',
    vibrationEnabled: true, vibrationIntensity: 'normal', tripRunId: 1, tripActive: true }, options)
  const widgets = []
  const timers = new Map()
  const scenes = []
  const routes = []
  const logs = []
  const sensorEvents = []
  const stoppedHandles = []
  let now = 0
  let timerCount = 0
  let sensorCount = 0
  let stops = 0
  let updates = 0
  let page
  let destroyed = false
  const context = vm.createContext({
    console: { log(message) { logs.push(message) } },
    getApp: () => ({ _options: { globalData: state } }),
    Page(value) { page = value },
    hmSetting: { getDeviceInfo: () => ({ width: 192, height: options.height || 490 }) },
    hmApp: {
      gotoPage(value) { routes.push(value.url) }
    },
    hmSensor: {
      id: { VIBRATE: 1 },
      createSensor() {
        sensorCount += 1
        let ready = false
        return { scene: null,
          start() {
            assert.ok(ready, 'VIBRATE requires stop after previous start')
            ready = false
            scenes.push(this.scene)
            sensorEvents.push('start:' + this.scene)
          },
          stop() { ready = true; stops += 1; sensorEvents.push('stop') }
        }
      }
    },
    timer: {
      createTimer(delay, repeat, callback) {
        assert.equal(this, context.timer, 'Native API lost its receiver')
        const index = timerCount++
        // Opaque handle must be passed back by identity, with no coercion.
        const id = options.opaqueHandle ? Object.freeze(Object.create(null)) : index
        timers.set(id, { next: now + delay, repeat, callback })
        return id
      },
      stopTimer(id) {
        assert.equal(this, context.timer, 'Native stop lost its receiver')
        assert.ok(timers.has(id), 'Unknown/changed native handle or duplicate cancellation')
        stoppedHandles.push(id)
        timers.delete(id)
      }
    },
    hmUI: {
      widget: { TEXT: 'TEXT', BUTTON: 'BUTTON', FILL_RECT: 'FILL_RECT' },
      prop: { MORE: 'MORE', TEXT: 'TEXT' },
      align: { CENTER_H: 1, CENTER_V: 2 },
      text_style: { NONE: 0, WRAP: 1 },
      createWidget(type, props) {
        const widget = { type, props: Object.assign({}, props),
          setProperty(property, value) {
            assert.ok(!destroyed, 'Update after page destruction')
            if (type === 'FILL_RECT') {
              for (const key of ['x', 'y', 'w', 'h']) assert.ok(Number.isInteger(value[key]))
            }
            updates += 1
            Object.assign(this.props, property === 'TEXT' ? { text: value } : value)
          }
        }
        widgets.push(widget)
        return widget
      }
    }
  })
  const cache = {}
  function load(filename) {
    filename = path.resolve(filename)
    if (cache[filename]) return cache[filename]
    const exported = []
    let source = fs.readFileSync(filename, 'utf8')
      .replace(/^import\s+\{([\s\S]*?)\}\s+from\s+['"]([^'"]+)['"]\s*$/gm,
        (_, names, module) => `const { ${names.replace(/\bas\b/g, ':')} } = require(${JSON.stringify(module)})`)
      .replace(/export (function|const) (\w+)/g, (_, kind, name) => {
        exported.push(name); return `${kind} ${name}`
      })
      .replace(/export \{([^}]+)\}/g, (_, names) => { exported.push(...names.split(',').map(x => x.trim())); return '' })
    source += `\nreturn { ${exported.join(',')} }`
    const factory = vm.runInContext(`(function(require) { ${source}\n})`, context, { filename })
    cache[filename] = factory((module) => load(path.resolve(path.dirname(filename), module + '.js')))
    return cache[filename]
  }
  load(path.join(root, 'page/trip.js'))
  return {
    state, context, widgets, timers, scenes, routes, logs, sensorEvents, stoppedHandles,
    build() { destroyed = false; page.build() },
    destroy() { page.onDestroy(); destroyed = true },
    get page() { return page },
    get updates() { return updates },
    get sensorCount() { return sensorCount },
    get stops() { return stops },
    get timerCount() { return timerCount },
    module(name) { return load(path.join(root, 'utils', name + '.js')) },
    text(text) { return widgets.find(widget => widget.props.text === text) },
    finish() { widgets.find(widget => widget.type === 'BUTTON').props.click_func() },
    advance(ms) {
      const target = now + ms
      for (;;) {
        const pending = Array.from(timers.values()).filter(entry => entry.next <= target)
          .sort((a, b) => a.next - b.next)[0]
        if (!pending) break
        now = pending.next
        pending.next += pending.repeat
        pending.callback()
      }
      now = target
    }
  }
}

function run() {
  let assertions = 0
  const check = (condition, message) => { assertions += 1; assert.ok(condition, message) }
  const stateKeys = { MONITORING: 'state_monitoring', EARLY_ALERT: 'state_early',
    NEAR: 'state_near', ARRIVED: 'state_arrived' }

  for (const destination of ['Casa', 'Universidad']) {
    for (const language of ['es', 'en']) for (const theme of ['dark', 'light']) {
      for (const height of [349, 490]) for (const enabled of [false, true]) {
        const h = harness({ selectedDestination: destination, language, theme, height, vibrationEnabled: enabled })
        const label = `${destination}/${language}/${theme}/${height}/${enabled}`
        const t = h.module('i18n').t
        const palette = h.module('theme').getActiveTheme()
        const api = h.module('prediction')
        const prediction = api.createPrediction(destination)
        const beforeSettings = [h.state.language, h.state.theme, h.state.vibrationEnabled, h.state.vibrationIntensity]
        h.build()
        const count = h.widgets.length
        const callback = Array.from(h.timers.values())[0].callback
        h.page.build()
        check(h.timers.size === 1 && h.timerCount === 1 && h.widgets.length === count, `${label}: duplicate build`)
        check(h.text(t('trip_local_data')), `${label}: simulation label missing`)
        check(!h.text(t('trip_paused')), `${label}: false timer failure`)
        check(h.scenes.length === 0 && h.text(t('state_monitoring')), `${label}: bad initial state`)
        check(h.widgets.filter(w => w.type === 'BUTTON').length === 1 && !h.text(t('trip_advance')), `${label}: actions`)
        h.advance(9999)
        check(h.text(t('state_monitoring')) && h.scenes.length === 0, `${label}: advanced too soon`)
        const expectedStates = destination === 'Casa'
          ? ['MONITORING', 'EARLY_ALERT', 'NEAR', 'ARRIVED']
          : ['MONITORING', 'MONITORING', 'EARLY_ALERT', 'NEAR', 'ARRIVED']
        for (let step = 0; step < expectedStates.length; step += 1) {
          if (step > 0) {
            h.advance(step === 1 ? 1 : 10000)
            api.advancePrediction(prediction)
          }
          check(h.text(t(stateKeys[expectedStates[step]])), `${label}: wrong stage ${step}`)
          const distance = api.formatDistance(prediction.remainingDistance)
          check(h.text(language === 'es' ? distance.replace('.', ',') : distance), `${label}: wrong distance`)
          check(h.text(t('trip_eta') + api.formatEta(prediction.etaMinutes)), `${label}: ETA disconnected from ML`)
          check(h.text(language === 'es' ? prediction.referenceEs : prediction.referenceEn), `${label}: reference`)
          check(h.widgets.length === count, `${label}: recreates widgets`)
          const dots = h.widgets.filter(w => w.type === 'FILL_RECT' && w.props.radius)
          const stage = ['MONITORING', 'EARLY_ALERT', 'NEAR', 'ARRIVED'].indexOf(prediction.state)
          check(dots.length === 4 && dots[stage].props.w === 16 &&
            dots.filter(w => w.props.w === 16).length === 1, `${label}: active milestone`)
          check(dots.every((w, i) => i >= stage || w.props.color === palette.accent), `${label}: completed milestones`)
          const visible = h.widgets.slice(1) // Exclude intentional full-screen background.
          check(h.widgets[0].props.color === palette.bg, `${label}: background theme`)
          for (let i = 0; i < visible.length; i += 1) {
            const a = visible[i].props
            check(a.x >= 12 && a.x + a.w <= 180 && a.y >= 20 && a.y + a.h <= height - 15,
              `${label}: safe bounds`)
            if (visible[i].type === 'TEXT') {
              check(a.color !== palette.bg, `${label}: invisible text`)
              // Conservative Latin font estimate, not a substitute for the physical font renderer.
              const lines = String(a.text).split('\n')
              check(lines.every(line => line.length * a.text_size * 0.61 <= a.w || a.text_style === 1),
                `${label}: likely horizontal clipping: ${a.text}`)
              const lineCount = lines.reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length * a.text_size * 0.61 / a.w)), 0)
              check(lineCount * a.text_size * 1.15 <= a.h, `${label}: likely vertical clipping: ${a.text}`)
            }
            for (let j = i + 1; j < visible.length; j += 1) {
              const b = visible[j].props
              check(!(a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y),
                `${label}: overlap ${i}/${j}`)
            }
          }
        }
        check(h.scenes.join(',') === (enabled ? '23,25,9' : ''), `${label}: haptic sequence`)
        check(h.sensorCount === (enabled ? 1 : 0), `${label}: sensor instances`)
        check(h.timers.size === 0, `${label}: arrival timer leaked`)
        const updates = h.updates
        h.advance(60000); callback(); h.page.build()
        check(h.updates === updates && h.scenes.length === (enabled ? 3 : 0), `${label}: repeated arrival`)
        check(h.routes.length === 0, `${label}: accidental navigation`)
        check(beforeSettings.join() === [h.state.language, h.state.theme, h.state.vibrationEnabled, h.state.vibrationIntensity].join(),
          `${label}: changed preferences`)
        h.finish(); h.finish()
        check(h.routes.join() === 'page/index' && !h.state.tripActive, `${label}: finish double tap`)
        h.destroy(); callback()
        check(h.updates === updates && h.timers.size === 0, `${label}: work after destruction`)
      }
    }
  }

  for (const exit of ['finish', 'destroy']) for (const elapsed of [0, 10000, 20000]) {
    const h = harness()
    h.build(); h.advance(elapsed)
    const callback = Array.from(h.timers.values())[0].callback
    const updates = h.updates
    const scenes = h.scenes.length
    h[exit]()
    check(h.timers.size === 0 && !h.state.tripActive, `${exit}: active resources`)
    callback(); h.advance(60000)
    check(h.updates === updates && h.scenes.length === scenes, `${exit}: late work`)
    check(scenes === 0 || h.stops > scenes, `${exit}: vibrator not stopped`)
    if (exit === 'finish') h.destroy()
    h.state.selectedDestination = 'Universidad'
    h.build()
    const rebuiltUpdates = h.updates
    callback()
    check(h.updates === rebuiltUpdates && h.timers.size === 1, 'Old callback affected new trip')
    h.advance(40000)
    check(h.scenes.slice(scenes).join() === '23,25,9' && h.timers.size === 0, 'New trip did not reset alerts')
    h.destroy()
  }

  const strong = harness({ vibrationIntensity: 'strong' })
  strong.build(); strong.advance(30000)
  check(strong.scenes.join() === '24,25,9', 'Strong setting must retain three distinct scenes')
  strong.destroy()

  const muted = harness()
  muted.build(); muted.advance(10000)
  muted.state.vibrationEnabled = false
  muted.advance(20000)
  check(muted.scenes.join() === '23', 'Did not honor disabled vibration at transition')
  muted.destroy()

  const superseded = harness()
  superseded.build(); superseded.state.tripRunId += 1
  superseded.advance(10000)
  check(superseded.timers.size === 0 && superseded.scenes.length === 0, 'Superseded trip advanced')
  superseded.destroy()
  check(superseded.state.tripActive, 'Old page ended newer session')

  const failedNavigation = harness()
  failedNavigation.build()
  failedNavigation.context.hmApp.gotoPage = () => { throw new Error('Navigation failed') }
  failedNavigation.finish(); failedNavigation.advance(30000)
  check(failedNavigation.timers.size === 0 && failedNavigation.scenes.length === 0, 'Failed navigation restarted trip')
  failedNavigation.context.hmApp.gotoPage = value => failedNavigation.routes.push(value.url)
  failedNavigation.finish()
  check(failedNavigation.routes.join() === 'page/index', 'Cannot retry finish navigation')
  failedNavigation.destroy()

  for (const opaqueHandle of [false, true]) for (const destination of ['Casa', 'Universidad']) {
    const h = harness({ opaqueHandle, selectedDestination: destination })
    check(vm.runInContext('typeof setInterval === "undefined" && typeof setTimeout === "undefined"', h.context),
      'Zepp OS 1.0 regression must not inject standard timers')
    h.build()
    check(h.timerCount === 1 && h.timers.size === 1, 'Native timer was rejected after creation')
    const handle = Array.from(h.timers.keys())[0]
    const pending = h.timers.get(handle)
    check(pending.next === 10000 && pending.repeat === 10000, 'Native interval is not 10000 ms')
    check(!h.text(h.module('i18n').t('trip_paused')), 'Working native timer reported unavailable')
    const expected = destination === 'Casa' ? [1, 2, 3] : [0, 1, 2, 3]
    for (const stage of expected) {
      h.advance(10000)
      const dots = h.widgets.filter(w => w.type === 'FILL_RECT' && w.props.radius)
      check(dots[stage].props.w === 16, 'Native callback did not update active dot')
    }
    check(h.scenes.join() === '23,25,9' && h.sensorCount === 1, 'Native timer missed haptics')
    check(h.sensorEvents.join() === 'stop,start:23,stop,start:25,stop,start:9',
      'Vibration must stop after each previous start before starting the next scene')
    check(h.stoppedHandles.length === 1 && h.stoppedHandles[0] === handle, 'Handle identity changed on cancel')
    const count = h.updates
    h.destroy(); pending.callback()
    check(h.sensorEvents[h.sensorEvents.length - 1] === 'stop', 'Final vibration did not stop on exit')
    check(h.updates === count && h.timers.size === 0, 'Late native callback updated destroyed widgets')
    check(h.logs.some(line => line.includes('handleType=' + (opaqueHandle ? 'object' : 'number'))),
      'Missing handle-type diagnostic')
    check(h.logs.some(line => line.includes('state=ARRIVED')), 'Missing actual callback diagnostic')
  }

  for (const exit of ['finish', 'destroy']) {
    const h = harness({ opaqueHandle: true })
    h.build(); h.advance(10000)
    const handle = Array.from(h.timers.keys())[0]
    const callback = h.timers.get(handle).callback
    const updates = h.updates
    h[exit](); callback(); h.advance(40000)
    check(h.updates === updates && h.scenes.join() === '23' && h.timers.size === 0,
      `Opaque handle: ${exit} left work active`)
    check(h.stoppedHandles[0] === handle, `Opaque handle: ${exit} lost handle identity`)
    if (exit === 'finish') h.destroy()
    h.build()
    const rebuiltUpdates = h.updates
    callback()
    check(h.updates === rebuiltUpdates && h.timers.size === 1, 'Opaque old callback affected new trip')
    h.destroy()
  }

  const stopFailure = harness({ opaqueHandle: true })
  stopFailure.build()
  const stopApi = stopFailure.context.timer.stopTimer
  stopFailure.context.timer.stopTimer = () => { throw new Error('Native stop failed') }
  stopFailure.finish()
  const stoppedUpdates = stopFailure.updates
  stopFailure.advance(40000)
  check(stopFailure.updates === stoppedUpdates && stopFailure.scenes.length === 0,
    'Native stop exception must invalidate callbacks')
  check(stopFailure.logs.some(line => line.includes('T04') && line.includes('Native stop failed')),
    'Native stop exception was hidden')
  stopFailure.context.timer.stopTimer = stopApi
  stopFailure.destroy()
  check(stopFailure.timers.size === 0, 'Destroy did not retry failed native cancellation')

  for (const failure of ['missing', 'missing-stop', 'throw', 'undefined', 'null', 'false', 'NaN']) {
    const h = harness()
    if (failure === 'missing') delete h.context.timer
    else if (failure === 'missing-stop') delete h.context.timer.stopTimer
    else h.context.timer.createTimer = () => {
      if (failure === 'throw') throw new Error('Native allocation failed')
      if (failure === 'null') return null
      if (failure === 'false') return false
      if (failure === 'NaN') return NaN
    }
    h.build()
    const t = h.module('i18n').t
    const code = failure.indexOf('missing') === 0 ? 'T01' : failure === 'throw' ? 'T02' : 'T03'
    check(h.text(t('trip_paused')) && h.text(t('trip_timer_error') + code) && h.timers.size === 0,
      `Timer ${failure}: did not show honest fallback`)
    check(h.logs.some(line => line.includes(code)), `Timer ${failure}: reason not logged`)
    if (failure === 'throw') check(h.logs.some(line => line.includes('Native allocation failed')), 'Exception detail lost')
    const updates = h.updates
    h.advance(40000)
    check(h.updates === updates && h.scenes.length === 0, `Timer ${failure}: fake progress`)
    h.finish(); h.destroy()
    check(h.routes.join() === 'page/index', `Timer ${failure}: finish inaccessible`)
  }
  return { name: 'Simulación automática integrada', assertions,
    detail: '32 combinaciones, sin timers estándar, handles opacos, fallos nativos, ML, alertas y limpieza' }
}

module.exports = { run }
