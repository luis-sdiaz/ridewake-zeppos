const assert = require('assert').strict
const fs = require('fs')
const path = require('path')

const pageDirectory = path.join(__dirname, '..', 'page')
const pages = ['index.js', 'destination.js', 'confirmation.js', 'trip.js', 'settings.js']

function run() {
  let assertions = 0
  const check = (condition, message) => { assertions += 1; assert.ok(condition, message) }
  for (const page of pages) {
    const source = fs.readFileSync(path.join(pageDirectory, page), 'utf8')
    check(!source.includes('FILL_RECT'), `${page}: debe conservar fondo negro nativo`)
    check(source.includes('0x35dce8'), `${page}: falta el acento cian principal`)
    check(source.includes('0xffffff'), `${page}: falta texto blanco legible`)
    check(!source.includes('getTheme('), `${page}: no debe reintroducir temas variables`)
  }
  const index = fs.readFileSync(path.join(pageDirectory, 'index.js'), 'utf8')
  check(index.includes('x: layoutValue(20, 18), y: layoutValue(94, 136)'),
    'La geometría circular de Casa cambió')
  check(index.includes('x: layoutValue(104, 102), y: layoutValue(94, 136)'),
    'La geometría circular de Uni cambió')
  check(index.includes('x: layoutValue(60, 57), y: layoutValue(212, 286)'),
    'La geometría circular de IR cambió')
  check(index.includes('x: layoutValue(76, 73), y: layoutValue(304, 414)'),
    'Ajustes debe conservar una zona táctil circular de 40 px')
  check(index.includes('text_style: hmUI.text_style.WRAP'),
    'El estado de Inicio debe permitir salto de línea')
  const trip = fs.readFileSync(path.join(pageDirectory, 'trip.js'), 'utf8')
  check(trip.includes("text: t('trip_advance'), text_size: layoutValue(12, 13)"),
    'AVANZAR debe conservar texto legible')
  check(trip.includes("text: t('trip_finish'), text_size: layoutValue(11, 12)"),
    'FINALIZAR debe conservar texto legible')
  return {
    name: 'Identidad visual estable', assertions,
    detail: 'Fondo nativo, paleta oscura y geometría original de Inicio verificadas'
  }
}

if (require.main === module) {
  try { const result = run(); console.log(`PASS ${result.name}: ${result.assertions} aserciones`) }
  catch (error) { console.error(error); process.exitCode = 1 }
}

module.exports = { run }
