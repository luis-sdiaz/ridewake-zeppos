const assert = require('assert').strict
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const projectRoot = path.join(__dirname, '..')
const pageNames = ['index', 'destination', 'confirmation', 'trip', 'settings', 'keyboard']

function stripImports(source) {
  return source.replace(/^import\s+[\s\S]*?\s+from\s+['"][^'"]+['"]\s*\r?\n/gm, '')
}

function loadLayout(deviceInfo) {
  const context = {
    console: { log() {} },
    hmUI: { getTextLayout() { return { width: 120, height: 32 } } }
  }
  if (deviceInfo) context.hmSetting = { getDeviceInfo() { return deviceInfo } }
  let source = fs.readFileSync(path.join(projectRoot, 'utils', 'layout.js'), 'utf8')
    .replace(/export const /g, 'const ')
    .replace(/export function /g, 'function ')
  source += '\nthis.layoutApi = { ScreenLayout, layoutValue, measureWrappedText }'
  vm.runInNewContext(source, context, { filename: 'layout.js' })
  return context.layoutApi
}

function buildPage(name, expanded) {
  let page = null
  const widgets = []
  const hmUI = {
    widget: { TEXT: 'TEXT', BUTTON: 'BUTTON', FILL_RECT: 'FILL_RECT' },
    prop: { MORE: 'MORE', TEXT: 'TEXT' },
    align: { CENTER_H: 1, CENTER_V: 2 },
    text_style: { NONE: 0, WRAP: 1 },
    createWidget(type, props) {
      const widget = {
        type,
        props: Object.assign({}, props),
        setProperty(property, value) {
          if (property === 'TEXT') this.props.text = value
          else Object.assign(this.props, value)
        }
      }
      widgets.push(widget)
      return widget
    }
  }
  const prediction = {
    destination: 'Casa', state: 'MONITORING', remainingDistance: 2.4,
    etaMinutes: 12, confidence: 55, estimatedSpeed: 12,
    referenceEs: 'Parque', referenceEn: 'Park'
  }
  const context = {
    Page(value) { page = value }, hmUI, console, Object, Math,
    getGlobalState: () => ({ tripRunId: 1, tripActive: true }),
    timer: { createTimer() { return 0 }, stopTimer() {} },
    hmApp: { gotoPage() {}, goBack() {} },
    t: (key) => key,
    getLanguage: () => 'es',
    getSelectedDestination: () => 'Casa',
    getCustomDestination: () => null,
    getTheme: () => 'dark',
    clearCustomDestination() {},
    setSelectedDestination: (value) => value,
    getRouteSummary: () => ({ initialDistance: 2.4, initialEta: 12, descriptionKey: 'route_home' }),
    startTripSession() {}, finishTripSession() {},
    createPrediction: () => Object.assign({}, prediction),
    advancePrediction: (value) => value,
    formatDistance: (value) => value + ' km',
    formatEta: (value) => value + ' min',
    vibrateForState() {}, destroyHaptics() {},
    getVibrationIntensity: () => 'normal',
    getTheme: () => 'dark',
    getActiveTheme: () => ({ bg: 0, title: 1, textPrimary: 2, textSecondary: 3, btnSecondary: 4, btnSecondaryPress: 5, btnSecondaryText: 6, accent: 7, accentPress: 8, onAccent: 9, alertNear: 10, alertEarly: 11 }),
    createPageBackground: () => null,
    updatePageBackground() {},
    isVibrationEnabled: () => true,
    setLanguage() {}, setVibrationEnabled() {}, setVibrationIntensity() {},
    layoutValue: (compactValue, expandedValue) => expanded ? expandedValue : compactValue,
    measureWrappedText: (text, size, width, minimumHeight) => minimumHeight
  }
  const source = fs.readFileSync(path.join(projectRoot, 'page', `${name}.js`), 'utf8')
  vm.runInNewContext(fs.readFileSync(path.join(projectRoot, 'utils', 'nativeTimer.js'), 'utf8')
    .replace(/export function /g, 'function '), context)
  if (name !== 'trip') assert.ok(!source.includes('FILL_RECT'), `${name}: FILL_RECT no permitido`)
  assert.ok(!source.includes('hmUI.widget.ARC'), `${name}: ARC no permitido`)
  if (name !== 'trip') assert.ok(!/\btimer\b/.test(source), `${name}: timer no permitido`)
  vm.runInNewContext(stripImports(source), context, { filename: `${name}.js` })
  page.build()
  return { page, widgets }
}

