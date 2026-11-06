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

const BASE_HEIGHT = 490
const COMPACT_HEIGHT = 368

function scaleVertical(value, height) {
  if (value === 0) return 0
  if (height >= BASE_HEIGHT) return value
  return Math.max(1, Math.round(value * height / BASE_HEIGHT))
}

function resolveDimension(expression, height = BASE_HEIGHT) {
  const value = expression.trim()
  if (/^-?\d+$/.test(value)) return Number(value)
  if (value === 'Layout.width') return 192
  if (value === 'Layout.height') return height
  if (value === 'Layout.contentWidth') return 152
  if (value === 'Layout.leftMargin') return 20
  if (value === 'Layout.innerWidth') return 136
  if (value === 'Layout.innerMargin') return 28
  const scaled = value.match(/^Layout\.(?:y|h)\((\d+)\)$/)
  if (scaled) return scaleVertical(Number(scaled[1]), height)
  return null
}

function readProperty(call, property, height = BASE_HEIGHT) {
  const match = call.match(new RegExp(`\\b${property}:\\s*([^,\\n}]+)`))
  return match ? resolveDimension(match[1], height) : null
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

    if (fileName === 'index.js') {
      const homeLayouts = [...source.matchAll(/titleY:\s*(\d+),\s*titleH:\s*(\d+),\s*heroY:\s*(\d+),\s*statusY:\s*(\d+),\s*statusH:\s*(\d+),\s*primaryY:\s*(\d+),\s*primaryH:\s*(\d+),\s*settingsY:\s*(\d+),\s*settingsH:\s*(\d+)/g)]
        .map((match) => match.slice(1).map(Number))
      const statusCall = extractWidgetCalls(source).find((call) => call.includes("t('home_status')"))

      check(!source.includes("t('brand_title')"),
        'page/index.js: no debe repetir la marca dentro del contenido')
      check(!source.includes("t('home_description')"),
        'page/index.js: no debe mostrar la descripción redundante')
      check(homeLayouts.length === 2,
        'page/index.js: deben existir layouts para 192×490 y 192×368')
      check(Boolean(statusCall), 'page/index.js: no se pudo auditar el estado de inicio')
      const heroCall = extractWidgetCalls(source).find((call) =>
        call.includes('y: homeLayout.heroY') && call.includes('color: theme.accent'))
      const heroWidth = heroCall ? readProperty(heroCall, 'w') : null
      const heroHeight = heroCall ? readProperty(heroCall, 'h') : null
      check(Boolean(heroCall) && heroWidth > 0 && heroWidth === heroHeight,
        'page/index.js: el protagonista debe conservar una geometría cuadrada segura')
      check(source.includes('theme.accent') && source.includes('theme.success'),
        'page/index.js: el recorrido decorativo debe usar tokens del tema')
      check(!/\b(?:setInterval|setTimeout)\s*\(/.test(source),
        'page/index.js: el protagonista no debe usar temporizadores')
      check(readProperty(statusCall, 'w') >= 70,
        'page/index.js: el estado corto necesita al menos 70 px de ancho')

      const layoutHeights = [COMPACT_HEIGHT, BASE_HEIGHT]
      homeLayouts.forEach((layout, index) => {
        const [titleY, titleH, heroY, statusY, statusH, primaryY, primaryH, settingsY, settingsH] = layout
        const screenHeight = layoutHeights[index]
        const safeInset = scaleVertical(28, screenHeight)

        check(titleY >= safeInset,
          `page/index.js: título fuera de la zona segura en 192×${screenHeight}`)
        check(titleH >= 48,
          `page/index.js: título sin altura geométrica para dos líneas en 192×${screenHeight}`)
        check(titleY + titleH <= heroY,
          `page/index.js: título superpuesto con el protagonista en 192×${screenHeight}`)
        check(heroY + heroHeight <= statusY,
          `page/index.js: protagonista superpuesto con el estado en 192×${screenHeight}`)
        check(statusY + statusH <= primaryY,
          `page/index.js: estado superpuesto con la acción principal en 192×${screenHeight}`)
        check(primaryY + primaryH <= settingsY,
          `page/index.js: acciones superpuestas en 192×${screenHeight}`)
        check(settingsY + settingsH <= screenHeight - safeInset,
          `page/index.js: Ajustes invade el extremo inferior en 192×${screenHeight}`)
      })
    }

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

    for (const deviceHeight of [BASE_HEIGHT, COMPACT_HEIGHT]) {
      for (const call of calls) {
        const x = readProperty(call, 'x', deviceHeight)
        const y = readProperty(call, 'y', deviceHeight)
        const width = readProperty(call, 'w', deviceHeight)
        const widgetHeight = readProperty(call, 'h', deviceHeight)

        if (x !== null && width !== null) {
          check(x + width <= 192,
            `page/${fileName}: widget fuera del ancho (${x} + ${width})`)
          if (call.includes('hmUI.widget.BUTTON')) {
            check(x >= 20 && x + width <= 172,
              `page/${fileName}: botón fuera de la zona segura horizontal`)
          }
          if (call.includes('hmUI.widget.FILL_RECT') && !(x === 0 && width === 192)) {
            check(x >= 20 && x + width <= 172,
              `page/${fileName}: panel fuera de la zona segura horizontal`)
          }
        }
        if (y !== null && widgetHeight !== null) {
          check(y + widgetHeight <= deviceHeight,
            `page/${fileName}: widget fuera del alto ${deviceHeight} (${y} + ${widgetHeight})`)
          if (call.includes('hmUI.widget.BUTTON')) {
            const safeInset = scaleVertical(28, deviceHeight)
            check(y >= safeInset && y + widgetHeight <= deviceHeight - safeInset,
              `page/${fileName}: botón invade los extremos redondeados`)
          }
        }
      }
    }
  }

  check(widgetCount > 0, 'No se detectaron llamadas hmUI.createWidget')
  check(numericDimensionCount > 0, 'No se detectaron dimensiones numéricas')

  return {
    name: 'Límites de pantalla',
    assertions,
    detail: `${widgetCount} widgets auditados en 192×490 y 192×368 con zona segura de cápsula`
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
