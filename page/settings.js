import { getTheme, Layout, Type } from '../utils/theme'
import { getLanguage, setLanguage, t } from '../utils/i18n'
import {
  getHapticMode,
  getThemeMode,
  setHapticMode,
  setThemeMode
} from '../utils/session'
import { destroyHaptics, initHaptics, vibrateShort } from '../utils/haptics'

let activeTheme = getTheme('light')
const widgets = {
  background: null,
  title: null,
  languageLabel: null,
  languageButton: null,
  themeLabel: null,
  darkButton: null,
  lightButton: null,
  hapticLabel: null,
  normalButton: null,
  strongButton: null,
  aboutCard: null,
  aboutLabel: null,
  versionText: null,
  targetText: null,
  backButton: null
}

function languageName() {
  return getLanguage() === 'es' ? 'Español' : 'English'
}

function hapticButtonProps(x, mode, text) {
  const isActive = getHapticMode() === mode

  return {
    x,
    y: Layout.y(218),
    w: 72,
    h: Layout.h(42),
    radius: Layout.h(21),
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
    y: Layout.y(150),
    w: 72,
    h: Layout.h(42),
    radius: Layout.h(21),
    normal_color: isActive ? activeTheme.success : activeTheme.btnSecondary,
    press_color: isActive ? activeTheme.accent : activeTheme.cardBg,
    text,
    text_size: Type.body,
    color: isActive ? activeTheme.onAccent : activeTheme.textPrimary
  }
}

function refreshHapticButtons() {
  widgets.normalButton.setProperty(
    hmUI.prop.MORE,
    hapticButtonProps(20, 'normal', t('settings_haptic_normal'))
  )
  widgets.strongButton.setProperty(
    hmUI.prop.MORE,
    hapticButtonProps(100, 'strong', t('settings_haptic_strong'))
  )
}

function refreshThemeButtons() {
  widgets.darkButton.setProperty(
    hmUI.prop.MORE,
    themeButtonProps(20, 'dark', t('settings_theme_dark'))
  )
  widgets.lightButton.setProperty(
    hmUI.prop.MORE,
    themeButtonProps(100, 'light', t('settings_theme_light'))
  )
}

function setWidgetColor(widget, color) {
  widget.setProperty(hmUI.prop.MORE, { color })
}

function setWidgetText(widget, text) {
  widget.setProperty(hmUI.prop.TEXT, text)
}

function applyLanguageToSettings() {
  setWidgetText(widgets.title, t('settings_title'))
  setWidgetText(widgets.languageLabel, t('settings_lang_label'))
  widgets.languageButton.setProperty(hmUI.prop.MORE, { text: languageName() })
  setWidgetText(widgets.themeLabel, t('settings_theme_label'))
  refreshThemeButtons()
  setWidgetText(widgets.hapticLabel, t('settings_haptic_label'))
  refreshHapticButtons()
  setWidgetText(widgets.aboutLabel, t('settings_about_label'))
  setWidgetText(widgets.versionText, t('settings_version'))
  setWidgetText(widgets.targetText, t('settings_target'))
  widgets.backButton.setProperty(hmUI.prop.MORE, { text: t('settings_btn_back') })
}

function applyThemeToSettings() {
  activeTheme = getTheme(getThemeMode())

  setWidgetColor(widgets.background, activeTheme.bg)
  setWidgetColor(widgets.title, activeTheme.accent)
  setWidgetColor(widgets.languageLabel, activeTheme.textSecondary)
  widgets.languageButton.setProperty(hmUI.prop.MORE, {
    normal_color: activeTheme.btnSecondary,
    press_color: activeTheme.cardBg,
    color: activeTheme.textPrimary
  })
  setWidgetColor(widgets.themeLabel, activeTheme.textSecondary)
  refreshThemeButtons()
  setWidgetColor(widgets.hapticLabel, activeTheme.textSecondary)
  refreshHapticButtons()
  setWidgetColor(widgets.aboutCard, activeTheme.cardBg)
  setWidgetColor(widgets.aboutLabel, activeTheme.textSecondary)
  setWidgetColor(widgets.versionText, activeTheme.textPrimary)
  setWidgetColor(widgets.targetText, activeTheme.accent)
  widgets.backButton.setProperty(hmUI.prop.MORE, {
    normal_color: activeTheme.btnSecondary,
    press_color: activeTheme.cardBg,
    color: activeTheme.textPrimary
  })
}

