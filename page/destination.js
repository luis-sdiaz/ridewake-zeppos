import { Colors, Layout, Type } from '../utils/theme'
import { t } from '../utils/i18n'
import { destroyHaptics, initHaptics, vibrateShort } from '../utils/haptics'

Page({
  build() {
    initHaptics()

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0, y: 0, w: Layout.width, h: Layout.height, color: Colors.Navy950
    })
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 16, y: 54, w: 160, h: 60,
      text: t('dest_title'), text_size: Type.headline, color: Colors.White,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.WRAP
    })
    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: 16, y: 154, w: 160, h: 58, radius: 20,
      normal_color: Colors.Navy700, press_color: Colors.DisabledSurface,
      text: t('dest_home'), text_size: Type.button, color: Colors.White,
      click_func() {
        vibrateShort()
        hmApp.gotoPage({ url: 'page/confirmation', param: 'home' })
      }
    })
    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: 16, y: 230, w: 160, h: 58, radius: 20,
      normal_color: Colors.Navy700, press_color: Colors.DisabledSurface,
      text: t('dest_university'), text_size: Type.button, color: Colors.White,
      click_func() {
        vibrateShort()
        hmApp.gotoPage({ url: 'page/confirmation', param: 'university' })
      }
    })
  },

  onDestroy() {
    destroyHaptics()
  }
})
