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
      y: Layout.y(35),
      w: Layout.contentWidth,
      h: 20,
      text: t('conf_title'),
      text_size: Type.body,
      color: theme.accent,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.leftMargin,
      y: Layout.y(60),
      w: Layout.contentWidth,
      h: 28,
      text: t('conf_subtitle'),
      text_size: Type.brand,
      color: theme.textPrimary,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    })

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: Layout.leftMargin,
      y: Layout.y(105),
      w: Layout.contentWidth,
      h: 180,
      radius: 16,
      color: theme.cardBg
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 24,
      y: Layout.y(115),
      w: 144,
      h: 18,
      text: t('conf_destination_label'),
      text_size: Type.caption,
      color: theme.textSecondary,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 24,
      y: Layout.y(135),
      w: 144,
      h: 32,
      text: destinationName,
      text_size: 20,
      color: theme.success,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.WRAP
    })

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 32,
      y: Layout.y(174),
      w: 128,
      h: 1,
      color: theme.divider
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 24,
      y: Layout.y(182),
      w: 144,
      h: 32,
      text: `${t('conf_dist_label')} / ${t('conf_eta_label')}`,
      text_size: Type.caption,
      color: theme.textSecondary,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.WRAP
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 24,
      y: Layout.y(218),
      w: 144,
      h: 28,
      text: '3.2 km  •  12 min',
      text_size: Type.button,
      color: theme.textPrimary,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    })

    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: Layout.leftMargin,
      y: Layout.y(315),
      w: Layout.contentWidth,
      h: 52,
      radius: 26,
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
      y: Layout.y(380),
      w: Layout.contentWidth,
      h: 44,
      radius: 22,
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
