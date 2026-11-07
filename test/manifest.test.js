const assert = require('assert').strict
const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const manifestPath = path.join(projectRoot, 'app.json')

function run() {
  let assertions = 0
  const check = (condition, message) => {
    assertions += 1
    assert.ok(condition, message)
  }

  check(fs.existsSync(manifestPath), `No existe ${manifestPath}`)

  let manifest
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    assertions += 1
  } catch (error) {
    assert.fail(`app.json no es JSON válido: ${error.message}`)
  }

  check(Boolean(manifest.app && (manifest.app.bundleId || manifest.app.appId)),
    'app.json requiere app.bundleId o app.appId')
  assertions += 1
  assert.strictEqual(manifest.app.appId, 1000000, 'app.appId debe conservarse en 1000000')
  assertions += 1
  assert.deepStrictEqual(manifest.permissions, ['device:os.vibrate'],
    'Solo debe declararse el permiso device:os.vibrate')

  assertions += 1
  assert.deepStrictEqual(manifest.runtime && manifest.runtime.apiVersion, {
    compatible: '1.0.0',
    target: '1.0.1',
    minVersion: '1.0.0'
  }, 'La versión del runtime Zepp OS 1.0 cambió')

  check(manifest.defaultLanguage === 'es-ES', 'defaultLanguage debe conservarse en es-ES')
  assertions += 1
  assert.deepStrictEqual(Object.keys(manifest.i18n || {}).sort(), ['en-US', 'es-ES'],
    'Deben conservarse los idiomas es-ES y en-US')

  const target = manifest.targets && manifest.targets['band-7']
  check(Boolean(target), 'Falta targets["band-7"]')
  check(target.designWidth === 192, 'band-7.designWidth debe ser 192')

  const pages = target.module && target.module.page && target.module.page.pages
  check(Array.isArray(pages), 'band-7 debe declarar module.page.pages')
  check(pages.length === 6, `Se esperaban 6 páginas y se encontraron ${pages.length}`)

  const expectedPages = [
    'page/index',
    'page/destination',
    'page/confirmation',
    'page/trip',
    'page/settings',
    'page/keyboard'
  ].sort()
  assertions += 1
  assert.deepStrictEqual([...pages].sort(), expectedPages, 'Las rutas registradas no coinciden')

  check(!target.module['app-side'], 'band-7 no debe declarar módulo app-side')
  check(!target.module['app-service'], 'band-7 no debe declarar módulo app-service')

  const platforms = target.platforms
  check(Array.isArray(platforms), 'band-7 debe declarar platforms')
  const expectedPlatforms = [
    { name: 'xiaomi-smart-band-7-international', deviceSource: 263 }
  ]
  assertions += 1
  assert.deepStrictEqual(platforms, expectedPlatforms,
    'La compilación debe conservar exclusivamente deviceSource 263')
  check(new Set(platforms.map(({ deviceSource }) => deviceSource)).size === platforms.length,
    'No puede haber deviceSource duplicados en band-7.platforms')

  for (const page of pages) {
    const pagePath = path.join(projectRoot, `${page}.js`)
    check(fs.existsSync(pagePath), `La ruta registrada no existe: ${page}.js`)
  }

  return {
    name: 'Manifiesto Zepp OS',
    assertions,
    detail: `${pages.length} páginas, deviceSource 263, runtime e invariantes validados`
  }
}

if (require.main === module) {
  try {
    const result = run()
    console.log(`PASS ${result.name}: ${result.assertions} aserciones`)
  } catch (error) {
    console.error(`FAIL Manifiesto Zepp OS: ${error.message}`)
    process.exitCode = 1
  }
}

module.exports = { run }
