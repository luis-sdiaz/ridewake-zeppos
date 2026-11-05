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
  check(Array.isArray(manifest.permissions) && manifest.permissions.includes('device:os.vibrate'),
    'Falta el permiso device:os.vibrate')

  const target = manifest.targets && manifest.targets['band-7']
  check(Boolean(target), 'Falta targets["band-7"]')
  check(target.designWidth === 192, 'band-7.designWidth debe ser 192')

  const pages = target.module && target.module.page && target.module.page.pages
  check(Array.isArray(pages), 'band-7 debe declarar module.page.pages')
  check(pages.length === 5, `Se esperaban 5 páginas y se encontraron ${pages.length}`)

  const expectedPages = [
    'page/index',
    'page/destination',
    'page/confirmation',
    'page/trip',
    'page/settings'
  ].sort()
  assertions += 1
  assert.deepStrictEqual([...pages].sort(), expectedPages, 'Las rutas registradas no coinciden')

  for (const page of pages) {
    const pagePath = path.join(projectRoot, `${page}.js`)
    check(fs.existsSync(pagePath), `La ruta registrada no existe: ${page}.js`)
  }

  return {
    name: 'Manifiesto Zepp OS',
    assertions,
    detail: `${pages.length} páginas, target band-7 y permiso de vibración validados`
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
