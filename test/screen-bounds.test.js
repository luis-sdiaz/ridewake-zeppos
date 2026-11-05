const assert = require('assert').strict
const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const pageDirectory = path.join(projectRoot, 'page')
const expectedFiles = [
  'index.js',
  'destination.js',
  'confirmation.js',
  'trip.js',
  'settings.js'
]

function extractWidgetCalls(source) {
  const marker = 'hmUI.createWidget('
  const calls = []
  let cursor = 0

  while ((cursor = source.indexOf(marker, cursor)) !== -1) {
    const start = cursor
    let index = cursor + marker.length
    let depth = 1
    let quote = null
    let escaped = false

    for (; index < source.length && depth > 0; index += 1) {
      const character = source[index]

      if (quote) {
        if (escaped) escaped = false
        else if (character === '\\') escaped = true
        else if (character === quote) quote = null
        continue
      }

      if (character === "'" || character === '"' || character === '`') {
        quote = character
      } else if (character === '(') {
        depth += 1
      } else if (character === ')') {
        depth -= 1
      }
    }

    calls.push(source.slice(start, index))
    cursor = index
  }

  return calls
}

function resolveDimension(expression) {
  const value = expression.trim()
  if (/^-?\d+$/.test(value)) return Number(value)
  if (value === 'Layout.width') return 192
  if (value === 'Layout.height') return 490
  if (value === 'Layout.contentWidth') return 160
  if (value === 'Layout.leftMargin') return 16
  return null
}

function readProperty(call, property) {
  const match = call.match(new RegExp(`\\b${property}:\\s*([^,\\n}]+)`))
  return match ? resolveDimension(match[1]) : null
}

function run() {
  let assertions = 0
  let widgetCount = 0
  let numericDimensionCount = 0
  const check = (condition, message) => {
    assertions += 1
    assert.ok(condition, message)
  }

  for (const fileName of expectedFiles) {
    const filePath = path.join(pageDirectory, fileName)
    check(fs.existsSync(filePath), `No existe page/${fileName}`)
    const source = fs.readFileSync(filePath, 'utf8')
    const calls = extractWidgetCalls(source)
    widgetCount += calls.length

    check(calls.length > 0, `page/${fileName} no crea widgets`)
    check(!/["']#[0-9A-Fa-f]{3,8}["']/.test(source),
      `page/${fileName} contiene un color hexadecimal string`)
    check(!/0x[0-9A-Fa-f]{6}/.test(source),
      `page/${fileName} contiene un color hexadecimal fuera de theme.js`)

    const dimensions = source.matchAll(/\b([xywh]):\s*(-?\d+)\b/g)
    for (const match of dimensions) {
      const property = match[1]
      const value = Number(match[2])
      numericDimensionCount += 1
      check(value >= 0, `page/${fileName}: ${property} no puede ser negativo (${value})`)
      if (property === 'x' || property === 'w') {
        check(value <= 192, `page/${fileName}: ${property}=${value} excede 192 px`)
      } else {
        check(value <= 490, `page/${fileName}: ${property}=${value} excede 490 px`)
      }
    }

    for (const call of calls) {
      const x = readProperty(call, 'x')
      const y = readProperty(call, 'y')
      const width = readProperty(call, 'w')
      const height = readProperty(call, 'h')

      if (x !== null && width !== null) {
        check(x + width <= 192,
          `page/${fileName}: widget fuera del ancho (${x} + ${width})`)
      }
      if (y !== null && height !== null) {
        check(y + height <= 490,
          `page/${fileName}: widget fuera del alto (${y} + ${height})`)
      }
    }
  }

  check(widgetCount > 0, 'No se detectaron llamadas hmUI.createWidget')
  check(numericDimensionCount > 0, 'No se detectaron dimensiones numéricas')

  return {
    name: 'Límites de pantalla',
    assertions,
    detail: `${widgetCount} widgets y ${numericDimensionCount} coordenadas/dimensiones auditadas`
  }
}

if (require.main === module) {
  try {
    const result = run()
    console.log(`PASS ${result.name}: ${result.assertions} aserciones`)
  } catch (error) {
    console.error(`FAIL Límites de pantalla: ${error.message}`)
    process.exitCode = 1
  }
}

module.exports = { run }
