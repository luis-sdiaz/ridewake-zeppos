const assert = require('assert').strict
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const projectRoot = path.resolve(__dirname, '..')
const settingsPath = path.join(projectRoot, 'page', 'settings.js')

function stripImports(source) {
  return source.replace(/^import\s+[\s\S]*?\s+from\s+['"][^'"]+['"]\s*\r?\n/gm, '')
}

function createTheme(seed) {
  return {
    bg: seed + 1,
    cardBg: seed + 2,
    btnSecondary: seed + 3,
    textPrimary: seed + 4,
    textSecondary: seed + 5,
    textMuted: seed + 6,
    accent: seed + 7,
    success: seed + 8,
    warning: seed + 9,
    danger: seed + 10,
    onAccent: seed + 11,
    disabledBg: seed + 12,
    disabledText: seed + 13,
    divider: seed + 14
  }
}

function createHarness() {
  const themes = { dark: createTheme(100), light: createTheme(200) }
  const state = { language: 'es', theme: 'dark', haptic: 'normal' }
  const calls = { reload: 0, goBack: 0, vibrate: 0, destroyHaptics: 0 }
  const createdWidgets = []
  let page = null

  const translations = {
    es: {
      settings_title: 'AJUSTES', settings_lang_label: 'Idioma', settings_theme_label: 'Tema',
      settings_theme_dark: 'Oscuro', settings_theme_light: 'Claro',
      settings_haptic_label: 'Vibración', settings_haptic_normal: 'Normal',
      settings_haptic_strong: 'Intensa', settings_about_label: 'Acerca de',
      settings_version: 'RideWake Band v1.0.0', settings_target: 'Xiaomi Band 7 (Zepp OS)',
      settings_btn_back: 'Volver'
    },
    en: {
      settings_title: 'SETTINGS', settings_lang_label: 'Language', settings_theme_label: 'Theme',
      settings_theme_dark: 'Dark', settings_theme_light: 'Light',
      settings_haptic_label: 'Vibration', settings_haptic_normal: 'Normal',
      settings_haptic_strong: 'Strong', settings_about_label: 'About',
      settings_version: 'RideWake Band v1.0.0', settings_target: 'Xiaomi Band 7 (Zepp OS)',
      settings_btn_back: 'Back'
    }
  }

  const hmUI = {
    widget: { FILL_RECT: 'FILL_RECT', TEXT: 'TEXT', BUTTON: 'BUTTON' },
    prop: { MORE: 'MORE', TEXT: 'TEXT' },
    align: { CENTER_H: 'CENTER_H', CENTER_V: 'CENTER_V' },
    text_style: { WRAP: 'WRAP' },
    createWidget(type, options) {
      const widget = {
        type,
        props: { ...options },
        updates: [],
        setProperty(property, value) {
          this.updates.push({ property, value: { ...value } })
          if (property === hmUI.prop.TEXT) this.props.text = value
          else Object.assign(this.props, value)
        }
      }
      createdWidgets.push(widget)
      return widget
    }
  }

  const context = {
    Page(definition) { page = definition },
    hmUI,
    hmApp: {
      reloadPage() { calls.reload += 1 },
      goBack() { calls.goBack += 1 }
    },
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
    Type: { body: 14, button: 16, caption: 12 },
    getTheme: (mode) => themes[mode],
    getLanguage: () => state.language,
    setLanguage: (language) => { state.language = language },
    t: (key) => translations[state.language][key] || key,
    getHapticMode: () => state.haptic,
    setHapticMode: (mode) => { state.haptic = mode },
    getThemeMode: () => state.theme,
    setThemeMode: (mode) => { state.theme = mode },
    initHaptics() {},
    destroyHaptics() { calls.destroyHaptics += 1 },
    vibrateShort() { calls.vibrate += 1 },
    console
  }

  vm.runInNewContext(stripImports(fs.readFileSync(settingsPath, 'utf8')), context, {
    filename: settingsPath
  })

  return { themes, state, calls, createdWidgets, getPage: () => page }
}

