import { getLanguage, t } from '../utils/i18n'
import { finishTripSession, getSelectedDestination } from '../utils/session'
import {
  advancePrediction,
  createPrediction,
  formatDistance,
  formatEta
} from '../utils/prediction'
import { destroyHaptics, vibrateForState } from '../utils/haptics'
import { layoutValue } from '../utils/layout'

let pageAlive = false
let navigationLocked = false
let prediction = null
let lastAlertedState = 'MONITORING'
let statusWidget = null
let distanceWidget = null
let etaWidget = null
let referenceWidget = null
let reasonWidget = null
let confidenceWidget = null

function stateText(state) {
  if (state === 'ARRIVED') return t('state_arrived')
  if (state === 'NEAR') return t('state_near')
  if (state === 'EARLY_ALERT') return t('state_early')
  return t('state_monitoring')
}

function reasonText(state) {
  if (state === 'ARRIVED') return t('reason_arrived')
  if (state === 'NEAR') return t('reason_near')
  if (state === 'EARLY_ALERT') return t('reason_early')
  return t('reason_monitoring')
}

function stateColor(state) {
  if (state === 'ARRIVED' || state === 'NEAR') return 0xff6b6b
  if (state === 'EARLY_ALERT') return 0xffc857
  return 0x72edf2
}

function setText(widget, text) {
  if (!pageAlive || !widget || typeof widget.setProperty !== 'function' ||
      typeof hmUI === 'undefined' || !hmUI.prop) return
  try {
    if (hmUI.prop.TEXT !== undefined) widget.setProperty(hmUI.prop.TEXT, text)
    else if (hmUI.prop.MORE !== undefined) widget.setProperty(hmUI.prop.MORE, { text: text })
  } catch (error) {
    console.log('RideWake Viaje: text update failed')
  }
}

function renderPrediction() {
  if (!pageAlive || !prediction) return
  try {
    if (statusWidget && typeof statusWidget.setProperty === 'function' &&
        hmUI.prop && hmUI.prop.MORE !== undefined) {
      statusWidget.setProperty(hmUI.prop.MORE, {
        text: stateText(prediction.state),
        color: stateColor(prediction.state)
      })
    }
  } catch (error) {
    console.log('RideWake Viaje: state update failed')
  }
  setText(distanceWidget, t('trip_distance') + formatDistance(prediction.remainingDistance))
  setText(etaWidget, t('trip_eta') + formatEta(prediction.etaMinutes))
  setText(referenceWidget, t('trip_next') +
    (getLanguage() === 'en' ? prediction.referenceEn : prediction.referenceEs))
  setText(reasonWidget, reasonText(prediction.state))
  setText(confidenceWidget, t('trip_confidence') + prediction.confidence + '% · ' +
    Math.round(prediction.estimatedSpeed * 10) / 10 + ' km/h')
}

function advanceTrip() {
  if (!pageAlive || !prediction || prediction.state === 'ARRIVED') return
  const previousState = prediction.state
  advancePrediction(prediction)
  renderPrediction()
  if (prediction.state !== previousState && prediction.state !== lastAlertedState) {
    vibrateForState(prediction.state)
    lastAlertedState = prediction.state
  }
}

function finishTrip() {
  if (!pageAlive || navigationLocked) return
  navigationLocked = true
  finishTripSession()
  destroyHaptics()
  try {
    if (typeof hmApp !== 'undefined' && typeof hmApp.gotoPage === 'function') {
      hmApp.gotoPage({ url: 'page/index' })
      return
    }
  } catch (error) {
    console.log('RideWake Viaje: finish navigation failed')
  }
  navigationLocked = false
}

Page({
  build() {
    pageAlive = true
    navigationLocked = false
    lastAlertedState = 'MONITORING'
    const destination = getSelectedDestination() || 'Casa'
    prediction = createPrediction(destination)

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(24, 38), w: 168, h: layoutValue(24, 26),
      text: t('trip_title'), text_size: layoutValue(19, 20), color: 0x35dce8,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(94, 120), w: 168, h: layoutValue(20, 24),
      text: getLanguage() === 'en' && destination === 'Casa' ? 'Home' :
        getLanguage() === 'en' && destination === 'Universidad' ? 'University' : destination,
      text_size: layoutValue(15, 17), color: 0xffffff,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })

    statusWidget = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(54, 72), w: 168, h: layoutValue(32, 40),
      text: stateText(prediction.state), text_size: layoutValue(13, 16), color: stateColor(prediction.state),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.WRAP
    })

    distanceWidget = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(120, 158), w: 168, h: layoutValue(22, 30),
      text: t('trip_distance') + formatDistance(prediction.remainingDistance),
      text_size: layoutValue(17, 20), color: 0xffffff,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })

    etaWidget = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(148, 204), w: 168, h: layoutValue(28, 36),
      text: t('trip_eta') + formatEta(prediction.etaMinutes),
      text_size: layoutValue(21, 24), color: 0x72edf2,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })

    referenceWidget = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(182, 254), w: 168, h: layoutValue(24, 34),
      text: t('trip_next') +
        (getLanguage() === 'en' ? prediction.referenceEn : prediction.referenceEs),
      text_size: layoutValue(12, 14), color: 0xb5c6c8,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.WRAP
    })

    reasonWidget = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(210, 302), w: 168, h: layoutValue(24, 42),
      text: reasonText(prediction.state), text_size: layoutValue(12, 13), color: 0xffffff,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.WRAP
    })

    confidenceWidget = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(236, 350), w: 168, h: layoutValue(16, 20),
      text: t('trip_confidence') + prediction.confidence + '% · ' +
        prediction.estimatedSpeed + ' km/h',
      text_size: layoutValue(11, 12), color: 0xb5c6c8,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(254, 376), w: 168, h: layoutValue(14, 18),
      text: t('trip_demo'), text_size: layoutValue(11, 12), color: 0xb5c6c8,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })

    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: layoutValue(20, 18), y: layoutValue(274, 396),
      w: layoutValue(68, 72), h: layoutValue(68, 72), radius: layoutValue(34, 36),
      normal_color: 0x20cbd6, press_color: 0x118993,
      text: t('trip_advance'), text_size: layoutValue(12, 13), color: 0x00191b,
      click_func: advanceTrip
    })

    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: layoutValue(104, 102), y: layoutValue(274, 396),
      w: layoutValue(68, 72), h: layoutValue(68, 72), radius: layoutValue(34, 36),
      normal_color: 0x16353a, press_color: 0x24636a,
      text: t('trip_finish'), text_size: layoutValue(11, 12), color: 0xff6b6b,
      click_func: finishTrip
    })
  },

  onDestroy() {
    pageAlive = false
    destroyHaptics()
    prediction = null
    statusWidget = null
    distanceWidget = null
    etaWidget = null
    referenceWidget = null
    reasonWidget = null
    confidenceWidget = null
  }
})
