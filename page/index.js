import { Colors, Layout, Type } from '../utils/theme'
import { t } from '../utils/i18n'
import { destroyHaptics, initHaptics, vibrateShort } from '../utils/haptics'

function textBase(y, h, size, color) {
  return {
    x: Layout.leftMargin,
    y,
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

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0,
      y: 0,
      w: Layout.width,
      h: Layout.height,
      color: Colors.Navy950
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      ...textBase(45, 28, Type.brand, Colors.Cyan500),
      text: t('brand_title')
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      ...textBase(85, 64, Type.headline, Colors.White),
      text: t('home_headline')
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      ...textBase(165, 52, Type.body, Colors.Slate350),
      text: t('home_description')
    })

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 29,
      y: 228,
      w: 134,
      h: 26,
      radius: 13,
      color: Colors.Navy700
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 32,
      y: 228,
      w: 128,
      h: 26,
      text: t('home_status'),
      text_size: 10,
      color: Colors.Mint400,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    })

    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: 16,
      y: 270,
      w: 160,
      h: 54,
      radius: 27,
      normal_color: Colors.Cyan500,
      press_color: Colors.Mint400,
      text: t('btn_start_trip'),
      text_size: Type.button,
      color: Colors.Ink,
      click_func() {
        vibrateShort()
        hmApp.gotoPage({ url: 'page/destination' })
      }
    })

    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: 16,
      y: 340,
      w: 160,
      h: 48,
      radius: 24,
      normal_color: Colors.Navy700,
      press_color: Colors.DisabledSurface,
      text: t('btn_settings'),
      text_size: Type.button,
      color: Colors.White,
      click_func() {
        vibrateShort()
        hmApp.gotoPage({ url: 'page/settings' })
      }
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      ...textBase(418, 24, Type.caption, Colors.Slate500),
      text: 'ES / EN'
    })
  },

  onDestroy() {
    destroyHaptics()
  }
})
