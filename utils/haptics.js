let vibrator = null
let stopTimerId = null

export function initHaptics() {
  if (!vibrator) {
    vibrator = hmSensor.createSensor(hmSensor.id.VIBRATE)
  }
}

export function vibrateShort() {
  initHaptics()

  if (stopTimerId !== null) {
    timer.stopTimer(stopTimerId)
    stopTimerId = null
  }

  vibrator.stop()
  vibrator.scene = 1
  vibrator.start()

  stopTimerId = timer.createTimer(100, 2147483647, function () {
    vibrator.stop()
    timer.stopTimer(stopTimerId)
    stopTimerId = null
  }, {})
}

export function destroyHaptics() {
  if (stopTimerId !== null) {
    timer.stopTimer(stopTimerId)
    stopTimerId = null
  }

  if (vibrator) vibrator.stop()
  vibrator = null
}
