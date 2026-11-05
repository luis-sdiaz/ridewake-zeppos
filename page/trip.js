import { Colors, Layout, Type } from '../utils/theme'
import { t } from '../utils/i18n'
import { getRouteSteps } from '../utils/routeSimulator'
import { clearSession, getSelectedDestination } from '../utils/session'
import {
  destroyHaptics,
  initHaptics,
  stopVibration,
  vibrateShort,
  vibrateWarning
} from '../utils/haptics'

const STAGE_STYLES = {
  MONITORING: {
    statusKey: 'trip_status_monitoring',
    cardColor: Colors.Navy900,
    accentColor: Colors.Mint400,
    textColor: Colors.Mint400,
    progressColor: Colors.Mint400,
    haptic: null
  },
  EARLY_ALERT: {
    statusKey: 'trip_status_early',
    cardColor: Colors.Navy700,
    accentColor: Colors.Amber400,
    textColor: Colors.Amber400,
    progressColor: Colors.Amber400,
    haptic: 'short'
  },
  NEAR: {
    statusKey: 'trip_status_near',
    cardColor: Colors.Coral400,
    accentColor: Colors.Amber400,
    textColor: Colors.Ink,
    progressColor: Colors.Coral400,
    haptic: 'warning'
  },
  ARRIVED: {
    statusKey: 'trip_status_arrived',
    cardColor: Colors.Coral400,
    accentColor: Colors.White,
    textColor: Colors.Ink,
    progressColor: Colors.Coral400,
    haptic: 'warning'
  }
}

let timerId = null
let stageIndex = 0
let journeyCompleted = false
let routeSteps = []
let alertCard = null
let alertAccent = null
let statusText = null
let progressIndicator = null
let nextStopText = null
let distanceText = null
let etaText = null
let finishButton = null

function stopSimulation() {
  if (timerId !== null) {
    try {
      timer.stopTimer(timerId)
    } catch (error) {
      console.log('Unable to stop trip timer')
    }
    timerId = null
  }
}

function keepScreenAwakeForAlert() {
  try {
    if (typeof hmSetting !== 'undefined' && hmSetting.setBrightScreen) {
      hmSetting.setBrightScreen(30)
    }
  } catch (error) {
    console.log('Bright screen control unavailable')
  }
}

function updateTripUi(shouldVibrate) {
  const routeStep = routeSteps[stageIndex]
  const stage = STAGE_STYLES[routeStep.state] || STAGE_STYLES.MONITORING
  const progressWidth = Math.max(
    1,
    Math.round(Layout.contentWidth * routeStep.progress)
  )

  alertCard.setProperty(hmUI.prop.MORE, {
    x: Layout.leftMargin,
    y: 95,
    w: Layout.contentWidth,
    h: 100,
    radius: 16,
    color: stage.cardColor
  })
  alertAccent.setProperty(hmUI.prop.MORE, {
    x: Layout.leftMargin,
    y: 95,
    w: 5,
    h: 100,
    radius: 2,
    color: stage.accentColor
  })
  statusText.setProperty(hmUI.prop.MORE, {
    x: 28,
    y: 112,
    w: 136,
    h: 66,
    text: t(stage.statusKey),
    text_size: Type.button,
    color: stage.textColor,
    align_h: hmUI.align.CENTER_H,
    align_v: hmUI.align.CENTER_V,
    text_style: hmUI.text_style.WRAP
  })
  progressIndicator.setProperty(hmUI.prop.MORE, {
    x: Layout.leftMargin,
    y: 205,
    w: progressWidth,
    h: 6,
    radius: 3,
    color: stage.progressColor
  })
  nextStopText.setProperty(hmUI.prop.TEXT, routeStep.stop)
  distanceText.setProperty(hmUI.prop.TEXT, routeStep.distance)
  etaText.setProperty(
    hmUI.prop.TEXT,
    routeStep.state === 'ARRIVED' ? t('trip_now') : routeStep.eta
  )

  if (stageIndex === routeSteps.length - 1) {
    finishButton.setProperty(hmUI.prop.MORE, {
      x: Layout.leftMargin,
      y: 360,
      w: Layout.contentWidth,
      h: 50,
      text: t('trip_btn_finish'),
      color: Colors.Coral400
    })
  }

  if (shouldVibrate && stage.haptic === 'short') vibrateShort()
  if (shouldVibrate && stage.haptic === 'warning') vibrateWarning()
  if (routeStep.state === 'NEAR' || routeStep.state === 'ARRIVED') {
    keepScreenAwakeForAlert()
  }
}

