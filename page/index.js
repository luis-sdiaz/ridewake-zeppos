import { getLanguage, t } from '../utils/i18n'
import { getSelectedDestination, setSelectedDestination } from '../utils/session'
import { layoutValue } from '../utils/layout'

let statusWidget = null
let pageAlive = false

function destinationLabel(destination) {
  if (getLanguage() === 'en') {
    return destination === 'Universidad' ? 'University' : 'Home'
  }
  return destination
}

function updateStatus(text) {
  if (!pageAlive || !statusWidget ||
      typeof statusWidget.setProperty !== 'function' ||
      typeof hmUI === 'undefined' || !hmUI.prop) return
  try {
    if (hmUI.prop.MORE !== undefined) {
      statusWidget.setProperty(hmUI.prop.MORE, { text: text })
      return
    }
    if (hmUI.prop.TEXT !== undefined) {
      statusWidget.setProperty(hmUI.prop.TEXT, text)
    }
  } catch (error) {
    console.log('RideWake Inicio: status update failed')
  }
}

function openPage(url) {
  try {
    if (typeof hmApp !== 'undefined' && typeof hmApp.gotoPage === 'function') {
      hmApp.gotoPage({ url: url })
      return true
    }
  } catch (error) {
    console.log('RideWake Inicio: navigation failed')
  }
  updateStatus(t('home_nav_error'))
  return false
}

Page({
  build() {
    pageAlive = true
    let destination = getSelectedDestination()

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(24, 48), w: 168, h: layoutValue(26, 28),
      text: t('brand'), text_size: 20, color: 0x35dce8,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(58, 90), w: 168, h: 24,
      text: t('home_question'), text_size: layoutValue(15, 16), color: 0xffffff,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })

    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: layoutValue(20, 18), y: layoutValue(94, 136),
      w: layoutValue(68, 72), h: layoutValue(68, 72), radius: layoutValue(34, 36),
      normal_color: 0x16353a, press_color: 0x24636a,
      text: 'Casa',
      text_size: 16, color: 0x72edf2,
      click_func: function () {
        destination = setSelectedDestination('Casa')
        updateStatus(t('home_selected') + destinationLabel(destination))
      }
    })

    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: layoutValue(104, 102), y: layoutValue(94, 136),
      w: layoutValue(68, 72), h: layoutValue(68, 72), radius: layoutValue(34, 36),
      normal_color: 0x16353a, press_color: 0x24636a,
      text: 'Uni',
      text_size: 16, color: 0x72edf2,
      click_func: function () {
        destination = setSelectedDestination('Universidad')
        updateStatus(t('home_selected') + destinationLabel(destination))
      }
    })

    statusWidget = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(174, 224), w: 168, h: layoutValue(32, 40),
      text: destination ? t('home_selected') + destinationLabel(destination) : t('home_choose'),
      text_size: layoutValue(14, 15), color: 0xb5c6c8,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.WRAP
    })

    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: layoutValue(60, 57), y: layoutValue(212, 286),
      w: layoutValue(72, 78), h: layoutValue(72, 78), radius: layoutValue(36, 39),
      normal_color: 0x20cbd6, press_color: 0x118993,
      text: 'IR', text_size: layoutValue(20, 22), color: 0x00191b,
      click_func: function () {
        if (!destination) {
          updateStatus(t('home_first'))
          return
        }
        setSelectedDestination(destination)
        updateStatus(t('home_ready') + destinationLabel(destination))
        openPage('page/destination')
      }
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(286, 374), w: 168, h: layoutValue(16, 20),
      text: t('home_start'), text_size: 14, color: 0xb5c6c8,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })

    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: layoutValue(76, 73), y: layoutValue(304, 414),
      w: layoutValue(40, 46), h: layoutValue(40, 46), radius: layoutValue(20, 23),
      normal_color: 0x16353a, press_color: 0x24636a,
      text: t('home_settings'), text_size: layoutValue(11, 12), color: 0x72edf2,
      click_func: function () {
        openPage('page/settings')
      }
    })
  },

  onDestroy() {
    pageAlive = false
    statusWidget = null
  }
})
