import { getLanguage, t } from '../utils/i18n'
import {
  clearCustomDestination,
  getCustomDestination,
  getSelectedDestination,
  setSelectedDestination
} from '../utils/session'
import { layoutValue } from '../utils/layout'
import { createPageBackground, getActiveTheme } from '../utils/theme'

let statusWidget = null
let pageAlive = false
let homeButton = null
let universityButton = null

function destinationLabel(destination) {
  if (getLanguage() === 'en') {
    if (destination === 'Universidad') return 'University'
    if (destination === 'Casa') return 'Home'
    return destination
  }
  return destination
}

function updateSelection(button, selected, theme) {
  if (!button || typeof button.setProperty !== 'function' ||
      typeof hmUI === 'undefined' || !hmUI.prop ||
      hmUI.prop.MORE === undefined) return
  try {
    button.setProperty(hmUI.prop.MORE, {
      normal_color: selected ? theme.accent : theme.btnSecondary,
      press_color: selected ? theme.accentPress : theme.btnSecondaryPress,
      color: selected ? theme.onAccent : theme.btnSecondaryText
    })
  } catch (error) {
    console.log('RideWake Inicio: selection update failed')
  }
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
    const theme = getActiveTheme()
    createPageBackground()
    let destination = getSelectedDestination() || getCustomDestination()
    let standardDestination = getSelectedDestination()

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(24, 48), w: 168, h: layoutValue(26, 28),
      text: t('brand'), text_size: 20, color: theme.title,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(58, 90), w: 168, h: 24,
      text: t('home_question'), text_size: layoutValue(15, 16), color: theme.textPrimary,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })

    homeButton = hmUI.createWidget(hmUI.widget.BUTTON, {
      x: layoutValue(20, 18), y: layoutValue(94, 136),
      w: layoutValue(68, 72), h: layoutValue(68, 72), radius: layoutValue(34, 36),
      normal_color: theme.btnSecondary, press_color: theme.btnSecondaryPress,
      text: 'Casa',
      text_size: 16, color: theme.btnSecondaryText,
      click_func: function () {
        clearCustomDestination()
        destination = setSelectedDestination('Casa')
        standardDestination = destination
        updateSelection(homeButton, true, theme)
        updateSelection(universityButton, false, theme)
        updateStatus(t('home_selected') + destinationLabel(destination))
      }
    })

    universityButton = hmUI.createWidget(hmUI.widget.BUTTON, {
      x: layoutValue(104, 102), y: layoutValue(94, 136),
      w: layoutValue(68, 72), h: layoutValue(68, 72), radius: layoutValue(34, 36),
      normal_color: theme.btnSecondary, press_color: theme.btnSecondaryPress,
      text: 'Uni',
      text_size: 16, color: theme.btnSecondaryText,
      click_func: function () {
        clearCustomDestination()
        destination = setSelectedDestination('Universidad')
        standardDestination = destination
        updateSelection(homeButton, false, theme)
        updateSelection(universityButton, true, theme)
        updateStatus(t('home_selected') + destinationLabel(destination))
      }
    })
    updateSelection(homeButton, standardDestination === 'Casa', theme)
    updateSelection(universityButton, standardDestination === 'Universidad', theme)

    statusWidget = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(200, 258), w: 168, h: layoutValue(12, 28),
      text: destination ? t('home_selected') + destinationLabel(destination) : t('home_choose'),
      text_size: layoutValue(14, 15), color: theme.textSecondary,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.WRAP
    })

    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: layoutValue(60, 57), y: layoutValue(216, 296),
      w: layoutValue(72, 78), h: layoutValue(72, 78), radius: layoutValue(36, 39),
      normal_color: theme.accent, press_color: theme.accentPress,
      text: 'IR', text_size: layoutValue(20, 22), color: theme.onAccent,
      click_func: function () {
        if (!standardDestination) {
          updateStatus(t('home_first'))
          return
        }
        setSelectedDestination(standardDestination)
        updateStatus(t('home_ready') + destinationLabel(destination))
        openPage('page/destination')
      }
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(290, 382), w: 168, h: layoutValue(16, 20),
      text: t('home_start'), text_size: 14, color: theme.textSecondary,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })

    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: 44, y: layoutValue(313, 430), w: 104, h: layoutValue(32, 34), radius: 10,
      normal_color: theme.btnSecondary, press_color: theme.btnSecondaryPress,
      text: t('home_settings'), text_size: 11, color: theme.btnSecondaryText,
      click_func: function () {
        openPage('page/settings')
      }
    })

    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: 28, y: layoutValue(166, 214), w: 136, h: layoutValue(32, 36), radius: 10,
      normal_color: theme.btnSecondary, press_color: theme.btnSecondaryPress,
      text: t('home_other_destination'), text_size: 11,
      color: theme.btnSecondaryText,
      click_func: function () { openPage('page/keyboard') }
    })
  },

  onDestroy() {
    pageAlive = false
    statusWidget = null
    homeButton = null
    universityButton = null
  }
})
