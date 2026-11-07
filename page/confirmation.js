import { getLanguage, t } from '../utils/i18n'
import { getSelectedDestination, startTripSession } from '../utils/session'
import { getRouteSummary } from '../utils/prediction'
import { layoutValue, measureWrappedText } from '../utils/layout'
import { createPageBackground, getActiveTheme } from '../utils/theme'

let pageAlive = false
let startLocked = false

function destinationName(destination) {
  if (destination === 'Universidad') {
    return getLanguage() === 'en' ? 'University' : 'Universidad'
  }
  return getLanguage() === 'en' ? 'Home' : 'Casa'
}

function goBack() {
  if (!pageAlive || startLocked) return
  try {
    if (typeof hmApp !== 'undefined' && typeof hmApp.goBack === 'function') {
      hmApp.goBack()
    }
  } catch (error) {
    console.log('RideWake Confirmación: goBack failed')
  }
}

function startTrip() {
  if (!pageAlive || startLocked) return
  startLocked = true
  try {
    if (typeof hmApp !== 'undefined' && typeof hmApp.gotoPage === 'function') {
      startTripSession()
      hmApp.gotoPage({ url: 'page/trip' })
      return
    }
  } catch (error) {
    console.log('RideWake Confirmación: start failed')
  }
  startLocked = false
}

Page({
  build() {
    pageAlive = true
    const theme = getActiveTheme()
    createPageBackground()
    startLocked = false
    const destination = getSelectedDestination() || 'Casa'
    const route = getRouteSummary(destination)
    const confirmationText = t('confirmation_message')
    const confirmationTextSize = layoutValue(14, 15)
    const confirmationTextHeight = measureWrappedText(
      confirmationText,
      confirmationTextSize,
      168,
      layoutValue(42, 48),
      layoutValue(46, 58)
    )

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(24, 48), w: 168, h: layoutValue(24, 28),
      text: t('confirmation_title'), text_size: layoutValue(19, 20), color: theme.title,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(60, 100), w: 168, h: layoutValue(28, 32),
      text: destinationName(destination), text_size: layoutValue(20, 22), color: theme.textPrimary,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(104, 176), w: 168, h: layoutValue(24, 30),
      text: t('confirmation_distance') + route.initialDistance.toFixed(1) + ' km',
      text_size: layoutValue(16, 20), color: theme.textPrimary,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(138, 224), w: 168, h: layoutValue(26, 34),
      text: t('confirmation_eta') + route.initialEta + ' min',
      text_size: layoutValue(18, 22), color: theme.btnSecondaryText,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(178, 282), w: 168, h: confirmationTextHeight,
      text: confirmationText, text_size: confirmationTextSize, color: theme.textPrimary,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.WRAP
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(228, 350), w: 168, h: layoutValue(16, 18),
      text: t('trip_demo'), text_size: layoutValue(11, 12), color: theme.textSecondary,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })

    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: layoutValue(20, 18), y: layoutValue(258, 388),
      w: layoutValue(68, 72), h: layoutValue(68, 72), radius: layoutValue(34, 36),
      normal_color: theme.btnSecondary, press_color: theme.btnSecondaryPress,
      text: t('confirmation_back'), text_size: 12, color: theme.btnSecondaryText,
      click_func: goBack
    })

    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: layoutValue(104, 102), y: layoutValue(258, 388),
      w: layoutValue(68, 72), h: layoutValue(68, 72), radius: layoutValue(34, 36),
      normal_color: theme.accent, press_color: theme.accentPress,
      text: t('confirmation_start'), text_size: 12, color: theme.onAccent,
      click_func: startTrip
    })
  },

  onDestroy() {
    pageAlive = false
  }
})