function run() {
  let assertions = 0
  const check = (condition, message) => {
    assertions += 1
    assert.ok(condition, message)
  }

  const expandedLayout = loadLayout({ width: 192, height: 490 })
  const compactLayout = loadLayout(null)
  check(expandedLayout.ScreenLayout.expanded, '490 px debe activar el layout expandido')
  check(expandedLayout.ScreenLayout.usableHeight === 490,
    'El modo expandido debe conservar la altura 490')
  check(expandedLayout.layoutValue(24, 48) === 48,
    'layoutValue no eligió la coordenada expandida')
  check(!compactLayout.ScreenLayout.expanded, 'Sin API debe usarse el fallback compacto')
  check(compactLayout.ScreenLayout.height === 349 &&
    compactLayout.ScreenLayout.usableHeight === 349,
  'El fallback debe conservar 349 px')
  check(expandedLayout.measureWrappedText('Texto largo', 14, 168, 24, 40) === 34,
    'getTextLayout no se aplicó a texto WRAP')

  for (const expanded of [false, true]) {
    const mode = expanded ? 'expandido' : 'compacto'
    const screenHeight = expanded ? 490 : 349
    const bottomLimit = expanded ? 472 : 349
    for (const name of pageNames) {
      const result = buildPage(name, expanded)
      check(result.widgets.length > 0, `${name}/${mode}: no creó widgets`)
      const buttons = []
      for (const widget of result.widgets) {
        const props = widget.props
        check(widget.type === 'TEXT' || widget.type === 'BUTTON' ||
          (name === 'trip' && widget.type === 'FILL_RECT'),
          `${name}/${mode}: widget no permitido ${widget.type}`)
        for (const key of ['x', 'y', 'w', 'h']) {
          check(Number.isInteger(props[key]), `${name}/${mode}: ${key} debe ser entero`)
        }
        check(props.x >= 0 && props.y >= 0 && props.x + props.w <= 192 &&
          props.y + props.h <= bottomLimit,
        `${name}/${mode}: widget fuera de 192×${screenHeight}`)
        if (widget.type === 'BUTTON') {
          buttons.push(widget)
          const imageButton = name === 'index' && props.normal_src
          const rectangular = (name === 'index' && props.w > 100) ||
            name === 'keyboard' || name === 'trip'
          if (imageButton) {
            check(props.w === 46 && props.h === 46 && props.radius === 23,
              `${name}/${mode}: icono de configuración no es circular`)
          } else if (!rectangular) {
            check(props.w === props.h && props.radius === props.w / 2,
              `${name}/${mode}: botón no circular`)
          } else {
            check(props.radius <= Math.min(props.w, props.h) / 2,
              `${name}/${mode}: botón rectangular sin redondeo seguro`)
          }
          check(rectangular ? props.w >= 40 && props.h >= 28 :
            props.w >= 40 && props.h >= 40,
          `${name}/${mode}: zona táctil menor de ${rectangular ? 28 : 40} px`)
          check(props.text_size >= 11,
            `${name}/${mode}: texto de botón menor de 11 px`)
          check(imageButton ? props.normal_src !== undefined && props.press_src !== undefined :
            props.normal_color !== undefined && props.press_color !== undefined,
          `${name}/${mode}: botón sin colores o imágenes`)
        }
      }
      if (name === 'keyboard') {
        const deleteAction = buttons.find((button) => button.props.text === 'keyboard_delete')
        const doneAction = buttons.find((button) => button.props.text === 'keyboard_done')
        const groupAction = buttons.find((button) => button.props.text === 'keyboard_groups')
        check(deleteAction && doneAction && groupAction,
          `${name}/${mode}: faltan acciones del teclado`)
        check(deleteAction.props.w === doneAction.props.w &&
          deleteAction.props.h === doneAction.props.h,
        `${name}/${mode}: BORRAR y LISTO no comparten dimensiones`)
        check(deleteAction.props.y === doneAction.props.y,
          `${name}/${mode}: BORRAR y LISTO no comparten fila`)
        check(doneAction.props.x - (deleteAction.props.x + deleteAction.props.w) === 12,
          `${name}/${mode}: separación entre acciones debe ser 12 px`)
        const actionCenter = (deleteAction.props.x + doneAction.props.x +
          doneAction.props.w) / 2
        check(actionCenter === 96,
          `${name}/${mode}: grupo BORRAR/LISTO no está centrado en x=96`)
        check(groupAction.props.x + groupAction.props.w / 2 === 96,
          `${name}/${mode}: GRUPOS no está centrado`)
        check(!buttons.some((button) => button.props.text === 'keyboard_cancel'),
          `${name}/${mode}: CANCELAR no debe existir`)
        const initialGeometry = {
          deleteX: deleteAction.props.x, doneX: doneAction.props.x,
          width: deleteAction.props.w, height: deleteAction.props.h,
          y: deleteAction.props.y
        }
        const firstGroup = buttons.find((button) => button.props.text === 'ABC')
        firstGroup.props.click_func()
        check(deleteAction.props.x === initialGeometry.deleteX &&
          doneAction.props.x === initialGeometry.doneX &&
          deleteAction.props.w === initialGeometry.width &&
          doneAction.props.w === initialGeometry.width &&
          deleteAction.props.h === initialGeometry.height &&
          doneAction.props.h === initialGeometry.height &&
          deleteAction.props.y === initialGeometry.y,
        `${name}/${mode}: actualización cambió la geometría de acciones`)
      }
      for (let left = 0; left < result.widgets.length; left += 1) {
        for (let right = left + 1; right < result.widgets.length; right += 1) {
          const a = result.widgets[left].props
          const b = result.widgets[right].props
          const overlaps = a.x < b.x + b.w && a.x + a.w > b.x &&
            a.y < b.y + b.h && a.y + a.h > b.y
          check(!overlaps, `${name}/${mode}: widgets ${left} y ${right} se superponen`)
        }
      }
      if (expanded) {
        check(Math.max(...buttons.map((button) => button.props.y)) >= 384,
          `${name}: ninguna acción aprovecha la zona baja expandida`)
        check(Math.max(...buttons.map((button) => button.props.y + button.props.h)) <= 472,
          `${name}: botón invade el margen inferior expandido`)
      }
      if (typeof result.page.onDestroy === 'function') result.page.onDestroy()
    }
  }
  return {
    name: 'Layouts físicos 192×349 y 192×490',
    assertions,
    detail: 'Selección de altura, WRAP, solapamientos, márgenes y acciones inferiores validados'
  }
}

if (require.main === module) {
  try { const result = run(); console.log(`PASS ${result.name}: ${result.assertions} aserciones`) }
  catch (error) { console.error(error); process.exitCode = 1 }
}

module.exports = { run }
