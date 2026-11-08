const assert = require('assert').strict
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const settingsPath = path.join(__dirname, '..', 'page', 'settings.js')

function stripImports(source) {
  return source.replace(/^import\s+[\s\S]*?\s+from\s+['"][^'"]+['"]\s*\r?\n/gm, '')
}

function createHarness(options = {}) {
  const state = Object.assign({ language: 'es', enabled: true, intensity: 'normal', theme: 'dark' }, options)
  const calls = { back: 0 }
  const widgets = []
  let page
  const hmUI = {
    widget: { TEXT: 'TEXT', BUTTON: 'BUTTON', FILL_RECT: 'FILL_RECT' }, prop: { MORE: 'MORE', TEXT: 'TEXT' },
    align: { CENTER_H: 1, CENTER_V: 2 }, text_style: { NONE: 0 },
    createWidget(type, props) {
      const widget = { type, props: Object.assign({}, props), setProperty(property, value) {
        if (property === 'TEXT') this.props.text = value
        else Object.assign(this.props, value)
      } }
      widgets.push(widget); return widget
    }
  }
  const context = {
    Page(value) { page = value }, hmUI, Object, console,
    hmApp: { goBack() { calls.back += 1 } },
    getLanguage: () => state.language,
    setLanguage: (value) => { state.language = value },
    isVibrationEnabled: () => state.enabled,
    setVibrationEnabled: (value) => { state.enabled = value },
    getVibrationIntensity: () => state.intensity,
    setVibrationIntensity: (value) => { state.intensity = value },
    getTheme: () => state.theme,
    setTheme: (value) => { state.theme = value },
    getSessionTheme: () => state.theme,
    ScreenLayout: { width: 192, usableHeight: options.height || 490 },
    layoutValue: (compactValue, expandedValue) => options.height === 349 ? compactValue : expandedValue
  }
  // Real palettes and translations: placeholders hid contrast and long-text issues.
  for (const [name, exports] of [
    ['theme', 'getActiveTheme, createPageBackground, updatePageBackground'], ['i18n', 't']
  ]) {
    const source = stripImports(fs.readFileSync(path.join(__dirname, '..', 'utils', name + '.js'), 'utf8'))
      .replace(/export function /g, 'function ').replace(/export \{[^}]*\}/g, '')
    Object.assign(context, vm.runInNewContext('(function () {' + source + '\nreturn {' + exports + '} })()', context))
  }
  vm.runInNewContext(stripImports(fs.readFileSync(settingsPath, 'utf8')), context)
  return { state, calls, widgets, context, getPage: () => page }
}

