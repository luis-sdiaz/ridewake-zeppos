const assert = require('assert').strict
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const keyboardPath = path.join(__dirname, '..', 'page', 'keyboard.js')

function stripImports(source) {
  return source.replace(/^import\s+[\s\S]*?\s+from\s+['"][^'"]+['"]\s*\r?\n/gm, '')
}

function createHarness() {
  const widgets = []
  const calls = { back: 0 }
  const state = { customDestination: null, selectedDestination: null }
  let page
  const translations = {
    keyboard_title: 'DESTINATION', keyboard_groups: 'GROUPS',
    keyboard_space: 'SPACE', keyboard_delete: 'DELETE',
    keyboard_done: 'DONE', keyboard_cancel: 'CANCEL',
    keyboard_edit: 'EDIT', keyboard_experimental: 'Text input test',
    keyboard_empty: 'Type a destination', keyboard_unavailable: 'DESTINATION UNAVAILABLE',
    home_nav_error: 'Could not open'
  }
  const hmUI = {
    widget: { TEXT: 'TEXT', BUTTON: 'BUTTON' },
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
  const context = {
    Page(value) { page = value },
    hmUI,
    hmApp: { goBack() { calls.back += 1 } },
    console,
    t: (key) => translations[key] || key,
    getLanguage: () => 'en',
    getActiveTheme: () => ({
      bg: 0, title: 1, textPrimary: 2, textSecondary: 3,
      btnSecondary: 4, btnSecondaryPress: 5, btnSecondaryText: 6,
      accent: 7, accentPress: 8, onAccent: 9, alertEarly: 10
    }),
    createPageBackground: () => null,
    layoutValue: (compactValue) => compactValue,
    setCustomDestination(value) {
      const aliases = { centro: 'Centro', belen: 'Belén', 'belén': 'Belén',
        unico: 'Único', 'único': 'Único', casa: 'Casa', universidad: 'Universidad' }
      const destination = aliases[String(value).trim().toLowerCase()] || null
      if (!destination) return null
      state.customDestination = destination
      state.selectedDestination = destination
      return destination
    }
  }
  vm.runInNewContext(stripImports(fs.readFileSync(keyboardPath, 'utf8')), context)
  return { page, widgets, calls, state, getPage: () => page }
}

function run() {
  let assertions = 0
  const check = (condition, message) => { assertions += 1; assert.ok(condition, message) }
  const harness = createHarness()
  const page = harness.getPage()
  page.build()
  const byText = (text) => harness.widgets.find((widget) => widget.props.text === text)

  const initialWidgetCount = harness.widgets.length
  byText('DONE').props.click_func()
  check(harness.state.customDestination === null && harness.calls.back === 0,
    'Un destino vacío no debe guardarse ni navegar')
  check(harness.widgets.length === initialWidgetCount &&
    harness.widgets.some((widget) => widget.props.text === 'Type a destination'),
  'El destino vacío debe mostrar una indicación sin crear widgets')
  function typeText(activeHarness, text) {
    const find = (label) => activeHarness.widgets.find((widget) => widget.props.text === label)
    for (const character of text) {
      const group = ['ABC', 'DEF', 'GHI', 'JKL', 'MNÑ', 'OPQ', 'RST', 'UVW', 'XYZ']
        .find((value) => value.indexOf(character) >= 0)
      find(group).props.click_func()
      find(character).props.click_func()
      find('GROUPS').props.click_func()
    }
  }
  typeText(harness, 'CENTRO')
  byText('DONE').props.click_func()
  check(harness.state.customDestination === 'Centro' &&
    harness.state.selectedDestination === 'Centro',
  'LISTO no seleccionó Centro')
  check(harness.calls.back === 1, 'LISTO no regresó a Inicio')
  byText('DONE').props.click_func()
  check(harness.calls.back === 1, 'LISTO navegó más de una vez')
  check(!byText('EDIT') && !byText('CANCEL'), 'No debe aparecer una confirmación intermedia')
  check(Boolean(byText('GROUPS')), 'GRUPOS debe permanecer en la interfaz')

  for (const [typed, expected] of [['BELEN', 'Belén'], ['UNICO', 'Único']]) {
    const destinationHarness = createHarness()
    destinationHarness.getPage().build()
    typeText(destinationHarness, typed)
    destinationHarness.widgets.find((widget) => widget.props.text === 'DONE').props.click_func()
    check(destinationHarness.state.selectedDestination === expected &&
      destinationHarness.calls.back === 1,
    `${typed}: LISTO no seleccionó el destino canónico`)
  }

  const unavailableHarness = createHarness()
  unavailableHarness.getPage().build()
  typeText(unavailableHarness, 'P')
  unavailableHarness.widgets.find((widget) => widget.props.text === 'DONE').props.click_func()
  check(unavailableHarness.state.selectedDestination === null &&
    unavailableHarness.calls.back === 0,
  'Un destino desconocido se guardó o regresó a Inicio')
  check(unavailableHarness.widgets.some((widget) =>
    widget.props.text === 'DESTINATION UNAVAILABLE'),
  'Un destino desconocido no mostró un aviso claro')
  const limitHarness = createHarness()
  limitHarness.getPage().build()
  const limitByText = (text) => limitHarness.widgets.find((widget) =>
    widget.type === 'BUTTON' && widget.props.text === text)
  limitByText('ABC').props.click_func()
  for (let index = 0; index < 25; index += 1) limitByText('A').props.click_func()
  const preview = limitHarness.widgets.find((widget) =>
    typeof widget.props.text === 'string' && widget.props.text.indexOf('A') === 0)
  check(Boolean(preview && preview.props.text.length <= 20), 'Superó el límite de caracteres')
  check(!byText('CANCEL'), 'CANCELAR no debe aparecer en la interfaz')

  return {
    name: 'Teclado experimental',
    assertions,
    detail: 'Grupos, letras, espacio, borrado, límite, guardado y regreso nativo verificados'
  }
}

if (require.main === module) {
  try { const result = run(); console.log(`PASS ${result.name}: ${result.assertions} aserciones`) }
  catch (error) { console.error(error); process.exitCode = 1 }
}

module.exports = { run }
