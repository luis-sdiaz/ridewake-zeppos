import { getTheme, Layout, Type } from '../utils/theme'
import { t } from '../utils/i18n'
import { getThemeMode } from '../utils/session'
import { destroyHaptics, initHaptics, vibrateShort } from '../utils/haptics'

function textBase(y, h, size, color) {
  return {
    x: Layout.leftMargin,
    y: Layout.y(y),
    w: Layout.contentWidth,
    h,
    text_size: size,
    color,
    align_h: hmUI.align.CENTER_H,
    align_v: hmUI.align.CENTER_V,
    text_style: hmUI.text_style.WRAP
  }
}

Page({
  build() {
    initHaptics()
    const theme = getTheme(getThemeMode())

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0,
      y: Layout.y(0),
      w: Layout.width,
      h: Layout.height,
      color: theme.bg
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      ...textBase(45, 28, Type.brand, theme.accent),
      text: t('brand_title')
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      ...textBase(85, 64, Type.headline, theme.textPrimary),
      text: t('home_headline')
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      ...textBase(165, 52, Type.body, theme.textSecondary),
      text: t('home_description')
    })

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 29,
      y: Layout.y(228),
      w: 134,
      h: 26,
      radius: 13,
      color: theme.btnSecondary
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 32,
      y: Layout.y(228),
      w: 128,
      h: 26,
      text: t('home_status'),
      text_size: 10,
      color: theme.success,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    })

    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: 16,
      y: Layout.y(270),
      w: 160,
      h: 54,
      radius: 27,
      normal_color: theme.accent,
      press_color: theme.success,
      text: t('btn_start_trip'),
      text_size: Type.button,
      color: theme.onAccent,
      click_func() {
        vibrateShort()
        hmApp.gotoPage({ url: 'page/destination' })
      }
    })

    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: 16,
      y: Layout.y(340),
      w: 160,
      h: 48,
      radius: 24,
      normal_color: theme.btnSecondary,
      press_color: theme.cardBg,
      text: t('btn_settings'),
      text_size: Type.button,
      color: theme.textPrimary,
      click_func() {
        vibrateShort()
        hmApp.gotoPage({ url: 'page/settings' })
      }
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      ...textBase(418, 24, Type.caption, theme.textMuted),
      text: 'ES / EN'
    })
  },

  onDestroy() {
    destroyHaptics()
  }
})
