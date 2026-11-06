import { getTheme, Layout, Type } from '../utils/theme'
import { t } from '../utils/i18n'
import { getSelectedDestination, getThemeMode } from '../utils/session'
import { destroyHaptics, initHaptics, vibrateShort } from '../utils/haptics'

Page({
  build() {
    initHaptics()
    const theme = getTheme(getThemeMode())

    const selectedDestination = getSelectedDestination() || 'home'
    const destinationName = t(`dest_${selectedDestination}`)

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0,
      y: Layout.y(0),
      w: Layout.width,
      h: Layout.height,
      color: theme.bg
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.leftMargin,
      y: Layout.y(36),
      w: Layout.contentWidth,
      h: Layout.h(20),
      text: t('conf_title'),
      text_size: Type.body,
      color: theme.accent,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.leftMargin,
      y: Layout.y(64),
      w: Layout.contentWidth,
      h: Layout.h(28),
      text: t('conf_subtitle'),
      text_size: Type.brand,
      color: theme.textPrimary,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    })

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: Layout.leftMargin,
      y: Layout.y(108),
      w: Layout.contentWidth,
      h: Layout.h(170),
      radius: Layout.cardRadius,
      color: theme.cardBg
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.innerMargin,
      y: Layout.y(120),
      w: Layout.innerWidth,
      h: Layout.h(18),
      text: t('conf_destination_label'),
      text_size: Type.caption,
      color: theme.textSecondary,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.innerMargin,
      y: Layout.y(143),
      w: Layout.innerWidth,
      h: Layout.h(30),
      text: destinationName,
      text_size: 20,
      color: theme.success,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.WRAP
    })

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: Layout.innerMargin,
      y: Layout.y(184),
      w: Layout.innerWidth,
      h: Layout.h(2),
      color: theme.divider
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.innerMargin,
      y: Layout.y(196),
      w: 64,
      h: Layout.h(28),
      text: t('conf_dist_label'),
      text_size: Type.caption,
      color: theme.textSecondary,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.WRAP
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.innerMargin,
      y: Layout.y(228),
      w: 64,
      h: Layout.h(26),
      text: '3.2 km',
      text_size: Type.button,
      color: theme.textPrimary,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 100,
      y: Layout.y(196),
      w: 64,
      h: Layout.h(28),
      text: t('conf_eta_label'),
      text_size: Type.caption,
      color: theme.textSecondary,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.WRAP
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 100,
      y: Layout.y(228),
      w: 64,
      h: Layout.h(26),
      text: '12 min',
      text_size: Type.button,
      color: theme.textPrimary,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    })

    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: Layout.leftMargin,
      y: Layout.y(304),
      w: Layout.contentWidth,
      h: Layout.h(52),
      radius: Layout.h(26),
      normal_color: theme.success,
      press_color: theme.accent,
      text: t('conf_btn_start'),
      text_size: Type.button,
      color: theme.onAccent,
      click_func() {
        vibrateShort()
        hmApp.gotoPage({ url: 'page/trip' })
      }
    })

    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: Layout.leftMargin,
      y: Layout.y(372),
      w: Layout.contentWidth,
      h: Layout.h(44),
      radius: Layout.h(22),
      normal_color: theme.btnSecondary,
      press_color: theme.cardBg,
      text: t('conf_btn_change'),
      text_size: Type.body,
      color: theme.textPrimary,
      click_func() {
        vibrateShort()
        hmApp.goBack()
      }
    })
  },

  onDestroy() {
    destroyHaptics()
  }
})
