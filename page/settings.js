import { t } from '../utils/i18n'
import {
  getLanguage,
  getVibrationIntensity,
  isVibrationEnabled,
  setLanguage,
  setVibrationEnabled,
  setVibrationIntensity
} from '../utils/session'
import { layoutValue } from '../utils/layout'

let pageAlive = false
let titleWidget = null
let languageLabel = null
let vibrationLabel = null
let intensityLabel = null
let aboutWidget = null
let summaryWidget = null
let esButton = null
let enButton = null
let onButton = null
let offButton = null
let normalButton = null
let strongButton = null
let backButton = null

function circleProps(x, y, text, selected, size, textSize) {
  return {
    x: x, y: y, w: size, h: size, radius: size / 2,
    normal_color: selected ? 0x20cbd6 : 0x16353a,
    press_color: selected ? 0x118993 : 0x24636a,
    text: text, text_size: textSize,
    color: selected ? 0x00191b : 0x72edf2
  }
}

function setText(widget, text) {
  if (!pageAlive || !widget || typeof widget.setProperty !== 'function') return
  try {
    if (hmUI.prop && hmUI.prop.TEXT !== undefined) {
      widget.setProperty(hmUI.prop.TEXT, text)
    }
  } catch (error) {
    console.log('RideWake Ajustes: text update failed')
  }
}

function setButton(widget, props) {
  if (!pageAlive || !widget || typeof widget.setProperty !== 'function') return
  try {
    if (hmUI.prop && hmUI.prop.MORE !== undefined) {
      widget.setProperty(hmUI.prop.MORE, props)
    }
  } catch (error) {
    console.log('RideWake Ajustes: button update failed')
  }
}

function refreshSettings() {
  if (!pageAlive) return
  setText(titleWidget, t('settings_title'))
  setText(languageLabel, t('settings_language'))
  setText(vibrationLabel, t('settings_vibration'))
  setText(intensityLabel, t('settings_intensity'))
  setText(aboutWidget, t('settings_about'))
  setText(summaryWidget, isVibrationEnabled()
    ? t('settings_summary_on') : t('settings_summary_off'))
  setButton(esButton, circleProps(
    layoutValue(78, 40), layoutValue(64, 102), 'ES',
    getLanguage() === 'es', layoutValue(44, 50), layoutValue(13, 14)
  ))
  setButton(enButton, circleProps(
    layoutValue(132, 102), layoutValue(64, 102), 'EN',
    getLanguage() === 'en', layoutValue(44, 50), layoutValue(13, 14)
  ))
  setButton(onButton, circleProps(
    layoutValue(78, 40), layoutValue(120, 192), t('settings_on'),
    isVibrationEnabled(), layoutValue(44, 50), layoutValue(12, 13)
  ))
  setButton(offButton, circleProps(
    layoutValue(132, 102), layoutValue(120, 192), t('settings_off'),
    !isVibrationEnabled(), layoutValue(44, 50), layoutValue(12, 13)
  ))
  setButton(normalButton, circleProps(
    layoutValue(74, 28), layoutValue(176, 282), t('settings_normal'),
    getVibrationIntensity() === 'normal', layoutValue(52, 60), layoutValue(11, 12)
  ))
  setButton(strongButton, circleProps(
    layoutValue(128, 104), layoutValue(176, 282), t('settings_strong'),
    getVibrationIntensity() === 'strong', layoutValue(52, 60), layoutValue(11, 12)
  ))
  setButton(backButton, circleProps(
    layoutValue(66, 64), layoutValue(284, 404), t('settings_back'),
    false, layoutValue(60, 64), layoutValue(11, 12)
  ))
}

function goBack() {
  try {
    if (typeof hmApp !== 'undefined' && typeof hmApp.goBack === 'function') {
      hmApp.goBack()
    }
  } catch (error) {
    console.log('RideWake Ajustes: goBack failed')
  }
}

