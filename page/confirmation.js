import { Colors, Layout, Type } from '../utils/theme'
import { t } from '../utils/i18n'
import { getSelectedDestination } from '../utils/session'
import { destroyHaptics, initHaptics, vibrateShort } from '../utils/haptics'

Page({
  build() {
    initHaptics()
    const selectedDestination = getSelectedDestination()
    const destinationName = selectedDestination
      ? t(`dest_${selectedDestination}`)
      : ''

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0, y: 0, w: Layout.width, h: Layout.height, color: Colors.Navy950
    })
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 16, y: 90, w: 160, h: 72,
      text: t('confirmation_title'), text_size: Type.headline, color: Colors.Mint400,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.WRAP
    })
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 16, y: 168, w: 160, h: 42,
      text: destinationName, text_size: Type.headline, color: Colors.Mint400,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.WRAP
    })
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 16, y: 218, w: 160, h: 60,
      text: t('confirmation_body'), text_size: Type.body, color: Colors.Slate350,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.WRAP
    })
    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: 16, y: 290, w: 160, h: 54, radius: 27,
      normal_color: Colors.Cyan500, press_color: Colors.Mint400,
      text: t('dest_continue'), text_size: Type.button, color: Colors.Ink,
      click_func() {
        vibrateShort()
        hmApp.gotoPage({ url: 'page/trip' })
      }
    })
  },

  onDestroy() {
    destroyHaptics()
  }
})
