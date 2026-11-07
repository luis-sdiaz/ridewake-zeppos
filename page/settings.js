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
  setText(languageLabel, t('settings_language'), theme.textSecondary)
  setText(vibrationLabel, t('settings_vibration'), theme.textSecondary)
  setText(appearanceLabel, t('settings_appearance'), theme.textSecondary)
  setText(aboutWidget, t('settings_about'), theme.textPrimary)
  setText(summaryWidget, isVibrationEnabled()
    ? t('settings_summary_on') : t('settings_summary_off'), theme.btnSecondaryText)
  setButton(esButton, circleProps(
    layoutValue(50, 46), layoutValue(68, 88), 'ES',
    getLanguage() === 'es', layoutValue(44, 50), layoutValue(13, 14), theme
  ))
  setButton(enButton, circleProps(
    layoutValue(98, 100), layoutValue(68, 88), 'EN',
    getLanguage() === 'en', layoutValue(44, 50), layoutValue(13, 14), theme
  ))
  setButton(onButton, circleProps(
    layoutValue(50, 46), layoutValue(138, 172), t('settings_on'),
    isVibrationEnabled(), layoutValue(44, 50), layoutValue(12, 13), theme
  ))
  setButton(offButton, circleProps(
    layoutValue(98, 100), layoutValue(138, 172), t('settings_off'),
    !isVibrationEnabled(), layoutValue(44, 50), layoutValue(12, 13), theme
  ))
  setButton(lightButton, circleProps(
    layoutValue(50, 46), layoutValue(208, 256), t('settings_light'),
    getTheme() === 'light', layoutValue(44, 50), layoutValue(11, 12), theme
  ))
  setButton(darkButton, circleProps(
    layoutValue(98, 100), layoutValue(208, 256), t('settings_dark'),
    getTheme() === 'dark', layoutValue(44, 50), layoutValue(11, 12), theme
  ))
  setButton(backButton, circleProps(
    layoutValue(66, 60), layoutValue(288, 404), t('settings_back'),
    false, layoutValue(60, 64), layoutValue(11, 12), theme
  ))
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
      x: 12, y: layoutValue(24, 35), w: 168, h: layoutValue(24, 26),
      text: t('settings_title'), text_size: layoutValue(19, 20), color: theme.title,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })
    languageLabel = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(54, 72), w: 168, h: 14,
      text: t('settings_language'), text_size: layoutValue(12, 13), color: theme.textSecondary,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })
    esButton = hmUI.createWidget(hmUI.widget.BUTTON, Object.assign(
      circleProps(layoutValue(50, 46), layoutValue(68, 88), 'ES',
        getLanguage() === 'es', layoutValue(44, 50), layoutValue(13, 14), theme),
      { click_func: function () { setLanguage('es'); refreshSettings() } }
    ))
    enButton = hmUI.createWidget(hmUI.widget.BUTTON, Object.assign(
      circleProps(layoutValue(98, 100), layoutValue(68, 88), 'EN',
        getLanguage() === 'en', layoutValue(44, 50), layoutValue(13, 14), theme),
      { click_func: function () { setLanguage('en'); refreshSettings() } }
    ))

    vibrationLabel = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(124, 156), w: 168, h: 14,
      text: t('settings_vibration'), text_size: layoutValue(12, 13), color: theme.textSecondary,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })
    onButton = hmUI.createWidget(hmUI.widget.BUTTON, Object.assign(
      circleProps(layoutValue(50, 46), layoutValue(138, 172), t('settings_on'),
        isVibrationEnabled(), layoutValue(44, 50), layoutValue(12, 13), theme),
      { click_func: function () { setVibrationEnabled(true); refreshSettings() } }
    ))
    offButton = hmUI.createWidget(hmUI.widget.BUTTON, Object.assign(
      circleProps(layoutValue(98, 100), layoutValue(138, 172), t('settings_off'),
        !isVibrationEnabled(), layoutValue(44, 50), layoutValue(12, 13), theme),
      { click_func: function () { setVibrationEnabled(false); refreshSettings() } }
    ))

    appearanceLabel = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(194, 240), w: 168, h: 14,
      text: t('settings_appearance'), text_size: layoutValue(12, 13), color: theme.textSecondary,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })
    lightButton = hmUI.createWidget(hmUI.widget.BUTTON, Object.assign(
      circleProps(layoutValue(50, 46), layoutValue(208, 256), t('settings_light'),
        getTheme() === 'light', layoutValue(44, 50), layoutValue(11, 12), theme),
      { click_func: function () { setTheme('light'); refreshSettings() } }
    ))
    darkButton = hmUI.createWidget(hmUI.widget.BUTTON, Object.assign(
      circleProps(layoutValue(98, 100), layoutValue(208, 256), t('settings_dark'),
        getTheme() === 'dark', layoutValue(44, 50), layoutValue(11, 12), theme),
      { click_func: function () { setTheme('dark'); refreshSettings() } }
    ))

    aboutWidget = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(258, 324), w: 168, h: 14,
      text: t('settings_about'), text_size: layoutValue(10, 11), color: theme.textPrimary,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })
    summaryWidget = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(274, 346), w: 168, h: layoutValue(14, 16),
      text: isVibrationEnabled() ? t('settings_summary_on') : t('settings_summary_off'),
      text_size: layoutValue(10, 11), color: theme.btnSecondaryText,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })
    backButton = hmUI.createWidget(hmUI.widget.BUTTON, Object.assign(
      circleProps(layoutValue(66, 60), layoutValue(289, 404), t('settings_back'),
        false, layoutValue(60, 64), layoutValue(11, 12), theme),
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
