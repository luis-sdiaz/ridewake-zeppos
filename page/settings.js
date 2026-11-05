import { Colors, Layout, Type } from '../utils/theme'
import { getLanguage, setLanguage, t } from '../utils/i18n'
import { getHapticMode, setHapticMode } from '../utils/session'
import { destroyHaptics, initHaptics, vibrateShort } from '../utils/haptics'

let normalButton = null
let strongButton = null

function languageName() {
  return getLanguage() === 'es' ? 'Español' : 'English'
}

function hapticButtonProps(x, mode, text) {
  const isActive = getHapticMode() === mode

  return {
    x,
    y: 165,
    w: 76,
    h: 44,
    radius: 14,
    normal_color: isActive ? Colors.Mint400 : Colors.Navy700,
    press_color: isActive ? Colors.Cyan500 : Colors.DisabledSurface,
    text,
    text_size: Type.body,
    color: isActive ? Colors.Ink : Colors.White
  }
}

function refreshHapticButtons() {
  normalButton.setProperty(
    hmUI.prop.MORE,
    hapticButtonProps(16, 'normal', t('settings_haptic_normal'))
  )
  strongButton.setProperty(
    hmUI.prop.MORE,
    hapticButtonProps(100, 'strong', t('settings_haptic_strong'))
  )
}

function chooseHapticMode(mode) {
  setHapticMode(mode)
  vibrateShort()
  refreshHapticButtons()
}

Page({
  build() {
    initHaptics()

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0,
      y: 0,
      w: Layout.width,
      h: Layout.height,
      color: Colors.Navy950
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.leftMargin,
      y: 30,
      w: Layout.contentWidth,
      h: 24,
      text: t('settings_title'),
      text_size: Type.button,
      color: Colors.Cyan500,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.leftMargin,
      y: 65,
      w: Layout.contentWidth,
      h: 18,
      text: t('settings_lang_label'),
      text_size: Type.caption,
      color: Colors.Slate350,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    })

    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: Layout.leftMargin,
      y: 85,
      w: Layout.contentWidth,
      h: 46,
      radius: 23,
      normal_color: Colors.Navy700,
      press_color: Colors.DisabledSurface,
      text: languageName(),
      text_size: Type.button,
      color: Colors.White,
      click_func() {
        setLanguage(getLanguage() === 'es' ? 'en' : 'es')
        vibrateShort()
        hmApp.reloadPage()
      }
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.leftMargin,
      y: 145,
      w: Layout.contentWidth,
      h: 18,
      text: t('settings_haptic_label'),
      text_size: Type.caption,
      color: Colors.Slate350,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    })

    normalButton = hmUI.createWidget(hmUI.widget.BUTTON, {
      ...hapticButtonProps(16, 'normal', t('settings_haptic_normal')),
      click_func() {
        chooseHapticMode('normal')
      }
    })

    strongButton = hmUI.createWidget(hmUI.widget.BUTTON, {
      ...hapticButtonProps(100, 'strong', t('settings_haptic_strong')),
      click_func() {
        chooseHapticMode('strong')
      }
    })

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: Layout.leftMargin,
      y: 230,
      w: Layout.contentWidth,
      h: 100,
      radius: 16,
      color: Colors.Navy900
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 24,
      y: 242,
      w: 144,
      h: 16,
      text: t('settings_about_label'),
      text_size: 11,
      color: Colors.Slate350,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 24,
      y: 265,
      w: 144,
      h: 20,
      text: t('settings_version'),
      text_size: 13,
      color: Colors.White,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 24,
      y: 290,
      w: 144,
      h: 24,
      text: t('settings_target'),
      text_size: 11,
      color: Colors.Cyan500,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.WRAP
    })

    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: Layout.leftMargin,
      y: 380,
      w: Layout.contentWidth,
      h: 48,
      radius: 24,
      normal_color: Colors.Navy700,
      press_color: Colors.DisabledSurface,
      text: t('settings_btn_back'),
      text_size: Type.button,
      color: Colors.White,
      click_func() {
        vibrateShort()
        hmApp.goBack()
      }
    })
  },

  onDestroy() {
    destroyHaptics()
    normalButton = null
    strongButton = null
  }
})
