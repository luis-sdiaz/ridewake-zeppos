import { t } from '../utils/i18n'
import {
  getLanguage,
  getTheme,
  isVibrationEnabled,
  setLanguage,
  setTheme,
  setVibrationEnabled
} from '../utils/session'
import { layoutValue } from '../utils/layout'
import { createPageBackground, getActiveTheme, updatePageBackground } from '../utils/theme'

let pageAlive = false
let backgroundWidget = null
let titleWidget = null
let languageLabel = null
let vibrationLabel = null
let appearanceLabel = null
let aboutWidget = null
let summaryWidget = null
let esButton = null
let enButton = null
let onButton = null
let offButton = null
let lightButton = null
let darkButton = null
let backButton = null

function circleProps(x, y, text, selected, size, textSize, theme) {
  return {
    x: x, y: y, w: size, h: size, radius: size / 2,
    normal_color: selected ? theme.accent : theme.btnSecondary,
    press_color: selected ? theme.accentPress : theme.btnSecondaryPress,
    text: text, text_size: textSize,
    color: selected ? theme.onAccent : theme.btnSecondaryText
  }
}

// Shared by build and refresh so switching theme/language never moves VOLVER.
function backProps(theme) {
  return {
    x: 36, y: layoutValue(302, 418), w: 120, h: layoutValue(40, 50),
    radius: layoutValue(20, 25), text: t('settings_back'),
    text_size: layoutValue(12, 14), color: theme.btnSecondaryText,
    normal_color: theme.btnSecondary, press_color: theme.btnSecondaryPress
  }
}

function setText(widget, text, color) {
  if (!pageAlive || !widget || typeof widget.setProperty !== 'function') return
  try {
    if (hmUI.prop && hmUI.prop.MORE !== undefined) {
      widget.setProperty(hmUI.prop.MORE, { text: text, color: color })
    } else if (hmUI.prop && hmUI.prop.TEXT !== undefined) {
      widget.setProperty(hmUI.prop.TEXT, text)
    }
  } catch (error) {
    console.log('RideWake Ajustes: text update failed')
  }
}

function setButton(widget, props) {
  if (!pageAlive || !widget || typeof widget.setProperty !== 'function') return
  try {
    if (hmUI.prop && hmUI.prop.MORE !== undefined) widget.setProperty(hmUI.prop.MORE, props)
  } catch (error) {
    console.log('RideWake Ajustes: button update failed')
  }
}

function refreshSettings() {
  if (!pageAlive) return
  const theme = getActiveTheme()
  updatePageBackground(backgroundWidget)
  setText(titleWidget, t('settings_title'), theme.title)
  setText(languageLabel, t('settings_language'), theme.textPrimary)
  setText(vibrationLabel, t('settings_vibration'), theme.textPrimary)
  setText(appearanceLabel, t('settings_appearance'), theme.textPrimary)
  setText(aboutWidget, t('settings_about'), theme.textSecondary)
  setText(summaryWidget, isVibrationEnabled()
    ? t('settings_summary_on') : t('settings_summary_off'), theme.textSecondary)
  setButton(esButton, circleProps(
    layoutValue(48, 39), layoutValue(64, 106), 'ES',
    getLanguage() === 'es', layoutValue(42, 50), layoutValue(13, 14), theme
  ))
  setButton(enButton, circleProps(
    layoutValue(102, 103), layoutValue(64, 106), 'EN',
    getLanguage() === 'en', layoutValue(42, 50), layoutValue(13, 14), theme
  ))
  setButton(onButton, circleProps(
    layoutValue(48, 39), layoutValue(138, 206), t('settings_on'),
    isVibrationEnabled(), layoutValue(42, 50), layoutValue(12, 13), theme
  ))
  setButton(offButton, circleProps(
    layoutValue(102, 103), layoutValue(138, 206), t('settings_off'),
    !isVibrationEnabled(), layoutValue(42, 50), layoutValue(12, 13), theme
  ))
  setButton(lightButton, circleProps(
    layoutValue(48, 39), layoutValue(212, 306), t('settings_light'),
    getTheme() === 'light', layoutValue(42, 50), layoutValue(11, 12), theme
  ))
  setButton(darkButton, circleProps(
    layoutValue(102, 103), layoutValue(212, 306), t('settings_dark'),
    getTheme() === 'dark', layoutValue(42, 50), layoutValue(11, 12), theme
  ))
  setButton(backButton, backProps(theme))
}

