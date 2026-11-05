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
      x: 16, y: 48, w: 160, h: 28,
      text: t('trip_status_monitoring'), text_size: Type.brand, color: Colors.Mint400,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V
    })
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 16, y: 126, w: 160, h: 28,
      text: t('trip_eta_label'), text_size: Type.body, color: Colors.Slate350,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V
    })
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 16, y: 158, w: 160, h: 58,
      text: '12 min', text_size: 36, color: Colors.White,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V
    })
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 16, y: 228, w: 160, h: 28,
      text: t('trip_early_alert'), text_size: Type.body, color: Colors.Cyan500,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V
    })
    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: 16, y: 340, w: 160, h: 54, radius: 27,
      normal_color: Colors.Coral400, press_color: Colors.Amber400,
      text: t('btn_finish_trip'), text_size: Type.button, color: Colors.Ink,
      click_func() {
        vibrateShort()
        hmApp.gotoHome()
      }
    })
  },

  onDestroy() {
    destroyHaptics()
  }
})
