import { getLanguage, t } from '../utils/i18n'
import { finishTripSession, getGlobalState, getSelectedDestination, startTripSession } from '../utils/session'
import { advancePrediction, createPrediction, formatDistance, formatEta } from '../utils/prediction'
import { destroyHaptics, vibrateForState } from '../utils/haptics'
import { layoutValue } from '../utils/layout'
import { createPageBackground, getActiveTheme } from '../utils/theme'
import { createNativeTimer, stopNativeTimer } from '../utils/nativeTimer'

// Zepp OS 1.0: milliseconds per existing checkpoint, not real travel time.
const DEMO_CHECKPOINT_MS = 10000
const STATES = ['MONITORING', 'EARLY_ALERT', 'NEAR', 'ARRIVED']
const STATE_KEYS = ['state_monitoring', 'state_early', 'state_near', 'state_arrived']

let pageAlive = false
let tripStopped = false
let navigationLocked = false
let runId = null
let timerId = null
let timerGeneration = 0
let prediction = null
let alertedStates = {}
let statusWidget = null
let distanceWidget = null
let etaWidget = null
let referenceWidget = null
let simulationWidget = null
let progressDots = []
let progressLines = []

function ownsSession() {
  return getGlobalState().tripRunId === runId
}

function stateColor(state) {
  const theme = getActiveTheme()
  if (state === 'ARRIVED') return theme.accent
  if (state === 'NEAR') return theme.alertNear
  if (state === 'EARLY_ALERT') return theme.alertEarly
  return theme.btnSecondaryText
}

function updateWidget(widget, properties) {
  if (!pageAlive || !widget || typeof widget.setProperty !== 'function' ||
      !hmUI.prop || hmUI.prop.MORE === undefined) return
  try {
    widget.setProperty(hmUI.prop.MORE, properties)
  } catch (error) {
    console.log('RideWake Viaje: widget update failed')
  }
}

function distanceText() {
  const text = formatDistance(prediction.remainingDistance)
  return getLanguage() === 'es' ? text.replace('.', ',') : text
}

function renderPrediction() {
  if (!pageAlive || !prediction) return
  const stage = STATES.indexOf(prediction.state)
  const theme = getActiveTheme()
  updateWidget(statusWidget, { text: t(STATE_KEYS[stage]), color: stateColor(prediction.state) })
  updateWidget(distanceWidget, { text: distanceText() })
  updateWidget(etaWidget, { text: t('trip_eta') + formatEta(prediction.etaMinutes) })
  updateWidget(referenceWidget, {
    text: getLanguage() === 'en' ? prediction.referenceEn : prediction.referenceEs
  })
  for (let index = 0; index < progressDots.length; index += 1) {
    const size = index === stage ? 16 : 10
    // FILL_RECT MORE requires the full geometry on Zepp OS 1.0.
    updateWidget(progressDots[index], {
      x: 36 + index * 40 - size / 2,
      y: layoutValue(216, 306) - size / 2,
      w: size, h: size, radius: size / 2,
      color: index === stage ? stateColor(prediction.state)
        : index < stage ? theme.accent : theme.textSecondary
    })
    if (index < progressLines.length) {
      updateWidget(progressLines[index], {
        x: 44 + index * 40, y: layoutValue(215, 305), w: 24, h: 2,
        color: index < stage ? theme.accent : theme.textSecondary
      })
    }
  }
}

function stopAutoAdvance() {
  timerGeneration += 1 // Invalidate callbacks already queued by the firmware.
  const pendingId = timerId
  timerId = null
  if (pendingId === null || pendingId === undefined) return
  try {
    stopNativeTimer(pendingId)
  } catch (error) {
    timerId = pendingId // Retry native cleanup on FINALIZAR/onDestroy if it failed.
    console.log('RideWake Viaje: ' + error.code + ' ' + String(error))
  }
}

function advanceTrip() {
  if (!pageAlive || tripStopped || !prediction || prediction.state === 'ARRIVED') return
  if (!ownsSession() || !getGlobalState().tripActive) {
    stopAutoAdvance()
    tripStopped = true
    return
  }
  advancePrediction(prediction)
  console.log('RideWake Viaje: checkpoint=' + prediction.checkpointIndex +
    ' state=' + prediction.state)
  renderPrediction()
  if (prediction.state !== 'MONITORING' && !alertedStates[prediction.state]) {
    alertedStates[prediction.state] = true
    vibrateForState(prediction.state)
  }
  if (prediction.state === 'ARRIVED') stopAutoAdvance()
}

