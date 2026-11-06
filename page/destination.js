import { getTheme, Layout, Type } from '../utils/theme'
import { t } from '../utils/i18n'
import { getSelectedDestination, getThemeMode, setSelectedDestination } from '../utils/session'
import { destroyHaptics, initHaptics, vibrateShort } from '../utils/haptics'

let currentSelection = null
let homeButton = null
let universityButton = null
let continueButton = null
let activeTheme = getTheme('light')

function destinationButtonProps(y, destination, text) {
  const isSelected = currentSelection === destination

  return {
    x: Layout.leftMargin,
    y: Layout.y(y),
    w: Layout.contentWidth,
    h: Layout.h(54),
    radius: Layout.h(27),
    normal_color: isSelected ? activeTheme.accent : activeTheme.btnSecondary,
    press_color: isSelected ? activeTheme.success : activeTheme.cardBg,
    text,
    text_size: Type.button,
    color: isSelected ? activeTheme.onAccent : activeTheme.textPrimary
  }
}

function continueButtonProps() {
  const isEnabled = currentSelection !== null

  return {
    x: Layout.leftMargin,
    y: Layout.y(300),
    w: Layout.contentWidth,
    h: Layout.h(52),
    radius: Layout.h(26),
    normal_color: isEnabled ? activeTheme.success : activeTheme.disabledBg,
    press_color: isEnabled ? activeTheme.accent : activeTheme.disabledBg,
    text: t('dest_continue'),
    text_size: Type.button,
    color: isEnabled ? activeTheme.onAccent : activeTheme.disabledText
  }
}

function refreshSelection() {
  homeButton.setProperty(
    hmUI.prop.MORE,
    destinationButtonProps(126, 'home', t('dest_home'))
  )
  universityButton.setProperty(
    hmUI.prop.MORE,
    destinationButtonProps(194, 'university', t('dest_university'))
  )
  continueButton.setProperty(hmUI.prop.MORE, continueButtonProps())
}

function selectDestination(destination) {
  vibrateShort()
  currentSelection = destination
  setSelectedDestination(destination)
  refreshSelection()
}

Page({
  build() {
    initHaptics()
    activeTheme = getTheme(getThemeMode())
    currentSelection = getSelectedDestination()

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0,
      y: Layout.y(0),
      w: Layout.width,
      h: Layout.height,
      color: activeTheme.bg
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.leftMargin,
      y: Layout.y(38),
      w: Layout.contentWidth,
      h: Layout.h(20),
      text: t('dest_header'),
      text_size: Type.body,
      color: activeTheme.accent,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.leftMargin,
      y: Layout.y(66),
      w: Layout.contentWidth,
      h: Layout.h(38),
      text: t('dest_subtitle'),
      text_size: 20,
      color: activeTheme.textPrimary,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.WRAP
    })

    homeButton = hmUI.createWidget(hmUI.widget.BUTTON, {
      ...destinationButtonProps(126, 'home', t('dest_home')),
      click_func() {
        selectDestination('home')
      }
    })

    universityButton = hmUI.createWidget(hmUI.widget.BUTTON, {
      ...destinationButtonProps(194, 'university', t('dest_university')),
      click_func() {
        selectDestination('university')
      }
    })

    continueButton = hmUI.createWidget(hmUI.widget.BUTTON, {
      ...continueButtonProps(),
      click_func() {
        if (currentSelection === null) return

        vibrateShort()
        hmApp.gotoPage({ url: 'page/confirmation' })
      }
    })

    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: Layout.leftMargin,
      y: Layout.y(372),
      w: Layout.contentWidth,
      h: Layout.h(44),
      radius: Layout.h(22),
      normal_color: activeTheme.cardBg,
      press_color: activeTheme.btnSecondary,
      text: t('dest_back'),
      text_size: Type.body,
      color: activeTheme.textSecondary,
      click_func() {
        vibrateShort()
        hmApp.goBack()
      }
    })
  },

  onDestroy() {
    destroyHaptics()
    homeButton = null
    universityButton = null
    continueButton = null
    activeTheme = getTheme('light')
  }
})
