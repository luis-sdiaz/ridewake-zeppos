import { getLanguage, t } from '../utils/i18n'
import { layoutValue } from '../utils/layout'
import { setCustomDestination } from '../utils/session'
import { createPageBackground, getActiveTheme } from '../utils/theme'

const GROUPS = ['ABC', 'DEF', 'GHI', 'JKL', 'MNÑ', 'OPQ', 'RST', 'UVW', 'XYZ']
const MAX_LENGTH = 20
const ACTION_WIDTH = 66
const ACTION_GAP = 12
const SCREEN_WIDTH = 192

let pageAlive = false
let keyboardMode = true
let finishing = false
let destinationText = ''
let activeLetters = []
let previewWidget = null
let messageWidget = null
let groupButtons = []
let groupBackButton = null
let spaceButton = null
let deleteButton = null
let doneButton = null

function setWidget(widget, properties) {
  if (!pageAlive || !widget || typeof widget.setProperty !== 'function') return
  try {
    if (hmUI.prop && hmUI.prop.MORE !== undefined) {
      widget.setProperty(hmUI.prop.MORE, properties)
    } else if (hmUI.prop && hmUI.prop.TEXT !== undefined && properties.text !== undefined) {
      widget.setProperty(hmUI.prop.TEXT, properties.text)
    }
  } catch (error) {
    console.log('RideWake Teclado: widget update failed')
  }
}

function buttonProps(x, y, text, theme, selected) {
  return {
    x: x, y: y, w: layoutValue(54, 56), h: layoutValue(34, 44),
    radius: 10,
    normal_color: selected ? theme.accent : theme.btnSecondary,
    press_color: selected ? theme.accentPress : theme.btnSecondaryPress,
    text: text, text_size: layoutValue(11, 12),
    color: selected ? theme.onAccent : theme.btnSecondaryText
  }
}

function wideButtonProps(x, y, w, h, text, theme, selected) {
  return {
    x: x, y: y, w: w, h: h, radius: 8,
    normal_color: selected ? theme.accent : theme.btnSecondary,
    press_color: selected ? theme.accentPress : theme.btnSecondaryPress,
    text: text, text_size: 11,
    color: selected ? theme.onAccent : theme.btnSecondaryText
  }
}

function groupX(index) {
  return 6 + index * 60
}

function groupY(index) {
  return layoutValue(
    80 + Math.floor(index / 3) * 38,
    140 + Math.floor(index / 3) * 50
  )
}

function actionY() {
  return layoutValue(228, 334)
}

function actionX(index) {
  const groupWidth = ACTION_WIDTH * 2 + ACTION_GAP
  const groupLeft = (SCREEN_WIDTH - groupWidth) / 2
  return groupLeft + index * (ACTION_WIDTH + ACTION_GAP)
}

function groupActionY() {
  return layoutValue(270, 384)
}

function groupActionX() {
  return layoutValue(69, 68)
}

function updatePreview(theme) {
  setWidget(previewWidget, {
    text: destinationText || '—',
    color: destinationText ? theme.textPrimary : theme.textSecondary
  })
}

function hideGroupButton(widget, theme) {
  setWidget(widget, {
    text: '', normal_color: theme.bg, press_color: theme.bg, color: theme.bg
  })
}

function appendCharacter(character) {
  if (finishing || destinationText.length >= MAX_LENGTH) return
  destinationText += character
  renderKeyboard()
}

function selectGroup(index) {
  keyboardMode = false
  activeLetters = GROUPS[index].split('')
  const theme = getActiveTheme()
  groupButtons.forEach(function (widget, buttonIndex) {
    if (buttonIndex < 3) {
      setWidget(widget, buttonProps(
        groupX(buttonIndex), groupY(buttonIndex),
        activeLetters[buttonIndex], theme, false
      ))
    } else {
      hideGroupButton(widget, theme)
    }
  })
  renderKeyboard()
}

