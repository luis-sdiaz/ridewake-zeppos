import { Colors, Layout, Type } from '../utils/theme'
import { t } from '../utils/i18n'
import { getSelectedDestination, setSelectedDestination } from '../utils/session'
import { destroyHaptics, initHaptics, vibrateShort } from '../utils/haptics'

let currentSelection = null
let homeButton = null
let universityButton = null
let continueButton = null

function destinationButtonProps(y, destination, text) {
  const isSelected = currentSelection === destination

  return {
    x: Layout.leftMargin,
    y,
    w: Layout.contentWidth,
    h: 56,
    radius: 16,
    normal_color: isSelected ? Colors.Cyan500 : Colors.Navy700,
    press_color: isSelected ? Colors.Mint400 : Colors.DisabledSurface,
    text,
    text_size: Type.button,
    color: isSelected ? Colors.Ink : Colors.White
  }
}

function continueButtonProps() {
  const isEnabled = currentSelection !== null

  return {
    x: Layout.leftMargin,
    y: 310,
    w: Layout.contentWidth,
    h: 52,
    radius: 26,
    normal_color: isEnabled ? Colors.Mint400 : Colors.DisabledSurface,
    press_color: isEnabled ? Colors.Cyan500 : Colors.DisabledSurface,
    text: t('dest_continue'),
    text_size: Type.button,
    color: isEnabled ? Colors.Ink : Colors.DisabledContent
  }
}

function refreshSelection() {
  homeButton.setProperty(
    hmUI.prop.MORE,
    destinationButtonProps(130, 'home', t('dest_home'))
  )
  universityButton.setProperty(
    hmUI.prop.MORE,
    destinationButtonProps(200, 'university', t('dest_university'))
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
    currentSelection = getSelectedDestination()

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0,
      y: 0,
      w: Layout.width,
      h: Layout.height,
      color: Colors.Navy950
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.leftMargin,
      y: 40,
      w: Layout.contentWidth,
      h: 20,
      text: t('dest_header'),
      text_size: Type.body,
      color: Colors.Cyan500,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: Layout.leftMargin,
      y: 65,
      w: Layout.contentWidth,
      h: 36,
      text: t('dest_subtitle'),
      text_size: 20,
      color: Colors.White,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.WRAP
    })

    homeButton = hmUI.createWidget(hmUI.widget.BUTTON, {
      ...destinationButtonProps(130, 'home', t('dest_home')),
      click_func() {
        selectDestination('home')
      }
    })

    universityButton = hmUI.createWidget(hmUI.widget.BUTTON, {
      ...destinationButtonProps(200, 'university', t('dest_university')),
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
      y: 380,
      w: Layout.contentWidth,
      h: 44,
      radius: 22,
      normal_color: Colors.Navy900,
      press_color: Colors.Navy700,
      text: t('dest_back'),
      text_size: Type.body,
      color: Colors.Slate350,
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
  }
})
