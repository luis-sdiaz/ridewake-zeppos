import { getVibrationIntensity, isVibrationEnabled } from './session'

let vibrator = null

function getVibrator() {
  if (vibrator) return vibrator
  try {
    if (typeof hmSensor !== 'undefined' && hmSensor.id &&
        hmSensor.id.VIBRATE !== undefined &&
        typeof hmSensor.createSensor === 'function') {
      vibrator = hmSensor.createSensor(hmSensor.id.VIBRATE)
    }
  } catch (error) {
    console.log('RideWake: VIBRATE sensor unavailable')
  }
  return vibrator
}

export function vibrateForState(state) {
  if (!isVibrationEnabled()) return false
  if (state !== 'EARLY_ALERT' && state !== 'NEAR' && state !== 'ARRIVED') {
    return false
  }

  const sensor = getVibrator()
  if (!sensor || typeof sensor.stop !== 'function' ||
      typeof sensor.start !== 'function') return false

  let scene = 25
  if (state === 'EARLY_ALERT') {
    scene = getVibrationIntensity() === 'strong' ? 24 : 23
  }

  try {
    sensor.stop()
    sensor.scene = scene
    sensor.start()
    return true
  } catch (error) {
    console.log('RideWake: vibration failed')
    return false
  }
}

export function stopVibration() {
  if (!vibrator) return
  try {
    if (typeof vibrator.stop === 'function') vibrator.stop()
  } catch (error) {
    console.log('RideWake: vibration stop failed')
  }
}

export function destroyHaptics() {
  stopVibration()
  vibrator = null
}
