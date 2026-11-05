import { Colors, Layout, Type } from '../utils/theme'
import { t } from '../utils/i18n'
import { clearSession, getSelectedDestination } from '../utils/session'
import {
  destroyHaptics,
  initHaptics,
  vibrateShort,
  vibrateWarning
} from '../utils/haptics'

const STAGES = [
  {
    statusKey: 'trip_status_monitoring',
    distance: '3.2 km',
    eta: '12 min',
    cardColor: Colors.Navy900,
    accentColor: Colors.Mint400,
    textColor: Colors.Mint400,
    haptic: null
  },
  {
    statusKey: 'trip_status_early',
    distance: '1.5 km',
    eta: '5 min',
    cardColor: Colors.Navy700,
    accentColor: Colors.Amber400,
    textColor: Colors.Amber400,
    haptic: 'short'
  },
  {
    statusKey: 'trip_status_near',
    distance: '0.3 km',
    eta: '1 min',
    cardColor: Colors.Coral400,
    accentColor: Colors.Amber400,
    textColor: Colors.Ink,
    haptic: 'warning'
  },
  {
    statusKey: 'trip_status_arrived',
    distance: '0.0 km',
    etaKey: 'trip_now',
    cardColor: Colors.Coral400,
    accentColor: Colors.White,
    textColor: Colors.Ink,
    haptic: 'warning'
  }
]

let simulationTimer = null
let stageIndex = 0
let alertCard = null
let alertAccent = null
let statusText = null
let distanceText = null
let etaText = null
let finishButton = null

function stopSimulation() {
  if (simulationTimer !== null) {
    timer.stopTimer(simulationTimer)
    simulationTimer = null
  }
}

function updateTripUi(shouldVibrate) {
  const stage = STAGES[stageIndex]

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
  distanceText.setProperty(hmUI.prop.TEXT, stage.distance)
  etaText.setProperty(
    hmUI.prop.TEXT,
    stage.etaKey ? t(stage.etaKey) : stage.eta
  )

  if (stageIndex === STAGES.length - 1) {
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
}

function advanceSimulation() {
  if (stageIndex >= STAGES.length - 1) {
    stopSimulation()
    return
  }

  stageIndex += 1
  updateTripUi(true)

  if (stageIndex === STAGES.length - 1) stopSimulation()
}

Page({
  build() {
    initHaptics()
    stageIndex = 0

    const selectedDestination = getSelectedDestination() || 'home'
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

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.leftMargin,
      y: 215,
      w: Layout.contentWidth,
      h: 16,
      text: t('trip_distance_remaining'),
      text_size: 11,
      color: Colors.Slate350,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    })

    distanceText = hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.leftMargin,
      y: 234,
      w: Layout.contentWidth,
      h: 36,
      text: STAGES[0].distance,
      text_size: Type.headline,
      color: Colors.White,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.leftMargin,
      y: 276,
      w: Layout.contentWidth,
      h: 16,
      text: t('trip_eta_remaining'),
      text_size: 11,
      color: Colors.Slate350,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    })

    etaText = hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.leftMargin,
      y: 294,
      w: Layout.contentWidth,
      h: 30,
      text: STAGES[0].eta,
      text_size: Type.brand,
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
        clearSession()
        hmApp.gotoPage({ url: 'page/index' })
      }
    })

    updateTripUi(false)
    simulationTimer = timer.createTimer(4000, 4000, advanceSimulation, {})
  },

  onDestroy() {
    stopSimulation()
    destroyHaptics()
    alertCard = null
    alertAccent = null
    statusText = null
    distanceText = null
    etaText = null
    finishButton = null
  }
})