function chooseHapticMode(mode) {
  setHapticMode(mode)
  vibrateShort()
  refreshHapticButtons()
}

function chooseThemeMode(mode) {
  setThemeMode(mode)
  applyThemeToSettings()
  vibrateShort()
}

Page({
  build() {
    initHaptics()
    activeTheme = getTheme(getThemeMode())

    widgets.background = hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0,
      y: Layout.y(0),
      w: Layout.width,
      h: Layout.height,
      color: activeTheme.bg
    })

    widgets.title = hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.leftMargin,
      y: Layout.y(32),
      w: Layout.contentWidth,
      h: Layout.h(24),
      text: t('settings_title'),
      text_size: Type.button,
      color: activeTheme.accent,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    })

    widgets.languageLabel = hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.leftMargin,
      y: Layout.y(64),
      w: Layout.contentWidth,
      h: Layout.h(18),
      text: t('settings_lang_label'),
      text_size: Type.caption,
      color: activeTheme.textSecondary,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    })

    widgets.languageButton = hmUI.createWidget(hmUI.widget.BUTTON, {
      x: Layout.leftMargin,
      y: Layout.y(84),
      w: Layout.contentWidth,
      h: Layout.h(42),
      radius: Layout.h(21),
      normal_color: activeTheme.btnSecondary,
      press_color: activeTheme.cardBg,
      text: languageName(),
      text_size: Type.button,
      color: activeTheme.textPrimary,
      click_func() {
        setLanguage(getLanguage() === 'es' ? 'en' : 'es')
        vibrateShort()
        applyLanguageToSettings()
      }
    })

    widgets.themeLabel = hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.leftMargin,
      y: Layout.y(130),
      w: Layout.contentWidth,
      h: Layout.h(18),
      text: t('settings_theme_label'),
      text_size: Type.caption,
      color: activeTheme.textSecondary,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    })

    widgets.darkButton = hmUI.createWidget(hmUI.widget.BUTTON, {
      ...themeButtonProps(20, 'dark', t('settings_theme_dark')),
      click_func() {
        chooseThemeMode('dark')
      }
    })

    widgets.lightButton = hmUI.createWidget(hmUI.widget.BUTTON, {
      ...themeButtonProps(100, 'light', t('settings_theme_light')),
      click_func() {
        chooseThemeMode('light')
      }
    })

    widgets.hapticLabel = hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.leftMargin,
      y: Layout.y(198),
      w: Layout.contentWidth,
      h: Layout.h(18),
      text: t('settings_haptic_label'),
      text_size: Type.caption,
      color: activeTheme.textSecondary,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    })

    widgets.normalButton = hmUI.createWidget(hmUI.widget.BUTTON, {
      ...hapticButtonProps(20, 'normal', t('settings_haptic_normal')),
      click_func() {
        chooseHapticMode('normal')
      }
    })

    widgets.strongButton = hmUI.createWidget(hmUI.widget.BUTTON, {
      ...hapticButtonProps(100, 'strong', t('settings_haptic_strong')),
      click_func() {
        chooseHapticMode('strong')
      }
    })

    widgets.aboutCard = hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: Layout.leftMargin,
      y: Layout.y(276),
      w: Layout.contentWidth,
      h: Layout.h(82),
      radius: Layout.cardRadius,
      color: activeTheme.cardBg
    })

    widgets.aboutLabel = hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.innerMargin,
      y: Layout.y(285),
      w: Layout.innerWidth,
      h: Layout.h(16),
      text: t('settings_about_label'),
      text_size: 11,
      color: activeTheme.textSecondary,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    })

    widgets.versionText = hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.innerMargin,
      y: Layout.y(307),
      w: Layout.innerWidth,
      h: Layout.h(20),
      text: t('settings_version'),
      text_size: 13,
      color: activeTheme.textPrimary,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    })

    widgets.targetText = hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.innerMargin,
      y: Layout.y(332),
      w: Layout.innerWidth,
      h: Layout.h(20),
      text: t('settings_target'),
      text_size: 11,
      color: activeTheme.accent,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.WRAP
    })

    widgets.backButton = hmUI.createWidget(hmUI.widget.BUTTON, {
      x: Layout.leftMargin,
      y: Layout.y(382),
      w: Layout.contentWidth,
      h: Layout.h(44),
      radius: Layout.h(22),
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
    Object.keys(widgets).forEach((key) => {
      widgets[key] = null
    })
    activeTheme = getTheme('light')
  }
})
