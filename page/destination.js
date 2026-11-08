import { getLanguage, t } from '../utils/i18n'
import { getDestinationDisplayName, getSelectedDestination } from '../utils/session'
import { getRouteSummary } from '../utils/prediction'
import { layoutValue, measureWrappedText } from '../utils/layout'
import { createPageBackground, getActiveTheme } from '../utils/theme'

let pageAlive = false
let navigationLocked = false

function destinationName(destination) {
  return getDestinationDisplayName(destination, getLanguage()) || t('keyboard_unavailable')
}

function goBack() {
  if (!pageAlive || navigationLocked) return
  navigationLocked = true
  try {
    if (typeof hmApp !== 'undefined' && typeof hmApp.goBack === 'function') {
      hmApp.goBack()
      return
    }
  } catch (error) {
    console.log('RideWake Destino: goBack failed')
  }
  navigationLocked = false
}

function continueToConfirmation() {
  if (!pageAlive || navigationLocked) return
  navigationLocked = true
  try {
    if (typeof hmApp !== 'undefined' && typeof hmApp.gotoPage === 'function') {
      hmApp.gotoPage({ url: 'page/confirmation' })
      return
    }
  } catch (error) {
    console.log('RideWake Destino: navigation failed')
  }
  navigationLocked = false
}

Page({
  build() {
    pageAlive = true
    const theme = getActiveTheme()
    createPageBackground()
    navigationLocked = false
    const destination = getSelectedDestination()
    const route = getRouteSummary(destination)
    const routeText = route ? t(route.descriptionKey) : t('keyboard_unavailable')
    const routeTextSize = layoutValue(13, 14)
    const routeTextHeight = measureWrappedText(
      routeText,
      routeTextSize,
      168,
      layoutValue(36, 42),
      layoutValue(44, 52)
    )

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(24, 48), w: 168, h: layoutValue(24, 26),
      text: t('destination_title'), text_size: layoutValue(19, 20), color: theme.title,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(58, 100), w: 168, h: layoutValue(26, 30),
      text: destinationName(destination), text_size: layoutValue(20, 22), color: theme.textPrimary,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(96, 150), w: 168, h: layoutValue(20, 22),
      text: t('destination_route'), text_size: layoutValue(13, 14), color: theme.textSecondary,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(120, 178), w: 168, h: routeTextHeight,
      text: routeText, text_size: routeTextSize, color: theme.textPrimary,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.WRAP
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(164, 258), w: 168, h: layoutValue(24, 30),
      text: route
        ? t(route.simulated ? 'destination_distance_simulated' : 'destination_distance') +
          route.initialDistance.toFixed(1) + ' km'
        : t('destination_distance') + '--',
      text_size: route && route.simulated ? layoutValue(14, 17) : layoutValue(16, 20),
      color: theme.textPrimary,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(194, 306), w: 168, h: layoutValue(26, 34),
      text: t('destination_eta') + (route ? route.initialEta + ' min' : '--'),
      text_size: layoutValue(18, 22), color: theme.btnSecondaryText,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(226, 352), w: 168, h: layoutValue(16, 18),
      text: t('trip_demo'), text_size: layoutValue(11, 12), color: theme.textSecondary,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })

    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: layoutValue(20, 18), y: layoutValue(256, 388),
      w: layoutValue(68, 72), h: layoutValue(68, 72), radius: layoutValue(34, 36),
      normal_color: theme.btnSecondary, press_color: theme.btnSecondaryPress,
      text: t('destination_change'), text_size: 12, color: theme.btnSecondaryText,
      click_func: goBack
    })

    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: layoutValue(104, 102), y: layoutValue(256, 388),
      w: layoutValue(68, 72), h: layoutValue(68, 72), radius: layoutValue(34, 36),
      normal_color: theme.accent, press_color: theme.accentPress,
      text: t('destination_continue'), text_size: 12, color: theme.onAccent,
      click_func: continueToConfirmation
    })
  },

  onDestroy() {
    pageAlive = false
    navigationLocked = false
  }
})
