import { getHapticMode } from './session'

let vibrator = null
let stopTimerId = null

export function initHaptics() {
  if (!vibrator) {
    vibrator = hmSensor.createSensor(hmSensor.id.VIBRATE)
  }
}

export function stopVibration() {
  if (stopTimerId !== null) {
    try {
      timer.stopTimer(stopTimerId)
    } catch (error) {
      console.log('Unable to stop haptic timer')
    }
    stopTimerId = null
  }

  if (vibrator) {
    try {
      vibrator.stop()
    } catch (error) {
      console.log('Unable to stop vibration')
    }
  }
}

export function vibrateShort() {
  initHaptics()
  const duration = getHapticMode() === 'strong' ? 180 : 90

  stopVibration()
  vibrator.scene = 1
  vibrator.start()

  stopTimerId = timer.createTimer(duration, 2147483647, function () {
    stopVibration()
  }, {})
}

export function vibrateWarning() {
  initHaptics()
  const duration = getHapticMode() === 'strong' ? 650 : 400

  stopVibration()
  vibrator.scene = 5
  vibrator.start()

  stopTimerId = timer.createTimer(duration, 2147483647, function () {
    stopVibration()
  }, {})
}

export function destroyHaptics() {
  stopVibration()
  vibrator = null
}
