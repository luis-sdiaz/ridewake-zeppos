import { ML_MODEL } from './mlModel'

export const PREDICTION_ALPHA = 0.45

const ROUTES = {
  Casa: {
    initialDistance: 2.4,
    initialSpeed: 12,
    descriptionKey: 'route_home',
    checkpoints: [
      { distance: 2.4, elapsedMinutes: 0, knownDelayMinutes: 0, referenceEs: 'Parque Bolívar', referenceEn: 'Bolívar Park' },
      { distance: 1.05, elapsedMinutes: 6, knownDelayMinutes: 0.6, referenceEs: 'Av. Las Américas', referenceEn: 'Americas Avenue' },
      { distance: 0.28, elapsedMinutes: 10, knownDelayMinutes: 0.2, referenceEs: 'Calle 18', referenceEn: '18th Street' },
      { distance: 0, elapsedMinutes: 12, knownDelayMinutes: 0, referenceEs: 'Casa', referenceEn: 'Home' }
    ]
  },
  Universidad: {
    initialDistance: 4.1,
    initialSpeed: 12.3,
    descriptionKey: 'route_university',
    checkpoints: [
      { distance: 4.1, elapsedMinutes: 0, knownDelayMinutes: 0, referenceEs: 'Plaza del Carnaval', referenceEn: 'Carnival Square' },
      { distance: 2.7, elapsedMinutes: 7, knownDelayMinutes: 1, referenceEs: 'Parque Infantil', referenceEn: 'Children Park' },
      { distance: 1.1, elapsedMinutes: 15, knownDelayMinutes: 0.8, referenceEs: 'Parque Nariño', referenceEn: 'Nariño Park' },
      { distance: 0.3, elapsedMinutes: 19, knownDelayMinutes: 0.2, referenceEs: 'Entrada del campus', referenceEn: 'Campus entrance' },
      { distance: 0, elapsedMinutes: 21, knownDelayMinutes: 0, referenceEs: 'Universidad', referenceEn: 'University' }
    ]
  }
}

function finitePositive(value) {
  const number = Number(value)
  return isFinite(number) && number > 0 ? number : 0
}

export function estimateSpeed(previousSpeed, observedSpeed, alpha) {
  const previous = finitePositive(previousSpeed)
  const observed = finitePositive(observedSpeed)
  const weight = Number(alpha)
  const safeAlpha = isFinite(weight) && weight > 0 && weight <= 1
    ? weight
    : PREDICTION_ALPHA
  if (!observed) return previous
  if (!previous) return observed
  return safeAlpha * observed + (1 - safeAlpha) * previous
}

export function calculateEtaMinutes(distanceKm, speedKmh) {
  const distance = Number(distanceKm)
  const speed = finitePositive(speedKmh)
  if (!isFinite(distance) || distance <= 0) return 0
  if (!speed) return null
  return distance / speed * 60
}

export function calculateSpeedVariability(speedHistory) {
  if (!speedHistory || speedHistory.length < 2) return 0
  let total = 0
  let count = 0
  for (let index = 0; index < speedHistory.length; index += 1) {
    const speed = finitePositive(speedHistory[index])
    if (speed) {
      total += speed
      count += 1
    }
  }
  if (count < 2) return 0
  const mean = total / count
  let deviation = 0
  for (let index = 0; index < speedHistory.length; index += 1) {
    const speed = finitePositive(speedHistory[index])
    if (speed) deviation += Math.abs(speed - mean)
  }
  return Math.min(1, deviation / count / mean)
}

export function predictEtaMinutes(
  distanceKm,
  speedKmh,
  progress,
  speedVariability,
  knownDelayMinutes
) {
  const fallback = calculateEtaMinutes(distanceKm, speedKmh)
  const distance = Number(distanceKm)
  const speed = Number(speedKmh)
  const routeProgress = Number(progress)
  const variability = Number(speedVariability)
  const delay = Number(knownDelayMinutes)
  if (!isFinite(distance) || distance <= 0) return 0
  if (!isFinite(speed) || speed <= 0 ||
      !isFinite(routeProgress) || routeProgress < 0 || routeProgress > 1 ||
      !isFinite(variability) || variability < 0 ||
      !isFinite(delay) || delay < 0 || fallback === null) return fallback

  const features = [
    fallback,
    distance,
    routeProgress,
    variability,
    delay,
    fallback * variability
  ]
  if (!ML_MODEL || !ML_MODEL.coefficients || !ML_MODEL.means || !ML_MODEL.scales ||
      ML_MODEL.coefficients.length !== features.length) return fallback

  let prediction = Number(ML_MODEL.intercept)
  if (!isFinite(prediction)) return fallback
  for (let index = 0; index < features.length; index += 1) {
    const scale = Number(ML_MODEL.scales[index])
    const mean = Number(ML_MODEL.means[index])
    const coefficient = Number(ML_MODEL.coefficients[index])
    if (!isFinite(scale) || scale <= 0 || !isFinite(mean) || !isFinite(coefficient)) {
      return fallback
    }
    prediction += coefficient * ((features[index] - mean) / scale)
  }
  if (!isFinite(prediction)) return fallback
  const safeMaximum = fallback * 3 + delay + 10
  return Math.max(0, Math.min(safeMaximum, prediction))
}

const STATE_RANK = {
  MONITORING: 0,
  EARLY_ALERT: 1,
  NEAR: 2,
  ARRIVED: 3
}