function run() {
  let assertions = 0
  const check = (condition, message) => { assertions += 1; assert.ok(condition, message) }
  const harness = createHarness()
  const page = harness.getPage()
  page.build()
  const byText = (text) => harness.widgets.find((widget) => widget.props.text === text)
  check(!byText('Normal') && !byText('Strong') && !byText('Fuerte') &&
    !byText('Intensidad') && !byText('Intensity'),
  'La sección Intensidad no debe mostrarse')

  byText('EN').props.click_func()
  check(harness.state.language === 'en', 'EN no cambió el idioma')
  check(Boolean(byText('SETTINGS') && byText('Language')), 'La interfaz no cambió a inglés')
  byText('OFF').props.click_func()
  check(harness.state.enabled === false, 'OFF no desactivó vibración')
  check(Boolean(byText('Vibration disabled')), 'No mostró vibración desactivada')
  byText('Light').props.click_func()
  check(harness.state.theme === 'light' && byText('Light').props.color === harness.context.getActiveTheme().onAccent,
    'Light no seleccionó o resaltó el tema claro')
  byText('Dark').props.click_func()
  check(harness.state.theme === 'dark' && byText('Dark').props.color === harness.context.getActiveTheme().onAccent,
    'Dark no seleccionó o resaltó el tema oscuro')
  byText('ES').props.click_func()
  check(harness.state.language === 'es' && harness.state.enabled === false &&
    harness.state.intensity === 'normal', 'El idioma reinició preferencias')
  byText('VOLVER').props.click_func()
  check(harness.calls.back === 1, 'VOLVER no llamó goBack')
  page.onDestroy()
  check(harness.state.enabled === false, 'onDestroy alteró preferencias')

  function luminance(color) {
    const channels = [color >> 16 & 255, color >> 8 & 255, color & 255].map(value => {
      const channel = value / 255
      return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4)
    })
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
  }
  function contrast(a, b) {
    const x = luminance(a), y = luminance(b)
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
  }
  for (const height of [349, 490]) for (const language of ['es', 'en']) {
    for (const theme of ['dark', 'light']) for (const enabled of [false, true]) {
      const h = createHarness({ height, language, theme, enabled })
      h.getPage().build()
      const count = h.widgets.length
      const geometry = () => JSON.stringify(h.widgets.map(w => [w.props.x, w.props.y, w.props.w, w.props.h]))
      const originalGeometry = geometry()
      const find = text => h.widgets.find(w => w.props.text === text)
      function validate() {
        const t = h.context.t, palette = h.context.getActiveTheme()
        const labels = ['settings_language', 'settings_vibration', 'settings_appearance'].map(key => find(t(key)).props)
        const pairs = [['ES', 'EN'], [t('settings_on'), t('settings_off')], [t('settings_light'), t('settings_dark')]]
        const selections = [h.state.language === 'es', h.state.enabled, h.state.theme === 'light']
        check(h.widgets.length === count && geometry() === originalGeometry, 'Actualizar Ajustes movió o recreó widgets')
        check(h.widgets[0].props.color === palette.bg, 'El fondo no cambió inmediatamente')
        pairs.forEach((pair, index) => {
          const a = find(pair[0]).props, b = find(pair[1]).props, label = labels[index]
          const gap = a.y - label.y - label.h
          check(gap >= (height === 349 ? 6 : 10), 'Etiqueta demasiado próxima al botón')
          check(a.y === b.y && a.w === b.w && a.h === b.h && a.w >= 42 && a.h >= 42,
            'Botones asimétricos o área táctil insuficiente')
          check(b.x - a.x - a.w >= 12 && (a.x + b.x + b.w) / 2 === 96, 'Par descentrado o poco separado')
          check(a.normal_color === (selections[index] ? palette.accent : palette.btnSecondary) &&
            b.normal_color === (selections[index] ? palette.btnSecondary : palette.accent), 'Selección incorrecta')
          check(label.text_size === labels[0].text_size && label.color === palette.textPrimary,
            'Etiquetas sin tratamiento uniforme')
          if (index < 2) check(labels[index + 1].y - a.y - a.h > gap, 'Grupos demasiado próximos')
        })
        const summary = find(t(h.state.enabled ? 'settings_summary_on' : 'settings_summary_off')).props
        const about = find(t('settings_about')).props, back = find(t('settings_back')).props
        check(about.y >= summary.y + summary.h + 4 && about.text_size <= summary.text_size &&
          about.color === palette.textSecondary, 'Jerarquía del pie incorrecta')
        check(back.x + back.w / 2 === 96 && back.w >= 100 && back.h >= 40 &&
          back.y >= about.y + about.h + 8 && back.y + back.h <= height - 7, 'VOLVER sin margen o mal centrado')
        const visible = h.widgets.slice(1)
        visible.forEach((widget, i) => {
          const a = widget.props
          check(a.x >= 12 && a.x + a.w <= 180 && a.y >= 14 && a.y + a.h <= height - 7, 'Fuera de márgenes seguros')
          check(a.text_size >= 11 && a.h >= a.text_size * 1.15 &&
            a.text.length * a.text_size * 0.61 <= a.w, 'Posible recorte de texto: ' + a.text)
          check(contrast(a.color, widget.type === 'BUTTON' ? a.normal_color : palette.bg) >= 4.5,
            'Contraste insuficiente: ' + a.text)
          visible.slice(i + 1).forEach(other => {
            const b = other.props
            check(!(a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y), 'Solapamiento')
          })
        })
      }
      validate()
      for (const action of ['settings_light', 'settings_dark', 'settings_off', 'settings_on', 'EN', 'ES']) {
        find(action === 'EN' || action === 'ES' ? action : h.context.t(action)).props.click_func()
        validate()
      }
      find(h.context.t('settings_back')).props.click_func()
      check(h.calls.back === 1 && h.state.intensity === 'normal', 'Regreso o preferencias alteradas')
      h.getPage().onDestroy()
    }
  }

  return {
    name: 'Ajustes de sesión', assertions,
    detail: '16 combinaciones: separaciones, geometría tras cambios, traducciones reales, contraste y regreso'
  }
}

if (require.main === module) {
  try { const result = run(); console.log(`PASS ${result.name}: ${result.assertions} aserciones`) }
  catch (error) { console.error(error); process.exitCode = 1 }
}

module.exports = { run }