function advanceSimulation() {
  if (stageIndex >= routeSteps.length - 1) {
    stopSimulation()
    return
  }

  stageIndex += 1
  updateTripUi(true)

  if (stageIndex === routeSteps.length - 1) {
    journeyCompleted = true
    stopSimulation()
  }
}

Page({
  build() {
    initHaptics()
    stageIndex = 0
    journeyCompleted = false

    const selectedDestination = getSelectedDestination() || 'home'
    routeSteps = getRouteSteps(selectedDestination)
    const destinationName = t(`dest_${selectedDestination}`)

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0,
      y: 0,
      w: Layout.width,
      h: Layout.height,
      color: Colors.Navy950
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.leftMargin,
      y: 35,
      w: Layout.contentWidth,
      h: 20,
      text: t('trip_title'),
      text_size: Type.body,
      color: Colors.Cyan500,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.leftMargin,
      y: 60,
      w: Layout.contentWidth,
      h: 26,
      text: destinationName,
      text_size: Type.button,
      color: Colors.White,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.WRAP
    })

    alertCard = hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: Layout.leftMargin,
      y: 95,
      w: Layout.contentWidth,
      h: 100,
      radius: 16,
      color: Colors.Navy900
    })

    alertAccent = hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: Layout.leftMargin,
      y: 95,
      w: 5,
      h: 100,
      radius: 2,
      color: Colors.Mint400
    })

    statusText = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 28,
      y: 112,
      w: 136,
      h: 66,
      text: t('trip_status_monitoring'),
      text_size: Type.button,
      color: Colors.Mint400,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.WRAP
    })

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: Layout.leftMargin,
      y: 205,
      w: Layout.contentWidth,
      h: 6,
      radius: 3,
      color: Colors.Navy700
    })

    progressIndicator = hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: Layout.leftMargin,
      y: 205,
      w: Math.round(Layout.contentWidth * routeSteps[0].progress),
      h: 6,
      radius: 3,
      color: STAGE_STYLES[routeSteps[0].state].progressColor
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.leftMargin,
      y: 218,
      w: Layout.contentWidth,
      h: 14,
      text: t('trip_next_stop'),
      text_size: 11,
      color: Colors.Slate350,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    })

    nextStopText = hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.leftMargin,
      y: 234,
      w: Layout.contentWidth,
      h: 20,
      text: routeSteps[0].stop,
      text_size: 13,
      color: Colors.White,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.WRAP
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.leftMargin,
      y: 258,
      w: Layout.contentWidth,
      h: 14,
      text: t('trip_distance_remaining'),
      text_size: 11,
      color: Colors.Slate350,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    })

    distanceText = hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.leftMargin,
      y: 273,
      w: Layout.contentWidth,
      h: 26,
      text: routeSteps[0].distance,
      text_size: Type.brand,
      color: Colors.White,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.leftMargin,
      y: 301,
      w: Layout.contentWidth,
      h: 14,
      text: t('trip_eta_remaining'),
      text_size: 11,
      color: Colors.Slate350,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    })

    etaText = hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.leftMargin,
      y: 316,
      w: Layout.contentWidth,
      h: 24,
      text: routeSteps[0].eta,
      text_size: Type.button,
      color: Colors.Cyan500,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    })

    finishButton = hmUI.createWidget(hmUI.widget.BUTTON, {
      x: Layout.leftMargin,
      y: 360,
      w: Layout.contentWidth,
      h: 50,
      radius: 25,
      normal_color: Colors.Navy700,
      press_color: Colors.DisabledSurface,
      text: t('trip_btn_finish'),
      text_size: Type.button,
      color: Colors.White,
      click_func() {
        vibrateShort()
        stopSimulation()
        journeyCompleted = true
        clearSession()
        hmApp.gotoPage({ url: 'page/index' })
      }
    })

    updateTripUi(false)
    timerId = timer.createTimer(4000, 4000, advanceSimulation, {})
  },

  onDestroy() {
    stopSimulation()
    stopVibration()
    if (!journeyCompleted) clearSession()
    destroyHaptics()
    alertCard = null
    alertAccent = null
    statusText = null
    progressIndicator = null
    nextStopText = null
    distanceText = null
    etaText = null
    finishButton = null
    routeSteps = []
  }
})
