const fs = require('fs')
const path = require('path')

const SEED = 20261107
const SCENARIO_COUNT = 160
const OBSERVATIONS_PER_SCENARIO = 10
const FEATURE_NAMES = [
  'baselineEtaMinutes',
  'distanceKm',
  'progress',
  'speedVariability',
  'knownDelayMinutes',
  'variabilityEtaImpact'
]

function seededRandom(seed) {
  let value = seed >>> 0
  return function () {
    value += 0x6D2B79F5
    let result = value
    result = Math.imul(result ^ result >>> 15, result | 1)
    result ^= result + Math.imul(result ^ result >>> 7, result | 61)
    return ((result ^ result >>> 14) >>> 0) / 4294967296
  }
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value))
}

function generateScenarios(seed, scenarioCount, observationsPerScenario) {
  const random = seededRandom(seed)
  const scenarios = []
  for (let scenarioId = 0; scenarioId < scenarioCount; scenarioId += 1) {
    const totalDistance = 2 + random() * 6
    const cruiseSpeed = 9 + random() * 17
    const congestion = 0.05 + random() * 0.40
    const baseVariability = 0.03 + random() * 0.32
    const plannedStopDelay = random() * 3.5
    const observations = []

    for (let step = 0; step < observationsPerScenario; step += 1) {
      const progress = 0.05 + step * 0.09
      const distanceKm = totalDistance * (1 - progress)
      const localCongestion = congestion * (0.65 + 0.35 * Math.sin(step + scenarioId))
      const speedNoise = (random() - 0.5) * 2.4
      const speedKmh = clamp(cruiseSpeed * (1 - localCongestion) + speedNoise, 4, 32)
      const speedVariability = clamp(
        baseVariability + (random() - 0.5) * 0.08,
        0,
        0.55
      )
      const knownDelayMinutes = Math.max(
        0,
        plannedStopDelay * (1 - progress) + localCongestion * 1.2
      )
      const baselineEtaMinutes = distanceKm / speedKmh * 60
      const variabilityEtaImpact = baselineEtaMinutes * speedVariability
      const measurementNoise = (random() - 0.5) * 0.6
      const remainingMinutes = Math.max(
        0,
        baselineEtaMinutes +
          0.68 * variabilityEtaImpact +
          0.92 * knownDelayMinutes -
          0.55 * progress +
          measurementNoise
      )

      observations.push({
        scenarioId,
        features: [
          baselineEtaMinutes,
          distanceKm,
          progress,
          speedVariability,
          knownDelayMinutes,
          variabilityEtaImpact
        ],
        target: remainingMinutes,
        baseline: baselineEtaMinutes
      })
    }
    scenarios.push({ id: scenarioId, observations })
  }
  return scenarios
}

function splitByScenario(scenarios) {
  const training = []
  const evaluation = []
  let trainingScenarios = 0
  let evaluationScenarios = 0
  for (const scenario of scenarios) {
    const target = scenario.id % 4 === 0 ? evaluation : training
    if (target === evaluation) evaluationScenarios += 1
    else trainingScenarios += 1
    for (const observation of scenario.observations) target.push(observation)
  }
  return { training, evaluation, trainingScenarios, evaluationScenarios }
}

function normalization(rows) {
  const means = FEATURE_NAMES.map(() => 0)
  const scales = FEATURE_NAMES.map(() => 0)
  for (const row of rows) {
    for (let index = 0; index < means.length; index += 1) {
      means[index] += row.features[index]
    }
  }
  for (let index = 0; index < means.length; index += 1) means[index] /= rows.length
  for (const row of rows) {
    for (let index = 0; index < scales.length; index += 1) {
      const difference = row.features[index] - means[index]
      scales[index] += difference * difference
    }
  }
  for (let index = 0; index < scales.length; index += 1) {
    scales[index] = Math.sqrt(scales[index] / rows.length)
    if (!isFinite(scales[index]) || scales[index] < 1e-9) scales[index] = 1
  }
  return { means, scales }
}

function solveLinearSystem(matrix, vector) {
  const size = vector.length
  const augmented = matrix.map((row, index) => row.slice().concat(vector[index]))
  for (let column = 0; column < size; column += 1) {
    let pivot = column
    for (let row = column + 1; row < size; row += 1) {
      if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivot][column])) pivot = row
    }
    const swap = augmented[column]
    augmented[column] = augmented[pivot]
    augmented[pivot] = swap
    const divisor = augmented[column][column]
    if (Math.abs(divisor) < 1e-12) throw new Error('Singular training matrix')
    for (let item = column; item <= size; item += 1) augmented[column][item] /= divisor
    for (let row = 0; row < size; row += 1) {
      if (row === column) continue
      const factor = augmented[row][column]
      for (let item = column; item <= size; item += 1) {
        augmented[row][item] -= factor * augmented[column][item]
      }
    }
  }
  return augmented.map((row) => row[size])
}

