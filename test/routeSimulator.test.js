const assert = require('assert').strict
const fs = require('fs')
const path = require('path')

const predictionPath = path.join(__dirname, '..', 'utils', 'prediction.js')
const modelPath = path.join(__dirname, '..', 'utils', 'mlModel.js')
const training = require('../scripts/train-ai.js')

async function loadPrediction() {
  const modelSource = fs.readFileSync(modelPath, 'utf8')
  const modelUrl = `data:text/javascript;base64,${Buffer.from(modelSource).toString('base64')}`
  const source = fs.readFileSync(predictionPath, 'utf8')
    .replace("'./mlModel'", `'${modelUrl}'`)
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
}

async function loadModel() {
  const source = fs.readFileSync(modelPath, 'utf8')
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
}

async function run() {
  let assertions = 0
  const check = (condition, message) => {
    assertions += 1
    assert.ok(condition, message)
  }
  const prediction = await loadPrediction()
  const exported = await loadModel()
  const firstTraining = training.serializableModel(training.trainModel())
  const secondTraining = training.serializableModel(training.trainModel())
  const groupedSplit = training.splitByScenario(
    training.generateScenarios(training.SEED, 160, 10)
  )
  const trainingIds = new Set(groupedSplit.training.map((row) => row.scenarioId))
  const evaluationIds = new Set(groupedSplit.evaluation.map((row) => row.scenarioId))

  assertions += 1
  assert.deepStrictEqual(firstTraining, secondTraining,
    'El entrenamiento no es reproducible con la misma semilla')
  assertions += 1
  assert.deepStrictEqual(exported.ML_MODEL, firstTraining,
    'Los parámetros exportados no corresponden al entrenamiento reproducido')
  check([...trainingIds].every((id) => !evaluationIds.has(id)),
    'Un escenario aparece a la vez en entrenamiento y evaluación')
  check(exported.ML_MODEL.type === 'multivariable_linear_regression',
    'El artefacto no identifica el tipo de modelo')
  check(exported.ML_MODEL.coefficients.length === 6,
    'Se esperaban seis coeficientes aprendidos más intercepto')
  check(exported.ML_MODEL.metrics.trainingExamples === 1200 &&
    exported.ML_MODEL.metrics.evaluationExamples === 400,
  'La división de datos no coincide con el entrenamiento')
  check(exported.ML_MODEL.metrics.maeMinutes < exported.ML_MODEL.metrics.baselineMaeMinutes,
    'El modelo no mejora el MAE de referencia')

  check(prediction.PREDICTION_ALPHA === 0.45, 'Alpha debe estar documentado en 0.45')
  check(Math.abs(prediction.estimateSpeed(10, 20, 0.45) - 14.5) < 0.0001,
    'El suavizado exponencial es incorrecto')
  check(prediction.calculateEtaMinutes(2, 10) === 12, 'ETA distancia/velocidad incorrecta')
  check(prediction.calculateEtaMinutes(2, 0) === null, 'Debe evitar división por cero')
  const mlEtaA = prediction.predictEtaMinutes(2, 12, 0.3, 0.05, 0)
  const mlEtaB = prediction.predictEtaMinutes(2, 12, 0.3, 0.35, 2)
  check(isFinite(mlEtaA) && mlEtaA >= 0, 'La inferencia debe ser finita y no negativa')
  check(mlEtaB > mlEtaA, 'Entradas diferentes deben producir predicciones diferentes')
  check(prediction.predictEtaMinutes(2, 0, 0.3, 0.1, 0) === null,
    'Una velocidad inválida debe usar el fallback convencional')
  const alertEta = prediction.predictEtaMinutes(2, 24, 0.5, 0.05, 0)
  check(prediction.determineState(2, alertEta, 'MONITORING') === 'EARLY_ALERT',
    'La alerta no depende de la ETA inferida')
  check(prediction.determineState(0.2, 8, 'MONITORING') === 'NEAR', 'Regla NEAR incorrecta')
  check(prediction.determineState(2, 5, 'MONITORING') === 'EARLY_ALERT',
    'Regla EARLY_ALERT incorrecta')
  check(prediction.determineState(2, 12, 'NEAR') === 'NEAR',
    'El estado no debe retroceder por fluctuaciones')

  for (const destination of ['Casa', 'Universidad']) {
    const summary = prediction.getRouteSummary(destination)
    const engine = prediction.createPrediction(destination)
    const states = [engine.state]
    const distances = [engine.remainingDistance]
    const etas = [engine.etaMinutes]
    check(engine.predictionSource === 'ML', `${destination}: no inició con inferencia ML`)
    while (engine.state !== 'ARRIVED') {
      prediction.advancePrediction(engine)
      states.push(engine.state)
      distances.push(engine.remainingDistance)
      etas.push(engine.etaMinutes)
    }
    check(summary.initialDistance === (destination === 'Casa' ? 2.4 : 4.1),
      `${destination}: distancia inicial incorrecta`)
    check(summary.initialEta === (destination === 'Casa' ? 12 : 20),
      `${destination}: ETA inicial incorrecta`)
    check(states.includes('MONITORING') && states.includes('EARLY_ALERT') &&
      states.includes('NEAR') && states.includes('ARRIVED'),
    `${destination}: no demuestra los cuatro estados`)
    check(distances.every((value, index) => index === 0 || value < distances[index - 1]),
      `${destination}: la distancia no disminuye`)
    check(etas[etas.length - 1] === 0, `${destination}: la ETA final no es cero`)
    check(engine.confidence > 55 && engine.confidence <= 95,
      `${destination}: confianza fuera de rango`)
    check(engine.estimatedSpeed > 0, `${destination}: velocidad estimada inválida`)
    check(engine.predictionSource === 'ML' && isFinite(engine.speedVariability),
      `${destination}: no conservó variables de inferencia ML`)
  }

  return {
    name: 'Motor predictivo adaptativo',
    assertions,
    detail: 'Entrenamiento reproducible, parámetros exportados, MAE, inferencia y alertas validados'
  }
}

if (require.main === module) {
  run().then((result) => console.log(`PASS ${result.name}: ${result.assertions} aserciones`))
    .catch((error) => { console.error(error); process.exitCode = 1 })
}

module.exports = { run }
