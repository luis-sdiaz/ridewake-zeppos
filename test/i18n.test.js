const assert = require('assert').strict
const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const i18nPath = path.join(projectRoot, 'utils', 'i18n.js')

function parseEntries(block) {
  const entries = {}
  const entryPattern = /^\s*([A-Za-z0-9_]+):\s*(['"])(.*?)\2,?\s*$/gm
  let match

  while ((match = entryPattern.exec(block)) !== null) {
    entries[match[1]] = match[3]
  }

  return entries
}

function readDictionaries() {
  const source = fs.readFileSync(i18nPath, 'utf8')
  const esMatch = source.match(/\bes:\s*\{([\s\S]*?)\r?\n\s*\},\r?\n\s*en:/)
  const enMatch = source.match(/\ben:\s*\{([\s\S]*?)\r?\n\s*\}\r?\n\}/)

  assert.ok(esMatch, 'No se encontró el diccionario español')
  assert.ok(enMatch, 'No se encontró el diccionario inglés')

  return {
    es: parseEntries(esMatch[1]),
    en: parseEntries(enMatch[1])
  }
}

function run() {
  let assertions = 0
  const check = (condition, message) => {
    assertions += 1
    assert.ok(condition, message)
  }

  check(fs.existsSync(i18nPath), `No existe ${i18nPath}`)
  const dictionaries = readDictionaries()
  assertions += 2

  const esKeys = Object.keys(dictionaries.es).sort()
  const enKeys = Object.keys(dictionaries.en).sort()

  check(esKeys.length > 0, 'El diccionario español está vacío')
  check(enKeys.length > 0, 'El diccionario inglés está vacío')
  assertions += 1
  assert.deepStrictEqual(enKeys, esKeys, 'Los diccionarios ES/EN no tienen paridad 1:1')

  for (const language of ['es', 'en']) {
    for (const [key, value] of Object.entries(dictionaries[language])) {
      check(typeof value === 'string' && value.trim().length > 0,
        `Traducción vacía: ${language}.${key}`)
    }
  }

  for (const key of ['brand_title', 'dest_home', 'trip_title', 'settings_title']) {
    check(Object.prototype.hasOwnProperty.call(dictionaries.es, key),
      `Falta la clave crítica es.${key}`)
    check(Object.prototype.hasOwnProperty.call(dictionaries.en, key),
      `Falta la clave crítica en.${key}`)
  }

  return {
    name: 'Integridad bilingüe',
    assertions,
    detail: `${esKeys.length} claves con paridad ES/EN y valores no vacíos`
  }
}

if (require.main === module) {
  try {
    const result = run()
    console.log(`PASS ${result.name}: ${result.assertions} aserciones`)
  } catch (error) {
    console.error(`FAIL Integridad bilingüe: ${error.message}`)
    process.exitCode = 1
  }
}

module.exports = { run }
