/* Generado por scripts/train-ai.js con datos sintéticos reproducibles. */
export const ML_MODEL = {
  "version": "ridewake-eta-linear-v1",
  "type": "multivariable_linear_regression",
  "seed": 20261107,
  "featureNames": [
    "baselineEtaMinutes",
    "distanceKm",
    "progress",
    "speedVariability",
    "knownDelayMinutes",
    "variabilityEtaImpact"
  ],
  "means": [
    12.403868938,
    2.6993651181,
    0.455,
    0.1933728605,
    1.1975838615,
    2.3377345311
  ],
  "scales": [
    9.6165396154,
    1.6452008122,
    0.2585053191,
    0.0964831825,
    0.8071430097,
    2.321580101
  ],
  "intercept": 14.8476071119,
  "coefficients": [
    9.6122960113,
    0.0134109574,
    -0.1338735931,
    0.0067535217,
    0.7435532201,
    1.575061469
  ],
  "metrics": {
    "trainingScenarios": 120,
    "evaluationScenarios": 40,
    "trainingExamples": 1200,
    "evaluationExamples": 400,
    "maeMinutes": 0.1525006623,
    "baselineMaeMinutes": 2.2121878183
  }
}