export function determineState(distanceKm, etaMinutes, previousState) {
  const distance = Math.max(0, Number(distanceKm) || 0)
  const eta = etaMinutes === null ? 9999 : Math.max(0, Number(etaMinutes) || 0)
  let nextState = 'MONITORING'
  if (distance <= 0.05) nextState = 'ARRIVED'
  else if (distance <= 0.35 || eta <= 2) nextState = 'NEAR'
  else if (distance <= 1.2 || eta <= 6) nextState = 'EARLY_ALERT'

  const previous = STATE_RANK[previousState] === undefined ? 0 : STATE_RANK[previousState]
  return STATE_RANK[nextState] < previous ? previousState : nextState
}

function confidenceFor(sampleCount, previousSpeed, observedSpeed) {
  if (sampleCount <= 0) return 55
  const previous = finitePositive(previousSpeed)
  const observed = finitePositive(observedSpeed)
  let stability = 0
  if (previous && observed) {
    const variation = Math.abs(observed - previous) / previous
    stability = Math.max(0, 10 - Math.round(variation * 20))
  }
  return Math.min(95, 55 + sampleCount * 8 + stability)
}

export function getRouteSummary(destination) {
  const key = destination === 'Universidad' ? 'Universidad' : 'Casa'
  const route = ROUTES[key]
  return {
    destination: key,
    initialDistance: route.initialDistance,
    initialEta: Math.round(predictEtaMinutes(
      route.initialDistance,
      route.initialSpeed,
      0,
      0,
      route.checkpoints[0].knownDelayMinutes
    )),
    descriptionKey: route.descriptionKey
  }
}

export function createPrediction(destination) {
  const key = destination === 'Universidad' ? 'Universidad' : 'Casa'
  const route = ROUTES[key]
  const checkpoint = route.checkpoints[0]
  const eta = predictEtaMinutes(
    checkpoint.distance,
    route.initialSpeed,
    0,
    0,
    checkpoint.knownDelayMinutes
  )
  return {
    destination: key,
    checkpointIndex: 0,
    initialDistance: route.initialDistance,
    remainingDistance: checkpoint.distance,
    estimatedSpeed: route.initialSpeed,
    observedSpeed: route.initialSpeed,
    speedHistory: [route.initialSpeed],
    speedVariability: 0,
    knownDelayMinutes: checkpoint.knownDelayMinutes,
    progress: 0,
    etaMinutes: eta,
    proximity: 'FAR',
    confidence: 55,
    state: 'MONITORING',
    referenceEs: checkpoint.referenceEs,
    referenceEn: checkpoint.referenceEn,
    sampleCount: 0,
    predictionSource: 'ML'
  }
}

export function advancePrediction(prediction) {
  if (!prediction || !ROUTES[prediction.destination]) return prediction
  const route = ROUTES[prediction.destination]
  const previousCheckpoint = route.checkpoints[prediction.checkpointIndex]
  const nextIndex = Math.min(prediction.checkpointIndex + 1, route.checkpoints.length - 1)
  const checkpoint = route.checkpoints[nextIndex]
  if (nextIndex === prediction.checkpointIndex) return prediction

  const elapsedHours = (checkpoint.elapsedMinutes - previousCheckpoint.elapsedMinutes) / 60
  const travelled = Math.max(0, previousCheckpoint.distance - checkpoint.distance)
  const observedSpeed = elapsedHours > 0 ? travelled / elapsedHours : 0
  const estimatedSpeed = estimateSpeed(
    prediction.estimatedSpeed,
    observedSpeed,
    PREDICTION_ALPHA
  )
  const progress = route.initialDistance > 0
    ? Math.min(1, Math.max(0, 1 - checkpoint.distance / route.initialDistance))
    : 1
  const sampleCount = prediction.sampleCount + 1
  const speedHistory = prediction.speedHistory || []
  speedHistory.push(observedSpeed)
  while (speedHistory.length > 4) speedHistory.shift()
  const speedVariability = calculateSpeedVariability(speedHistory)
  const eta = predictEtaMinutes(
    checkpoint.distance,
    estimatedSpeed,
    progress,
    speedVariability,
    checkpoint.knownDelayMinutes
  )
  const state = determineState(checkpoint.distance, eta, prediction.state)

  prediction.checkpointIndex = nextIndex
  prediction.remainingDistance = checkpoint.distance
  prediction.observedSpeed = observedSpeed
  prediction.estimatedSpeed = estimatedSpeed
  prediction.speedHistory = speedHistory
  prediction.speedVariability = speedVariability
  prediction.knownDelayMinutes = checkpoint.knownDelayMinutes
  prediction.progress = progress
  prediction.etaMinutes = eta
  prediction.proximity = state === 'ARRIVED' ? 'ARRIVED'
    : state === 'NEAR' ? 'VERY_NEAR'
      : state === 'EARLY_ALERT' ? 'NEAR' : 'FAR'
  prediction.confidence = confidenceFor(
    sampleCount,
    prediction.estimatedSpeed,
    observedSpeed
  )
  prediction.state = state
  prediction.referenceEs = checkpoint.referenceEs
  prediction.referenceEn = checkpoint.referenceEn
  prediction.sampleCount = sampleCount
  prediction.predictionSource = 'ML'
  return prediction
}

export function formatDistance(distanceKm) {
  return Number(distanceKm).toFixed(2) + ' km'
}

export function formatEta(etaMinutes) {
  if (etaMinutes === null) return '--'
  if (etaMinutes <= 0) return '0 min'
  return Math.max(1, Math.round(etaMinutes)) + ' min'
}
