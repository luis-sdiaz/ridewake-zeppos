import { getLanguage, t } from '../utils/i18n'
import {
  clearCustomDestination,
  getDestinationDisplayName,
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
  return getDestinationDisplayName(destination, getLanguage()) || ''
}

function updateSelection(button, selected, theme) {
  if (!pageAlive || !button || typeof button.setProperty !== 'function' ||
      typeof hmUI === 'undefined' || !hmUI.prop ||
      hmUI.prop.MORE === undefined) return
  try {
    button.setProperty(hmUI.prop.MORE, {
      normal_color: selected ? theme.accent : theme.btnSecondary,
      press_color: selected ? theme.accentPress : theme.btnSecondaryPress,
      color: selected ? theme.onAccent : theme.btnSecondaryText,
      text_size: selected ? 19 : 16
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
  if (!pageAlive) return false
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
    if (pageAlive) return
    pageAlive = true
    const theme = getActiveTheme()
    createPageBackground()
    let destination = getSelectedDestination()

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(22, 42), w: 168, h: layoutValue(24, 28),
      text: t('brand'), text_size: 19, color: theme.title,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(52, 82), w: 168, h: 24,
      text: t('home_question'),
      text_size: getLanguage() === 'en' ? 14 : layoutValue(15, 16), color: theme.textPrimary,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })

    homeButton = hmUI.createWidget(hmUI.widget.BUTTON, {
      x: 12, y: layoutValue(88, 132),
      w: 78, h: layoutValue(54, 72), radius: layoutValue(18, 24),
      normal_color: theme.btnSecondary, press_color: theme.btnSecondaryPress,
      text: getLanguage() === 'en' ? 'Home' : 'Casa',
      text_size: 16, color: theme.btnSecondaryText,
      click_func: function () {
        if (!pageAlive) return
        clearCustomDestination()
        destination = setSelectedDestination('Casa')
        updateSelection(homeButton, true, theme)
        updateSelection(universityButton, false, theme)
        updateStatus(t('home_selected') + destinationLabel(destination))
      }
    })

    universityButton = hmUI.createWidget(hmUI.widget.BUTTON, {
      x: 102, y: layoutValue(88, 132),
      w: 78, h: layoutValue(54, 72), radius: layoutValue(18, 24),
      normal_color: theme.btnSecondary, press_color: theme.btnSecondaryPress,
      text: 'Uni',
      text_size: 16, color: theme.btnSecondaryText,
      click_func: function () {
        if (!pageAlive) return
        clearCustomDestination()
        destination = setSelectedDestination('Universidad')
        updateSelection(homeButton, false, theme)
        updateSelection(universityButton, true, theme)
        updateStatus(t('home_selected') + destinationLabel(destination))
      }
    })
    updateSelection(homeButton, destination === 'Casa', theme)
    updateSelection(universityButton, destination === 'Universidad', theme)

    statusWidget = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(192, 270), w: 168, h: layoutValue(36, 42),
      text: destination ? t('home_selected') + destinationLabel(destination) : t('home_choose'),
      text_size: 14, color: theme.textPrimary,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.WRAP
    })

    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: 24, y: layoutValue(236, 330),
      w: 144, h: layoutValue(50, 68), radius: layoutValue(25, 34),
      normal_color: theme.accent, press_color: theme.accentPress,
      text: getLanguage() === 'en' ? 'GO' : 'IR',
      text_size: layoutValue(26, 30), color: theme.onAccent,
      click_func: function () {
        if (!pageAlive) return
        destination = getSelectedDestination()
        if (!destination) {
          updateStatus(t('home_first'))
          return
        }
        updateStatus(t('home_ready') + destinationLabel(destination))
        openPage('page/destination')
      }
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(290, 404), w: 168, h: layoutValue(16, 20),
      text: t('home_start'), text_size: 12, color: theme.textSecondary,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })

    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: 44, y: layoutValue(312, 436), w: 104, h: layoutValue(28, 34), radius: 14,
      normal_color: theme.bg, press_color: theme.btnSecondary,
      text: t('home_settings'), text_size: 11, color: theme.textSecondary,
      click_func: function () {
        openPage('page/settings')
      }
    })

    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: 12, y: layoutValue(152, 218), w: 168, h: layoutValue(32, 36), radius: 12,
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
