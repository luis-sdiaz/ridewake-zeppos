const path = require('path')

const suites = [
  './i18n.test.js',
  './theme.test.js',
  './manifest.test.js',
  './screen-bounds.test.js',
  './routeSimulator.test.js'
]

let totalAssertions = 0
let passedSuites = 0
const failures = []

async function main() {
  console.log('RideWake Band — Suite de calidad')
  console.log('=================================')

  for (const suitePath of suites) {
    const label = path.basename(suitePath)
    console.log(`\n[RUN] ${label}`)

    try {
      const suite = require(suitePath)
      const result = await Promise.resolve(suite.run())
      totalAssertions += result.assertions
      passedSuites += 1
      console.log(`[PASS] ${result.name}`)
      console.log(`       ${result.assertions} aserciones — ${result.detail}`)
    } catch (error) {
      failures.push({ label, error })
      console.error(`[FAIL] ${label}`)
      console.error(`       ${error.stack || error.message}`)
    }
  }

  console.log('\n=================================')
  console.log(`Suites: ${passedSuites}/${suites.length} aprobadas`)
  console.log(`Aserciones aprobadas: ${totalAssertions}`)

  if (failures.length > 0) {
    console.error(`Resultado: FALLÓ (${failures.length} suite(s))`)
    process.exit(1)
  }

  console.log('Resultado: APROBADO')
  process.exit(0)
}

main().catch((error) => {
  console.error(error.stack || error.message)
  process.exit(1)
})
