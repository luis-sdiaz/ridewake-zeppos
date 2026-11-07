const assert = require('assert').strict
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const settingsPath = path.join(__dirname, '..', 'page', 'settings.js')

function stripImports(source) {
  return source.replace(/^import\s+[\s\S]*?\s+from\s+['"][^'"]+['"]\s*\r?\n/gm, '')
}

function createHarness() {
  const state = { language: 'es', enabled: true, intensity: 'normal', theme: 'dark' }
  const calls = { back: 0 }
  const widgets = []
  let page
  const dictionaries = {
    es: { settings_title: 'AJUSTES', settings_language: 'Idioma', settings_vibration: 'Vibración', settings_appearance: 'Apariencia', settings_light: 'Claro', settings_dark: 'Oscuro', settings_on: 'SÍ', settings_off: 'NO', settings_about: 'Acerca', settings_back: 'VOLVER', settings_summary_on: 'Vibración activa', settings_summary_off: 'Vibración desactivada' },
    en: { settings_title: 'SETTINGS', settings_language: 'Language', settings_vibration: 'Vibration', settings_appearance: 'Appearance', settings_light: 'Light', settings_dark: 'Dark', settings_on: 'ON', settings_off: 'OFF', settings_about: 'About', settings_back: 'BACK', settings_summary_on: 'Vibration enabled', settings_summary_off: 'Vibration disabled' }
  }
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
    t: (key) => dictionaries[state.language][key] || key,
    getLanguage: () => state.language,
    setLanguage: (value) => { state.language = value },
    isVibrationEnabled: () => state.enabled,
    setVibrationEnabled: (value) => { state.enabled = value },
    getVibrationIntensity: () => state.intensity,
    setVibrationIntensity: (value) => { state.intensity = value },
    getTheme: () => state.theme,
    setTheme: (value) => { state.theme = value },
    getActiveTheme: () => ({ bg: 0, title: 1, textPrimary: 2, textSecondary: 3, btnSecondary: 4, btnSecondaryPress: 5, btnSecondaryText: 6, accent: 7, accentPress: 8, onAccent: 9 }),
    createPageBackground: () => null,
    updatePageBackground() {},
    layoutValue: (compactValue, expandedValue) => expandedValue
  }
  vm.runInNewContext(stripImports(fs.readFileSync(settingsPath, 'utf8')), context)
  return { state, calls, widgets, getPage: () => page }
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
  check(harness.state.theme === 'light' && byText('Light').props.color === 9,
    'Light no seleccionó o resaltó el tema claro')
  byText('Dark').props.click_func()
  check(harness.state.theme === 'dark' && byText('Dark').props.color === 9,
    'Dark no seleccionó o resaltó el tema oscuro')
  byText('ES').props.click_func()
  check(harness.state.language === 'es' && harness.state.enabled === false &&
    harness.state.intensity === 'normal', 'El idioma reinició preferencias')
  byText('VOLVER').props.click_func()
  check(harness.calls.back === 1, 'VOLVER no llamó goBack')
  page.onDestroy()
  check(harness.state.enabled === false, 'onDestroy alteró preferencias')

  return {
    name: 'Ajustes de sesión', assertions,
    detail: 'Idioma, vibración, apariencia, actualización visual y retorno verificados'
  }
}

if (require.main === module) {
  try { const result = run(); console.log(`PASS ${result.name}: ${result.assertions} aserciones`) }
  catch (error) { console.error(error); process.exitCode = 1 }
}

module.exports = { run }