Page({
  build() {
    pageAlive = true

    titleWidget = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(24, 35), w: 168, h: layoutValue(24, 26),
      text: t('settings_title'), text_size: layoutValue(19, 20), color: 0x35dce8,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })

    languageLabel = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(64, 78), w: layoutValue(56, 168), h: layoutValue(44, 20),
      text: t('settings_language'), text_size: layoutValue(14, 15), color: 0xb5c6c8,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })

    esButton = hmUI.createWidget(hmUI.widget.BUTTON, Object.assign(
      circleProps(
        layoutValue(78, 40), layoutValue(64, 102), 'ES',
        getLanguage() === 'es', layoutValue(44, 50), layoutValue(13, 14)
      ),
      { click_func: function () { setLanguage('es'); refreshSettings() } }
    ))
    enButton = hmUI.createWidget(hmUI.widget.BUTTON, Object.assign(
      circleProps(
        layoutValue(132, 102), layoutValue(64, 102), 'EN',
        getLanguage() === 'en', layoutValue(44, 50), layoutValue(13, 14)
      ),
      { click_func: function () { setLanguage('en'); refreshSettings() } }
    ))

    vibrationLabel = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(120, 168), w: layoutValue(56, 168), h: layoutValue(44, 20),
      text: t('settings_vibration'), text_size: layoutValue(14, 15), color: 0xb5c6c8,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })

    onButton = hmUI.createWidget(hmUI.widget.BUTTON, Object.assign(
      circleProps(
        layoutValue(78, 40), layoutValue(120, 192), t('settings_on'),
        isVibrationEnabled(), layoutValue(44, 50), layoutValue(12, 13)
      ),
      { click_func: function () { setVibrationEnabled(true); refreshSettings() } }
    ))
    offButton = hmUI.createWidget(hmUI.widget.BUTTON, Object.assign(
      circleProps(
        layoutValue(132, 102), layoutValue(120, 192), t('settings_off'),
        !isVibrationEnabled(), layoutValue(44, 50), layoutValue(12, 13)
      ),
      { click_func: function () { setVibrationEnabled(false); refreshSettings() } }
    ))

    intensityLabel = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(176, 258), w: layoutValue(56, 168), h: layoutValue(52, 20),
      text: t('settings_intensity'), text_size: layoutValue(14, 15), color: 0xb5c6c8,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })

    normalButton = hmUI.createWidget(hmUI.widget.BUTTON, Object.assign(
      circleProps(
        layoutValue(74, 28), layoutValue(176, 282), t('settings_normal'),
        getVibrationIntensity() === 'normal', layoutValue(52, 60), layoutValue(11, 12)
      ),
      { click_func: function () { setVibrationIntensity('normal'); refreshSettings() } }
    ))
    strongButton = hmUI.createWidget(hmUI.widget.BUTTON, Object.assign(
      circleProps(
        layoutValue(128, 104), layoutValue(176, 282), t('settings_strong'),
        getVibrationIntensity() === 'strong', layoutValue(52, 60), layoutValue(11, 12)
      ),
      { click_func: function () { setVibrationIntensity('strong'); refreshSettings() } }
    ))

    aboutWidget = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(238, 350), w: 168, h: layoutValue(16, 20),
      text: t('settings_about'), text_size: layoutValue(11, 12), color: 0xffffff,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })

    summaryWidget = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(260, 378), w: 168, h: layoutValue(18, 20),
      text: isVibrationEnabled() ? t('settings_summary_on') : t('settings_summary_off'),
      text_size: layoutValue(11, 12), color: 0x72edf2,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })

    backButton = hmUI.createWidget(hmUI.widget.BUTTON, Object.assign(
      circleProps(
        layoutValue(66, 64), layoutValue(284, 404), t('settings_back'),
        false, layoutValue(60, 64), layoutValue(11, 12)
      ),
      { click_func: goBack }
    ))
  },

  onDestroy() {
    pageAlive = false
    titleWidget = null
    languageLabel = null
    vibrationLabel = null
    intensityLabel = null
    aboutWidget = null
    summaryWidget = null
    esButton = null
    enButton = null
    onButton = null
    offButton = null
    normalButton = null
    strongButton = null
    backButton = null
  }
})
