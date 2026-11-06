import { getTheme, Layout, Type } from '../utils/theme'
import { t } from '../utils/i18n'
import { getThemeMode } from '../utils/session'
import { destroyHaptics, initHaptics, vibrateShort } from '../utils/haptics'

Page({
  build() {
    initHaptics()
    const theme = getTheme(getThemeMode())
    const compact = Layout.height < 420
    const homeLayout = compact
      ? { titleY: 42, titleH: 52, heroY: 98, statusY: 230, statusH: 24, primaryY: 263, primaryH: 46, settingsY: 317, settingsH: 28 }
      : { titleY: 64, titleH: 60, heroY: 146, statusY: 282, statusH: 28, primaryY: 330, primaryH: 52, settingsY: 404, settingsH: 36 }

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0,
      y: Layout.y(0),
      w: Layout.width,
      h: Layout.height,
      color: theme.bg
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.leftMargin,
      y: homeLayout.titleY,
      w: Layout.contentWidth,
      h: homeLayout.titleH,
      text_size: 20,
      color: theme.textPrimary,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.WRAP,
      text: t('home_headline')
    })

    // Anillo decorativo sin datos ficticios: representa una ruta lista para comenzar.
    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 34,
      y: homeLayout.heroY,
      w: 124,
      h: 124,
      radius: 62,
      color: theme.accent
    })

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 40,
      y: homeLayout.heroY + 6,
      w: 112,
      h: 112,
      radius: 56,
      color: theme.cardBg
    })

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 94,
      y: homeLayout.heroY + 39,
      w: 4,
      h: 47,
      radius: 2,
      color: theme.divider
    })

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 87,
      y: homeLayout.heroY + 28,
      w: 18,
      h: 18,
      radius: 9,
      color: theme.accent
    })

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 92,
      y: homeLayout.heroY + 33,
      w: 8,
      h: 8,
      radius: 4,
      color: theme.onAccent
    })

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 87,
      y: homeLayout.heroY + 79,
      w: 18,
      h: 18,
      radius: 9,
      color: theme.success
    })

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 92,
      y: homeLayout.heroY + 84,
      w: 8,
      h: 8,
      radius: 4,
      color: theme.cardBg
    })

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 61,
      y: homeLayout.statusY,
      w: 70,
      h: homeLayout.statusH,
      radius: 14,
      color: theme.btnSecondary
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 61,
      y: homeLayout.statusY,
      w: 70,
      h: homeLayout.statusH,
      text: t('home_status'),
      text_size: 11,
      color: theme.success,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    })

    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: Layout.leftMargin,
      y: homeLayout.primaryY,
      w: Layout.contentWidth,
      h: homeLayout.primaryH,
      radius: 26,
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
      x: 52,
      y: homeLayout.settingsY,
      w: 88,
      h: homeLayout.settingsH,
      radius: 18,
      normal_color: theme.bg,
      press_color: theme.cardBg,
      text: t('btn_settings'),
      text_size: Type.caption,
      color: theme.textMuted,
      click_func() {
        vibrateShort()
        hmApp.gotoPage({ url: 'page/settings' })
      }
    })

  },

  onDestroy() {
    destroyHaptics()
  }
})