function run() {
  let assertions = 0
  const check = (condition, message) => {
    assertions += 1
    assert.ok(condition, message)
  }

  const harness = createHarness()
  const page = harness.getPage()
  check(page && typeof page.build === 'function', 'La página Ajustes no registró build()')
  page.build()

  const widgets = harness.createdWidgets
  const initialWidgetCount = widgets.length
  const byText = (text) => widgets.find((widget) => widget.props.text === text)
  const background = widgets.find((widget) =>
    widget.type === 'FILL_RECT' && widget.props.x === 0 && widget.props.w === 192)
  const aboutCard = widgets.find((widget) =>
    widget.type === 'FILL_RECT' && widget.props.x === 20 && widget.props.w === 152)
  const darkButton = byText('Oscuro')
  const lightButton = byText('Claro')
  const normalButton = byText('Normal')
  const strongButton = byText('Intensa')

  for (const [name, widget] of Object.entries({
    background,
    aboutCard,
    darkButton,
    lightButton,
    normalButton,
    strongButton
  })) {
    check(Boolean(widget), `No se encontró el widget ${name}`)
  }

  lightButton.props.click_func()
  check(harness.state.theme === 'light', 'Claro no actualizó la preferencia')
  check(harness.calls.reload === 0, 'El cambio de tema no debe depender de reloadPage()')
  check(widgets.length === initialWidgetCount, 'El cambio de tema creó widgets adicionales')
  check(background.props.color === harness.themes.light.bg, 'El fondo no cambió a claro')
  check(aboutCard.props.color === harness.themes.light.cardBg, 'La tarjeta Acerca de no cambió a claro')
  check(byText('AJUSTES').props.color === harness.themes.light.accent,
    'El encabezado no cambió a claro')
  check(byText('Idioma').props.color === harness.themes.light.textSecondary,
    'La etiqueta Idioma no cambió a claro')
  check(byText('Español').props.normal_color === harness.themes.light.btnSecondary,
    'El control de idioma no cambió a claro')
  check(lightButton.props.normal_color === harness.themes.light.success &&
    lightButton.props.color === harness.themes.light.onAccent,
  'Claro no aparece seleccionado inmediatamente')
  check(darkButton.props.normal_color === harness.themes.light.btnSecondary &&
    darkButton.props.color === harness.themes.light.textPrimary,
  'Oscuro no aparece deseleccionado inmediatamente')
  check(normalButton.props.normal_color === harness.themes.light.success,
    'La selección háptica no se conservó al cambiar el tema')
  check(byText('RideWake Band v1.0.0').props.color === harness.themes.light.textPrimary,
    'El texto de versión no cambió a claro')
  check(byText('Xiaomi Band 7 (Zepp OS)').props.color === harness.themes.light.accent,
    'El texto de dispositivo no cambió a claro')
  check(byText('Volver').props.normal_color === harness.themes.light.btnSecondary,
    'Volver no cambió a claro')

  darkButton.props.click_func()
  check(harness.state.theme === 'dark', 'Oscuro no actualizó la preferencia')
  check(background.props.color === harness.themes.dark.bg, 'El fondo no volvió a oscuro')
  check(darkButton.props.normal_color === harness.themes.dark.success,
    'Oscuro no aparece seleccionado inmediatamente')

  lightButton.props.click_func()
  check(harness.state.theme === 'light', 'La segunda selección de Claro falló')
  check(widgets.length === initialWidgetCount,
    'Claro → Oscuro → Claro acumuló widgets o listeners')

  strongButton.props.click_func()
  check(harness.state.haptic === 'strong', 'Intensa no actualizó la preferencia háptica')
  check(strongButton.props.normal_color === harness.themes.light.success,
    'Intensa no aparece seleccionada inmediatamente')
  lightButton.props.click_func()
  check(harness.state.haptic === 'strong', 'El tema reinició la preferencia háptica')

  byText('Español').props.click_func()
  check(harness.state.language === 'en', 'El botón de idioma no alternó a inglés')
  check(harness.state.theme === 'light' && harness.state.haptic === 'strong',
    'El idioma reinició otras preferencias')
  check(harness.calls.reload === 0, 'El idioma no debe depender de reloadPage()')
  check(byText('English') && byText('SETTINGS') && byText('Language'),
    'Los textos de Ajustes no cambiaron inmediatamente a inglés')
  check(byText('Light').props.normal_color === harness.themes.light.success,
    'El idioma no conservó la selección visual del tema')
  check(byText('Strong').props.normal_color === harness.themes.light.success,
    'El idioma no conservó la selección visual háptica')

  page.onDestroy()
  check(harness.calls.destroyHaptics === 1, 'Ajustes no liberó los hápticos')

  return {
    name: 'Comportamiento de Ajustes',
    assertions,
    detail: 'Tema inmediato, preferencias y ciclos Claro/Oscuro validados con hmUI simulado'
  }
}

if (require.main === module) {
  try {
    const result = run()
    console.log(`PASS ${result.name}: ${result.assertions} aserciones`)
  } catch (error) {
    console.error(`FAIL Comportamiento de Ajustes: ${error.stack || error.message}`)
    process.exitCode = 1
  }
}

module.exports = { run }