function renderKeyboard() {
  if (!pageAlive) return
  const theme = getActiveTheme()
  updatePreview(theme)
  setWidget(messageWidget, { text: '', color: theme.bg })
  if (keyboardMode) {
    groupButtons.forEach(function (widget, index) {
      setWidget(widget, buttonProps(
        groupX(index % 3), groupY(index),
        GROUPS[index], theme, false
      ))
    })
    setWidget(groupBackButton, buttonProps(
      groupActionX(), groupActionY(), t('keyboard_groups'), theme, true
    ))
  } else {
    setWidget(groupBackButton, buttonProps(
      groupActionX(), groupActionY(), t('keyboard_groups'), theme, false
    ))
  }
  setWidget(spaceButton, wideButtonProps(
    6, layoutValue(196, 292), 180, layoutValue(28, 34), t('keyboard_space'), theme, false
  ))
  setWidget(deleteButton, wideButtonProps(
    actionX(0), actionY(), ACTION_WIDTH, layoutValue(40, 34),
    t('keyboard_delete'), theme, false
  ))
  setWidget(doneButton, wideButtonProps(
    actionX(1), actionY(), ACTION_WIDTH, layoutValue(40, 34),
    t('keyboard_done'), theme, true
  ))
}

function showGroups() {
  keyboardMode = true
  renderKeyboard()
}

function finishInput() {
  if (finishing) return
  const trimmedDestination = destinationText.trim()
  if (!trimmedDestination) {
    setWidget(messageWidget, {
      text: t('keyboard_empty'),
      color: getActiveTheme().textSecondary
    })
    return
  }
  finishing = true
  setCustomDestination(trimmedDestination)
  try {
    if (typeof hmApp !== 'undefined' && typeof hmApp.goBack === 'function') {
      hmApp.goBack()
      return
    }
  } catch (error) {
    console.log('RideWake Teclado: navigation failed')
  }
  finishing = false
  setWidget(messageWidget, {
    text: t('home_nav_error'),
    color: getActiveTheme().textSecondary
  })
}

Page({
  build() {
    pageAlive = true
    keyboardMode = true
    finishing = false
    destinationText = ''
    activeLetters = []
    const theme = getActiveTheme()
    createPageBackground()

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(18, 30), w: 168, h: 22,
      text: t('keyboard_title'), text_size: 18, color: theme.title,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(42, 58), w: 168, h: 16,
      text: t('keyboard_help'), text_size: 11, color: theme.textSecondary,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE
    })
    previewWidget = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(58, 82), w: 168, h: layoutValue(18, 42),
      text: '—', text_size: layoutValue(13, 15),
      color: theme.textSecondary, align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V, text_style: hmUI.text_style.WRAP
    })
    messageWidget = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 12, y: layoutValue(76, 124), w: 168, h: 1,
      text: '', text_size: 12, color: theme.textSecondary,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.WRAP
    })

    groupButtons = GROUPS.map(function (group, index) {
      return hmUI.createWidget(hmUI.widget.BUTTON, Object.assign(
        buttonProps(
          groupX(index % 3), groupY(index),
          group, theme, false
        ),
        { click_func: function () {
          if (keyboardMode) selectGroup(index)
          else if (index < 3) appendCharacter(activeLetters[index])
        } }
      ))
    })

    groupBackButton = hmUI.createWidget(hmUI.widget.BUTTON, Object.assign(
      buttonProps(groupActionX(), groupActionY(),
        t('keyboard_groups'), theme, true),
      { click_func: showGroups }
    ))
    spaceButton = hmUI.createWidget(hmUI.widget.BUTTON, Object.assign(
      wideButtonProps(6, layoutValue(196, 292), 180, layoutValue(28, 34),
        t('keyboard_space'), theme, false),
      { click_func: function () { appendCharacter(' ') } }
    ))
    deleteButton = hmUI.createWidget(hmUI.widget.BUTTON, Object.assign(
      wideButtonProps(actionX(0), actionY(), ACTION_WIDTH, layoutValue(40, 34),
        t('keyboard_delete'), theme, false),
      { click_func: function () {
        if (!finishing) {
          destinationText = destinationText.slice(0, -1)
          renderKeyboard()
        }
      } }
    ))
    doneButton = hmUI.createWidget(hmUI.widget.BUTTON, Object.assign(
      wideButtonProps(actionX(1), actionY(), ACTION_WIDTH, layoutValue(40, 34),
        t('keyboard_done'), theme, true),
      { click_func: finishInput }
    ))
  },

  onDestroy() {
    pageAlive = false
    previewWidget = null
    messageWidget = null
    groupButtons = []
    groupBackButton = null
    spaceButton = null
    deleteButton = null
    doneButton = null
  }
})
