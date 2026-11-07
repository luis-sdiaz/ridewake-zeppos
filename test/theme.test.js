const assert = require('assert').strict
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const root = path.join(__dirname, '..')
const pages = ['index.js', 'destination.js', 'confirmation.js', 'trip.js', 'settings.js', 'keyboard.js']

function run() {
  let assertions = 0
  const check = (condition, message) => { assertions += 1; assert.ok(condition, message) }
  const theme = fs.readFileSync(path.join(root, 'utils', 'theme.js'), 'utf8')
  const session = fs.readFileSync(path.join(root, 'utils', 'session.js'), 'utf8')
  const index = fs.readFileSync(path.join(root, 'page', 'index.js'), 'utf8')
  check(theme.includes('0xf4fafc') && theme.includes('0x087d87'),
    'Falta la paleta clara especificada')
  const executableTheme = theme
    .replace(/^import .*$/gm, '')
    .replace(/export function /g, 'function ')
    .replace(/export const /g, 'const ')
    .replace(/\n$/, '') +
    '\nthis.themeApi = { getTheme, getActiveTheme }'
  const context = {
    getSessionTheme: () => context.mode,
    ScreenLayout: { width: 192, usableHeight: 349 },
    mode: 'dark',
    console
  }
  vm.runInNewContext(executableTheme, context)
  check(context.themeApi.getActiveTheme().bg === 0x050b0d,
    'El tema oscuro no devuelve fondo oscuro')
  context.mode = 'light'
  check(context.themeApi.getActiveTheme().bg === 0xf4fafc &&
    context.themeApi.getActiveTheme().textPrimary === 0x17333b,
  'El tema claro no devuelve fondo y texto de alto contraste')
  check(theme.includes('createPageBackground') && theme.includes('FILL_RECT'),
    'Falta el fondo FILL_RECT seguro')
  check(session.includes("theme: 'dark'") && session.includes("value === 'light'"),
    'El tema oscuro no es el predeterminado o no se valida')
  check(index.includes("home_settings") && !index.includes('normal_src') &&
    !index.includes('press_src') && !index.includes('⚙'),
  'Configuración debe usar texto, no iconos Unicode o imágenes')
  for (const page of pages) {
    const source = fs.readFileSync(path.join(root, 'page', page), 'utf8')
    check(source.includes('getActiveTheme'), `${page}: no lee la paleta activa`)
    check(source.includes('createPageBackground'), `${page}: no crea el fondo`)
  }
  check(fs.readFileSync(path.join(root, 'utils', 'i18n.js'), 'utf8')
    .includes('settings_appearance'), 'Faltan traducciones de Apariencia')
  return {
    name: 'Temas claro y oscuro',
    assertions,
    detail: 'Paletas, estado compartido, fondos y las cinco pantallas verificadas'
  }
}

if (require.main === module) {
  try { const result = run(); console.log(`PASS ${result.name}: ${result.assertions} aserciones`) }
  catch (error) { console.error(error); process.exitCode = 1 }
}

module.exports = { run }
