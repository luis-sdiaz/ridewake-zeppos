import { getTheme, Layout, Type } from '../utils/theme'
import { t } from '../utils/i18n'
import { getRouteSteps } from '../utils/routeSimulator'
import { clearSession, getSelectedDestination, getThemeMode } from '../utils/session'
import {
  destroyHaptics,
  initHaptics,
  stopVibration,
  vibrateShort,
  vibrateWarning
} from '../utils/haptics'

let activeTheme = getTheme('light')

function getStageStyles() {
  return {
    MONITORING: {
      statusKey: 'trip_status_monitoring',
      cardColor: activeTheme.cardBg,
      accentColor: activeTheme.success,
      textColor: activeTheme.success,
      progressColor: activeTheme.success,
      haptic: null
    },
    EARLY_ALERT: {
      statusKey: 'trip_status_early',
      cardColor: activeTheme.btnSecondary,
      accentColor: activeTheme.warning,
      textColor: activeTheme.warning,
      progressColor: activeTheme.warning,
      haptic: 'short'
    },
    NEAR: {
      statusKey: 'trip_status_near',
      cardColor: activeTheme.danger,
      accentColor: activeTheme.warning,
      textColor: activeTheme.onAccent,
      progressColor: activeTheme.danger,
      haptic: 'warning'
    },
    ARRIVED: {
      statusKey: 'trip_status_arrived',
      cardColor: activeTheme.danger,
      accentColor: activeTheme.textPrimary,
      textColor: activeTheme.onAccent,
      progressColor: activeTheme.danger,
      haptic: 'warning'
    }
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
  const stageStyles = getStageStyles()
  const stage = stageStyles[routeStep.state] || stageStyles.MONITORING
  const progressWidth = Math.max(
    1,
    Math.round(Layout.contentWidth * routeStep.progress)
  )

  alertCard.setProperty(hmUI.prop.MORE, {
    x: Layout.leftMargin,
    y: Layout.y(95),
    w: Layout.contentWidth,
    h: 100,
    radius: 16,
    color: stage.cardColor
  })
  alertAccent.setProperty(hmUI.prop.MORE, {
    x: Layout.leftMargin,
    y: Layout.y(95),
    w: 5,
    h: 100,
    radius: 2,
    color: stage.accentColor
  })
  statusText.setProperty(hmUI.prop.MORE, {
    x: 28,
    y: Layout.y(112),
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
    y: Layout.y(205),
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
      y: Layout.y(360),
      w: Layout.contentWidth,
      h: 50,
      text: t('trip_btn_finish'),
      color: activeTheme.danger
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
    activeTheme = getTheme(getThemeMode())
    stageIndex = 0
    journeyCompleted = false

    const selectedDestination = getSelectedDestination() || 'home'
    routeSteps = getRouteSteps(selectedDestination)
    const destinationName = t(`dest_${selectedDestination}`)

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0,
      y: Layout.y(0),
      w: Layout.width,
      h: Layout.height,
      color: activeTheme.bg
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.leftMargin,
      y: Layout.y(35),
      w: Layout.contentWidth,
      h: 20,
      text: t('trip_title'),
      text_size: Type.body,
      color: activeTheme.accent,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.leftMargin,
      y: Layout.y(60),
      w: Layout.contentWidth,
      h: 26,
      text: destinationName,
      text_size: Type.button,
      color: activeTheme.textPrimary,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.WRAP
    })

    alertCard = hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: Layout.leftMargin,
      y: Layout.y(95),
      w: Layout.contentWidth,
      h: 100,
      radius: 16,
      color: activeTheme.cardBg
    })

    alertAccent = hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: Layout.leftMargin,
      y: Layout.y(95),
      w: 5,
      h: 100,
      radius: 2,
      color: activeTheme.success
    })

    statusText = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 28,
      y: Layout.y(112),
      w: 136,
      h: 66,
      text: t('trip_status_monitoring'),
      text_size: Type.button,
      color: activeTheme.success,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.WRAP
    })

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: Layout.leftMargin,
      y: Layout.y(205),
      w: Layout.contentWidth,
      h: 6,
      radius: 3,
      color: activeTheme.divider
    })

    progressIndicator = hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: Layout.leftMargin,
      y: Layout.y(205),
      w: Math.round(Layout.contentWidth * routeSteps[0].progress),
      h: 6,
      radius: 3,
      color: getStageStyles()[routeSteps[0].state].progressColor
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.leftMargin,
      y: Layout.y(218),
      w: Layout.contentWidth,
      h: 14,
      text: t('trip_next_stop'),
      text_size: 11,
      color: activeTheme.textSecondary,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    })

    nextStopText = hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.leftMargin,
      y: Layout.y(234),
      w: Layout.contentWidth,
      h: 20,
      text: routeSteps[0].stop,
      text_size: 13,
      color: activeTheme.textPrimary,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.WRAP
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.leftMargin,
      y: Layout.y(258),
      w: Layout.contentWidth,
      h: 14,
      text: t('trip_distance_remaining'),
      text_size: 11,
      color: activeTheme.textSecondary,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    })

    distanceText = hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.leftMargin,
      y: Layout.y(273),
      w: Layout.contentWidth,
      h: 26,
      text: routeSteps[0].distance,
      text_size: Type.brand,
      color: activeTheme.textPrimary,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.leftMargin,
      y: Layout.y(301),
      w: Layout.contentWidth,
      h: 14,
      text: t('trip_eta_remaining'),
      text_size: 11,
      color: activeTheme.textSecondary,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    })

    etaText = hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.leftMargin,
      y: Layout.y(316),
      w: Layout.contentWidth,
      h: 24,
      text: routeSteps[0].eta,
      text_size: Type.button,
      color: activeTheme.accent,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    })

    finishButton = hmUI.createWidget(hmUI.widget.BUTTON, {
      x: Layout.leftMargin,
      y: Layout.y(360),
      w: Layout.contentWidth,
      h: 50,
      radius: 25,
      normal_color: activeTheme.btnSecondary,
      press_color: activeTheme.cardBg,
      text: t('trip_btn_finish'),
      text_size: Type.button,
      color: activeTheme.textPrimary,
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
    activeTheme = getTheme('light')
  }
})
