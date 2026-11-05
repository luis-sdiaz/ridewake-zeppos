const assert = require('assert').strict
const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const themePath = path.join(projectRoot, 'utils', 'theme.js')

function parseObject(source, exportName, valuePattern) {
  const blockPattern = new RegExp(`export const ${exportName} = \\{([\\s\\S]*?)\\r?\\n\\}`)
  const blockMatch = source.match(blockPattern)
  assert.ok(blockMatch, `No se encontró el objeto ${exportName}`)

  const values = {}
  let match
  while ((match = valuePattern.exec(blockMatch[1])) !== null) {
    values[match[1]] = Number(match[2])
  }
  return values
}

function run() {
  let assertions = 0
  const check = (condition, message) => {
    assertions += 1
    assert.ok(condition, message)
  }

  check(fs.existsSync(themePath), `No existe ${themePath}`)
  const source = fs.readFileSync(themePath, 'utf8')
  const colors = parseObject(source, 'Colors', /^\s*([A-Za-z0-9_]+):\s*(0x[0-9A-Fa-f]+),?\s*$/gm)
  const layout = parseObject(source, 'Layout', /^\s*([A-Za-z0-9_]+):\s*(\d+),?\s*$/gm)
  assertions += 2

  const officialBrandColors = {
    Cyan500: 0x59D9FF,
    Mint400: 0x72E4C1,
    Amber400: 0xFFC857,
    Coral400: 0xFF6B6B
  }

  for (const [name, expected] of Object.entries(officialBrandColors)) {
    check(Object.prototype.hasOwnProperty.call(colors, name), `Falta Colors.${name}`)
    check(Number.isInteger(colors[name]) && colors[name] > 0 && colors[name] <= 0xFFFFFF,
      `Colors.${name} no es un entero RGB válido`)
    assertions += 1
    assert.strictEqual(colors[name], expected, `Colors.${name} cambió respecto al Design System`)
  }

  for (const name of ['Navy950', 'Navy900', 'Navy700']) {
    check(Object.prototype.hasOwnProperty.call(colors, name), `Falta Colors.${name}`)
    check(Number.isInteger(colors[name]) && colors[name] > 0 && colors[name] <= 0xFFFFFF,
      `Colors.${name} no es un entero RGB válido`)
  }

  assertions += 3
  assert.strictEqual(layout.width, 192, 'Layout.width debe ser 192')
  assert.strictEqual(layout.height, 490, 'Layout.height debe ser 490')
  assert.strictEqual(layout.contentWidth, 160, 'Layout.contentWidth debe ser 160')

  return {
    name: 'Tokens de diseño',
    assertions,
    detail: `${Object.keys(colors).length} colores y layout 192×490/160 validados`
  }
}

if (require.main === module) {
  try {
    const result = run()
    console.log(`PASS ${result.name}: ${result.assertions} aserciones`)
  } catch (error) {
    console.error(`FAIL Tokens de diseño: ${error.message}`)
    process.exitCode = 1
  }
}

module.exports = { run }
