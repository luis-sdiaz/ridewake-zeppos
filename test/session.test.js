const assert = require('assert').strict
const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const sessionPath = path.join(projectRoot, 'utils', 'session.js')

async function loadSession(globalData) {
  global.getApp = () => ({ _options: { globalData } })
  const source = fs.readFileSync(sessionPath, 'utf8')
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}#${Date.now()}`
  return import(moduleUrl)
}

async function run() {
  let assertions = 0
  const check = (condition, message) => {
    assertions += 1
    assert.ok(condition, message)
  }
  const previousGetApp = global.getApp

  try {
    const globalData = {}
    const session = await loadSession(globalData)

    check(session.getThemeMode() === 'light', 'El tema inicial debe ser claro')
    check(session.getHapticMode() === 'normal', 'La vibración inicial debe ser normal')
    check(session.getSelectedDestination() === null, 'El destino inicial debe ser nulo')

    session.setThemeMode('dark')
    session.setHapticMode('strong')
    session.setSelectedDestination('university')
    check(session.getThemeMode() === 'dark', 'No se conservó el tema oscuro')
    check(session.getHapticMode() === 'strong', 'No se conservó la vibración intensa')
    check(session.getSelectedDestination() === 'university', 'No se conservó el destino')
    check(globalData.themeMode === 'dark' && globalData.hapticMode === 'strong',
      'Las preferencias no se guardaron en globalData')

    session.clearSession()
    check(session.getSelectedDestination() === null, 'clearSession no limpió el destino')
    check(session.getThemeMode() === 'dark', 'clearSession reinició el tema')
    check(session.getHapticMode() === 'strong', 'clearSession reinició la vibración')

    session.setThemeMode('invalid')
    session.setHapticMode('invalid')
    check(session.getThemeMode() === 'dark', 'Un tema inválido alteró la preferencia')
    check(session.getHapticMode() === 'strong', 'Un háptico inválido alteró la preferencia')

    return {
      name: 'Persistencia de sesión',
      assertions,
      detail: 'Tema, vibración y destino validados sin reinicios cruzados'
    }
  } finally {
    if (previousGetApp === undefined) delete global.getApp
    else global.getApp = previousGetApp
  }
}

if (require.main === module) {
  run()
    .then((result) => console.log(`PASS ${result.name}: ${result.assertions} aserciones`))
    .catch((error) => {
      console.error(`FAIL Persistencia de sesión: ${error.stack || error.message}`)
      process.exitCode = 1
    })
}

module.exports = { run }