function fitLinearRegression(rows, means, scales) {
  const parameterCount = FEATURE_NAMES.length + 1
  const xtx = Array.from({ length: parameterCount }, () =>
    Array.from({ length: parameterCount }, () => 0))
  const xty = Array.from({ length: parameterCount }, () => 0)
  for (const row of rows) {
    const values = [1]
    for (let index = 0; index < FEATURE_NAMES.length; index += 1) {
      values.push((row.features[index] - means[index]) / scales[index])
    }
    for (let left = 0; left < parameterCount; left += 1) {
      xty[left] += values[left] * row.target
      for (let right = 0; right < parameterCount; right += 1) {
        xtx[left][right] += values[left] * values[right]
      }
    }
  }
  for (let index = 1; index < parameterCount; index += 1) xtx[index][index] += 1e-6
  const parameters = solveLinearSystem(xtx, xty)
  return { intercept: parameters[0], coefficients: parameters.slice(1) }
}

function predict(model, features) {
  let value = model.intercept
  for (let index = 0; index < model.coefficients.length; index += 1) {
    value += model.coefficients[index] *
      ((features[index] - model.means[index]) / model.scales[index])
  }
  return Math.max(0, value)
}

function meanAbsoluteError(rows, predictionFunction) {
  let total = 0
  for (const row of rows) total += Math.abs(predictionFunction(row) - row.target)
  return total / rows.length
}

function trainModel() {
  const scenarios = generateScenarios(SEED, SCENARIO_COUNT, OBSERVATIONS_PER_SCENARIO)
  const split = splitByScenario(scenarios)
  const stats = normalization(split.training)
  const fitted = fitLinearRegression(split.training, stats.means, stats.scales)
  const model = {
    version: 'ridewake-eta-linear-v1',
    type: 'multivariable_linear_regression',
    seed: SEED,
    featureNames: FEATURE_NAMES.slice(),
    means: stats.means,
    scales: stats.scales,
    intercept: fitted.intercept,
    coefficients: fitted.coefficients,
    metrics: {
      trainingScenarios: split.trainingScenarios,
      evaluationScenarios: split.evaluationScenarios,
      trainingExamples: split.training.length,
      evaluationExamples: split.evaluation.length,
      maeMinutes: meanAbsoluteError(split.evaluation, (row) => predict({
        intercept: fitted.intercept,
        coefficients: fitted.coefficients,
        means: stats.means,
        scales: stats.scales
      }, row.features)),
      baselineMaeMinutes: meanAbsoluteError(split.evaluation, (row) => row.baseline)
    }
  }
  return model
}

function rounded(value) {
  return Number(value.toFixed(10))
}

function serializableModel(model) {
  return {
    version: model.version,
    type: model.type,
    seed: model.seed,
    featureNames: model.featureNames,
    means: model.means.map(rounded),
    scales: model.scales.map(rounded),
    intercept: rounded(model.intercept),
    coefficients: model.coefficients.map(rounded),
    metrics: {
      trainingScenarios: model.metrics.trainingScenarios,
      evaluationScenarios: model.metrics.evaluationScenarios,
      trainingExamples: model.metrics.trainingExamples,
      evaluationExamples: model.metrics.evaluationExamples,
      maeMinutes: rounded(model.metrics.maeMinutes),
      baselineMaeMinutes: rounded(model.metrics.baselineMaeMinutes)
    }
  }
}

function modelSource(model) {
  return '/* Generado por scripts/train-ai.js con datos sintéticos reproducibles. */\n' +
    'export const ML_MODEL = ' + JSON.stringify(serializableModel(model), null, 2) + '\n'
}

function main() {
  const model = trainModel()
  if (!(model.metrics.maeMinutes < model.metrics.baselineMaeMinutes)) {
    throw new Error('The trained model did not improve the conventional baseline')
  }
  const outputPath = path.join(__dirname, '..', 'utils', 'mlModel.js')
  fs.writeFileSync(outputPath, modelSource(model), 'utf8')
  console.log(`Seed: ${model.seed}`)
  console.log(`Training: ${model.metrics.trainingExamples} examples / ${model.metrics.trainingScenarios} scenarios`)
  console.log(`Evaluation: ${model.metrics.evaluationExamples} examples / ${model.metrics.evaluationScenarios} scenarios`)
  console.log(`ML MAE: ${model.metrics.maeMinutes.toFixed(4)} min`)
  console.log(`Baseline MAE: ${model.metrics.baselineMaeMinutes.toFixed(4)} min`)
  console.log(`Model: ${outputPath}`)
}

if (require.main === module) main()

module.exports = {
  FEATURE_NAMES,
  SEED,
  generateScenarios,
  modelSource,
  serializableModel,
  splitByScenario,
  trainModel
}
