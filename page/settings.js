import { getTheme, Layout, Type } from '../utils/theme'
import { getLanguage, setLanguage, t } from '../utils/i18n'
import {
  getHapticMode,
  getThemeMode,
  setHapticMode,
  setThemeMode
} from '../utils/session'
import { destroyHaptics, initHaptics, vibrateShort } from '../utils/haptics'

let normalButton = null
let strongButton = null
let activeTheme = getTheme('light')

function languageName() {
  return getLanguage() === 'es' ? 'Español' : 'English'
}

function hapticButtonProps(x, mode, text) {
  const isActive = getHapticMode() === mode

  return {
    x,
    y: Layout.y(225),
    w: 76,
    h: 42,
    radius: 12,
    normal_color: isActive ? activeTheme.success : activeTheme.btnSecondary,
    press_color: isActive ? activeTheme.accent : activeTheme.cardBg,
    text,
    text_size: Type.body,
    color: isActive ? activeTheme.onAccent : activeTheme.textPrimary
  }
}

function themeButtonProps(x, mode, text) {
  const isActive = getThemeMode() === mode

  return {
    x,
    y: Layout.y(155),
    w: 76,
    h: 42,
    radius: 12,
    normal_color: isActive ? activeTheme.success : activeTheme.btnSecondary,
    press_color: isActive ? activeTheme.accent : activeTheme.cardBg,
    text,
    text_size: Type.body,
    color: isActive ? activeTheme.onAccent : activeTheme.textPrimary
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

function chooseThemeMode(mode) {
  setThemeMode(mode)
  vibrateShort()
  hmApp.reloadPage()
}

Page({
  build() {
    initHaptics()
    activeTheme = getTheme(getThemeMode())

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0,
      y: Layout.y(0),
      w: Layout.width,
      h: Layout.height,
      color: activeTheme.bg
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.leftMargin,
      y: Layout.y(25),
      w: Layout.contentWidth,
      h: 24,
      text: t('settings_title'),
      text_size: Type.button,
      color: activeTheme.accent,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.leftMargin,
      y: Layout.y(60),
      w: Layout.contentWidth,
      h: 18,
      text: t('settings_lang_label'),
      text_size: Type.caption,
      color: activeTheme.textSecondary,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    })

    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: Layout.leftMargin,
      y: Layout.y(80),
      w: Layout.contentWidth,
      h: 44,
      radius: 22,
      normal_color: activeTheme.btnSecondary,
      press_color: activeTheme.cardBg,
      text: languageName(),
      text_size: Type.button,
      color: activeTheme.textPrimary,
      click_func() {
        setLanguage(getLanguage() === 'es' ? 'en' : 'es')
        vibrateShort()
        hmApp.reloadPage()
      }
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.leftMargin,
      y: Layout.y(135),
      w: Layout.contentWidth,
      h: 18,
      text: t('settings_theme_label'),
      text_size: Type.caption,
      color: activeTheme.textSecondary,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    })

    hmUI.createWidget(hmUI.widget.BUTTON, {
      ...themeButtonProps(16, 'dark', t('settings_theme_dark')),
      click_func() {
        chooseThemeMode('dark')
      }
    })

    hmUI.createWidget(hmUI.widget.BUTTON, {
      ...themeButtonProps(100, 'light', t('settings_theme_light')),
      click_func() {
        chooseThemeMode('light')
      }
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.leftMargin,
      y: Layout.y(205),
      w: Layout.contentWidth,
      h: 18,
      text: t('settings_haptic_label'),
      text_size: Type.caption,
      color: activeTheme.textSecondary,
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
      y: Layout.y(280),
      w: Layout.contentWidth,
      h: 80,
      radius: 16,
      color: activeTheme.cardBg
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 24,
      y: Layout.y(287),
      w: 144,
      h: 16,
      text: t('settings_about_label'),
      text_size: 11,
      color: activeTheme.textSecondary,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 24,
      y: Layout.y(308),
      w: 144,
      h: 20,
      text: t('settings_version'),
      text_size: 13,
      color: activeTheme.textPrimary,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 24,
      y: Layout.y(331),
      w: 144,
      h: 24,
      text: t('settings_target'),
      text_size: 11,
      color: activeTheme.accent,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.WRAP
    })

    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: Layout.leftMargin,
      y: Layout.y(385),
      w: Layout.contentWidth,
      h: 44,
      radius: 22,
      normal_color: activeTheme.btnSecondary,
      press_color: activeTheme.cardBg,
      text: t('settings_btn_back'),
      text_size: Type.button,
      color: activeTheme.textPrimary,
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
    activeTheme = getTheme('light')
  }
})
