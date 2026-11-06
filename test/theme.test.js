const assert = require('assert').strict
const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const themePath = path.join(projectRoot, 'utils', 'theme.js')

async function loadThemeModule() {
  const source = fs.readFileSync(themePath, 'utf8')
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
  return import(moduleUrl)
}

async function run() {
  let assertions = 0
  const check = (condition, message) => {
    assertions += 1
    assert.ok(condition, message)
  }

  check(fs.existsSync(themePath), `No existe ${themePath}`)
  const themeModule = await loadThemeModule()
  const { Colors, Layout, Palette, getTheme, scaleVertical } = themeModule

  check(typeof getTheme === 'function', 'getTheme no está exportada')
  check(Colors === Palette, 'Colors debe conservarse como alias retrocompatible de Palette')

  const dark = getTheme('dark')
  const light = getTheme('light')
  const fallback = getTheme('invalid')
  const requiredKeys = [
    'bg',
    'cardBg',
    'btnSecondary',
    'textPrimary',
    'textSecondary',
    'textMuted',
    'accent',
    'success',
    'warning',
    'danger',
    'onAccent',
    'disabledBg',
    'disabledText',
    'divider',
    'Cyan500',
    'Mint400',
    'Amber400',
    'Coral400'
  ]

  for (const [mode, theme] of [['dark', dark], ['light', light]]) {
    check(theme && typeof theme === 'object', `${mode} no devolvió un tema válido`)
    for (const key of requiredKeys) {
      check(Object.prototype.hasOwnProperty.call(theme, key), `Falta ${mode}.${key}`)
      check(Number.isInteger(theme[key]) && theme[key] >= 0 && theme[key] <= 0xFFFFFF,
        `${mode}.${key} no es un entero RGB válido`)
    }
  }

  const officialBrandColors = {
    Cyan500: 0x59D9FF,
    Mint400: 0x72E4C1,
    Amber400: 0xFFC857,
    Coral400: 0xFF6B6B
  }

  for (const [name, expected] of Object.entries(officialBrandColors)) {
    assertions += 3
    assert.strictEqual(dark[name], expected, `dark.${name} cambió respecto al Design System`)
    assert.strictEqual(light[name], expected, `light.${name} cambió respecto al Design System`)
    assert.strictEqual(dark[name], light[name], `${name} debe ser idéntico en ambos temas`)
  }

  const expectedDark = {
    bg: 0x0A1118,
    cardBg: 0x111C26,
    btnSecondary: 0x1B2A38,
    textPrimary: 0xFFFFFF,
    textSecondary: 0x8FA3B8,
    textMuted: 0x506578
  }
  const expectedLight = {
    bg: 0xF0F4F8,
    cardBg: 0xFFFFFF,
    btnSecondary: 0xD9E2EC,
    textPrimary: 0x0A1118,
    textSecondary: 0x334E68,
    textMuted: 0x627D98
  }

  for (const [key, expected] of Object.entries(expectedDark)) {
    assertions += 1
    assert.strictEqual(dark[key], expected, `dark.${key} no coincide con la especificación`)
  }
  for (const [key, expected] of Object.entries(expectedLight)) {
    assertions += 1
    assert.strictEqual(light[key], expected, `light.${key} no coincide con la especificación`)
  }

  check(fallback === dark, 'Un identificador de tema inválido debe usar dark como fallback seguro')

  const sessionSource = fs.readFileSync(
    path.join(projectRoot, 'utils', 'session.js'),
    'utf8'
  )
  check(/let\s+themeMode\s*=\s*['"]light['"]/.test(sessionSource),
    'El tema predeterminado de la aplicación debe ser light')

  const themedPages = [
    'index.js',
    'destination.js',
    'confirmation.js',
    'trip.js',
    'settings.js'
  ]
  for (const fileName of themedPages) {
    const pageSource = fs.readFileSync(
      path.join(projectRoot, 'page', fileName),
      'utf8'
    )
    check(pageSource.includes('getThemeMode'),
      `page/${fileName} debe consultar el tema activo`)
    check(pageSource.includes('getTheme('),
      `page/${fileName} debe resolver tokens del tema activo`)
    check(!/\bColors\./.test(pageSource),
      `page/${fileName} no debe usar colores absolutos fuera del tema activo`)
  }
  assertions += 9
  assert.strictEqual(Layout.width, 192, 'Layout.width debe ser 192')
  assert.strictEqual(Layout.height, 490, 'Layout.height debe ser 490')
  assert.strictEqual(Layout.contentWidth, 152, 'Layout.contentWidth debe ser 152')
  assert.strictEqual(Layout.leftMargin, 20, 'Layout.leftMargin debe ser 20')
  assert.strictEqual(Layout.innerWidth, 136, 'Layout.innerWidth debe ser 136')
  assert.strictEqual(Layout.innerMargin, 28, 'Layout.innerMargin debe ser 28')
  assert.strictEqual(Layout.topSafe, 28, 'Layout.topSafe debe ser 28')
  assert.strictEqual(Layout.bottomSafe, 28, 'Layout.bottomSafe debe ser 28')
  assert.strictEqual(scaleVertical(490, 368), 368,
    'La escala vertical compacta debe mapear 490 a 368')

  return {
    name: 'Tokens de diseño',
    assertions,
    detail: 'Temas dark/light y geometría de cápsula 192×490/368 validados'
  }
}

if (require.main === module) {
  run()
    .then((result) => {
      console.log(`PASS ${result.name}: ${result.assertions} aserciones`)
    })
    .catch((error) => {
      console.error(`FAIL Tokens de diseño: ${error.message}`)
      process.exitCode = 1
    })
}

module.exports = { run }