function goBack() {
  try {
    if (typeof hmApp !== 'undefined' && typeof hmApp.goBack === 'function') hmApp.goBack()
  } catch (error) {
    console.log('RideWake Ajustes: goBack failed')
  }
}

Page({
  build() {
    pageAlive = true
    backgroundWidget = createPageBackground()
    const theme = getActiveTheme()

    titleWidget = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(14, 35), w: 168, h: layoutValue(22, 26),
      text: t('settings_title'), text_size: layoutValue(19, 20), color: theme.title,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })
    languageLabel = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(42, 78), w: 168, h: layoutValue(16, 18),
      text: t('settings_language'), text_size: layoutValue(13, 14), color: theme.textPrimary,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })
    esButton = hmUI.createWidget(hmUI.widget.BUTTON, Object.assign(
      circleProps(layoutValue(48, 39), layoutValue(64, 106), 'ES',
        getLanguage() === 'es', layoutValue(42, 50), layoutValue(13, 14), theme),
      { click_func: function () { setLanguage('es'); refreshSettings() } }
    ))
    enButton = hmUI.createWidget(hmUI.widget.BUTTON, Object.assign(
      circleProps(layoutValue(102, 103), layoutValue(64, 106), 'EN',
        getLanguage() === 'en', layoutValue(42, 50), layoutValue(13, 14), theme),
      { click_func: function () { setLanguage('en'); refreshSettings() } }
    ))

    vibrationLabel = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(116, 178), w: 168, h: layoutValue(16, 18),
      text: t('settings_vibration'), text_size: layoutValue(13, 14), color: theme.textPrimary,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })
    onButton = hmUI.createWidget(hmUI.widget.BUTTON, Object.assign(
      circleProps(layoutValue(48, 39), layoutValue(138, 206), t('settings_on'),
        isVibrationEnabled(), layoutValue(42, 50), layoutValue(12, 13), theme),
      { click_func: function () { setVibrationEnabled(true); refreshSettings() } }
    ))
    offButton = hmUI.createWidget(hmUI.widget.BUTTON, Object.assign(
      circleProps(layoutValue(102, 103), layoutValue(138, 206), t('settings_off'),
        !isVibrationEnabled(), layoutValue(42, 50), layoutValue(12, 13), theme),
      { click_func: function () { setVibrationEnabled(false); refreshSettings() } }
    ))

    appearanceLabel = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(190, 278), w: 168, h: layoutValue(16, 18),
      text: t('settings_appearance'), text_size: layoutValue(13, 14), color: theme.textPrimary,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })
    lightButton = hmUI.createWidget(hmUI.widget.BUTTON, Object.assign(
      circleProps(layoutValue(48, 39), layoutValue(212, 306), t('settings_light'),
        getTheme() === 'light', layoutValue(42, 50), layoutValue(11, 12), theme),
      { click_func: function () { setTheme('light'); refreshSettings() } }
    ))
    darkButton = hmUI.createWidget(hmUI.widget.BUTTON, Object.assign(
      circleProps(layoutValue(102, 103), layoutValue(212, 306), t('settings_dark'),
        getTheme() === 'dark', layoutValue(42, 50), layoutValue(11, 12), theme),
      { click_func: function () { setTheme('dark'); refreshSettings() } }
    ))

    aboutWidget = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(280, 392), w: 168, h: 14,
      text: t('settings_about'), text_size: 11, color: theme.textSecondary,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })
    summaryWidget = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(262, 370), w: 168, h: layoutValue(14, 16),
      text: isVibrationEnabled() ? t('settings_summary_on') : t('settings_summary_off'),
      text_size: layoutValue(11, 12), color: theme.textSecondary,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })
    backButton = hmUI.createWidget(hmUI.widget.BUTTON, Object.assign(
      backProps(theme),
      { click_func: goBack }
    ))
  },

  onDestroy() {
    pageAlive = false
    backgroundWidget = null
    titleWidget = null
    languageLabel = null
    vibrationLabel = null
    appearanceLabel = null
    aboutWidget = null
    summaryWidget = null
    esButton = null
    enButton = null
    onButton = null
    offButton = null
    lightButton = null
    darkButton = null
    backButton = null
  }
})
