const assert = require('assert').strict
const fs = require('fs')
const path = require('path')

const sessionPath = path.join(__dirname, '..', 'utils', 'session.js')

async function loadSession(globalData) {
  global.getApp = () => ({ _options: { globalData } })
  const source = fs.readFileSync(sessionPath, 'utf8')
  const url = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}#${Date.now()}`
  return import(url)
}

async function run() {
  let assertions = 0
  const check = (condition, message) => {
    assertions += 1
    assert.ok(condition, message)
  }
  const previousGetApp = global.getApp
  try {
    const globalData = {
      selectedDestination: null,
      customDestination: null,
      language: 'es',
      vibrationEnabled: true,
      vibrationIntensity: 'normal',
      tripRunId: 0,
      tripActive: false
    }
    const session = await loadSession(globalData)
    check(session.getSelectedDestination() === null, 'El destino inicial debe ser nulo')
    check(session.getLanguage() === 'es', 'El idioma inicial debe ser español')
    check(session.isVibrationEnabled(), 'La vibración debe iniciar activada')
    check(session.getVibrationIntensity() === 'normal', 'La intensidad inicial debe ser normal')

    session.setSelectedDestination('home')
    session.setLanguage('en')
    session.setVibrationEnabled(false)
    session.setVibrationIntensity('strong')
    check(globalData.selectedDestination === 'Casa', 'No normalizó Casa en globalData')
    check(session.getLanguage() === 'en', 'No conservó inglés')
    check(!session.isVibrationEnabled(), 'No conservó vibración desactivada')
    check(session.getVibrationIntensity() === 'strong', 'No conservó intensidad fuerte')
    check(session.normalizeDestination('CASA') === 'Casa' &&
      session.normalizeDestination('UNIVERSITY') === 'Universidad',
    'No normalizó los destinos originales sin distinguir mayúsculas')
    check(session.normalizeDestination('cEnTrO') === 'Centro' &&
      session.normalizeDestination('BELÉN') === 'Belén' &&
      session.normalizeDestination('único') === 'Único',
    'No normalizó los tres destinos escritos')
    check(session.getDestinationDisplayName('Casa', 'en') === 'Home' &&
      session.getDestinationDisplayName('Universidad', 'en') === 'University' &&
      session.getDestinationDisplayName('belen', 'es') === 'Belén',
    'Los nombres visibles no son canónicos')
    check(session.setCustomDestination('  CeNtRo  ') === 'Centro' &&
      session.getCustomDestination() === 'Centro' &&
      session.getSelectedDestination() === 'Centro',
    'El teclado no unificó Centro con el destino seleccionado')
    check(session.setCustomDestination('BELEN') === 'Belén' &&
      session.setCustomDestination('unico') === 'Único' &&
      session.getSelectedDestination() === 'Único',
    'Belén y Único no se seleccionaron desde texto')
    check(session.setCustomDestination('Centro Comercial') === null &&
      session.getSelectedDestination() === 'Único',
    'Un destino desconocido alteró la selección válida')

    const firstRun = session.startTripSession()
    const secondRun = session.startTripSession()
    check(firstRun === 1 && secondRun === 2, 'El identificador de viaje no avanza')
    check(globalData.tripActive === true, 'El viaje no quedó activo')
    session.finishTripSession()
    check(globalData.tripActive === false, 'El viaje no se finalizó')
    check(globalData.selectedDestination === 'Único' && globalData.language === 'en',
      'Finalizar alteró destino o preferencias')

    return {
      name: 'Estado global de sesión',
      assertions,
      detail: 'Destino, idioma, vibración, intensidad y ciclo de viaje conservados en globalData'
    }
  } finally {
    if (previousGetApp === undefined) delete global.getApp
    else global.getApp = previousGetApp
  }
}

if (require.main === module) {
  run().then((result) => console.log(`PASS ${result.name}: ${result.assertions} aserciones`))
    .catch((error) => { console.error(error); process.exitCode = 1 })
}

module.exports = { run }