function startAutoAdvance() {
  if (!pageAlive || tripStopped || timerId !== null || prediction.state === 'ARRIVED') return
  try {
    const generation = ++timerGeneration
    timerId = createNativeTimer(DEMO_CHECKPOINT_MS, DEMO_CHECKPOINT_MS, function () {
      if (generation !== timerGeneration) return
      advanceTrip()
    })
  } catch (error) {
    stopAutoAdvance()
    tripStopped = true
    const code = error.code || 'T02'
    updateWidget(statusWidget, { text: t('trip_paused'), color: getActiveTheme().alertEarly })
    updateWidget(simulationWidget, { text: t('trip_timer_error') + code })
    console.log('RideWake Viaje: ' + code + ' ' + String(error))
  }
}

function finishTrip() {
  if (!pageAlive || navigationLocked) return
  navigationLocked = true
  tripStopped = true
  stopAutoAdvance()
  if (ownsSession()) finishTripSession()
  destroyHaptics()
  try {
    if (typeof hmApp !== 'undefined' && typeof hmApp.gotoPage === 'function') {
      hmApp.gotoPage({ url: 'page/index' })
      return
    }
  } catch (error) {
    console.log('RideWake Viaje: finish navigation failed')
  }
  // Retry navigation without restarting the finished simulation.
  navigationLocked = false
}

function createText(y, h, size, text, color, wrap) {
  return hmUI.createWidget(hmUI.widget.TEXT, {
    x: 12, y: y, w: 168, h: h, text: text, text_size: size, color: color,
    align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    text_style: wrap ? hmUI.text_style.WRAP : hmUI.text_style.NONE
  })
}

Page({
  build() {
    if (pageAlive) return
    pageAlive = true
    tripStopped = false
    navigationLocked = false
    alertedStates = {}
    if (!getGlobalState().tripActive) startTripSession()
    runId = getGlobalState().tripRunId
    const theme = getActiveTheme()
    createPageBackground()
    const destination = getSelectedDestination() || 'Casa'
    prediction = createPrediction(destination)

    createText(layoutValue(20, 38), layoutValue(22, 26), layoutValue(17, 19),
      t('trip_title'), theme.title)
    statusWidget = createText(layoutValue(80, 120), layoutValue(20, 24), layoutValue(14, 16),
      '', theme.btnSecondaryText)
    createText(layoutValue(104, 152), layoutValue(20, 26), layoutValue(17, 19),
      getLanguage() === 'en' ? (destination === 'Casa' ? 'Home' : 'University') : destination,
      theme.textPrimary)
    distanceWidget = createText(layoutValue(132, 194), layoutValue(36, 44), layoutValue(30, 36),
      '', theme.textPrimary)
    etaWidget = createText(layoutValue(170, 242), layoutValue(24, 32), layoutValue(18, 22),
      '', theme.btnSecondaryText)

    for (let index = 0; index < 4; index += 1) {
      progressDots.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: 28 + index * 40, y: layoutValue(208, 298), w: 16, h: 16,
        radius: 8, color: theme.textSecondary
      }))
      if (index < 3) {
        progressLines.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: 44 + index * 40, y: layoutValue(215, 305), w: 24, h: 2,
          color: theme.textSecondary
        }))
      }
    }
    referenceWidget = createText(layoutValue(232, 330), layoutValue(34, 40), layoutValue(12, 14),
      '', theme.textSecondary, true)
    simulationWidget = createText(layoutValue(270, 378), layoutValue(14, 18), 11,
      t('trip_local_data'), theme.textSecondary)
    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: 24, y: layoutValue(292, 408), w: 144, h: layoutValue(42, 52),
      radius: layoutValue(21, 26), normal_color: theme.btnSecondary,
      press_color: theme.btnSecondaryPress, text: t('trip_finish'),
      text_size: layoutValue(14, 16), color: theme.btnSecondaryText,
      click_func: finishTrip
    })
    renderPrediction()
    startAutoAdvance()
  },

  onDestroy() {
    pageAlive = false
    tripStopped = true
    stopAutoAdvance()
    if (ownsSession()) finishTripSession()
    destroyHaptics()
    prediction = null
    statusWidget = null
    distanceWidget = null
    etaWidget = null
    referenceWidget = null
    simulationWidget = null
    progressDots = []
    progressLines = []
  }
})
