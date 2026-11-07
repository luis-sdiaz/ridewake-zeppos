import { getTheme as getSessionTheme } from './session'
import { ScreenLayout } from './layout'

const Themes = {
  dark: {
    bg: 0x050b0d, title: 0x35dce8, textPrimary: 0xffffff,
    textSecondary: 0xb5c6c8, btnSecondary: 0x16353a,
    btnSecondaryPress: 0x24636a, btnSecondaryText: 0x72edf2,
    accent: 0x20cbd6, accentPress: 0x118993, onAccent: 0x00191b,
    alertNear: 0xff6b6b, alertEarly: 0xffc857, alertText: 0xffffff
  },
  light: {
    bg: 0xf4fafc, title: 0x087d87, textPrimary: 0x17333b,
    textSecondary: 0x526a72, btnSecondary: 0xdeeff1,
    btnSecondaryPress: 0xb9dfe2, btnSecondaryText: 0x075d66,
    accent: 0x087d87, accentPress: 0x06656d, onAccent: 0xffffff,
    alertNear: 0xb4232d, alertEarly: 0x946000, alertText: 0xffffff
  }
}

export function getTheme(mode) {
  return mode === 'light' ? Themes.light : Themes.dark
}

export function getActiveTheme() {
  return getTheme(getSessionTheme())
}

export function createPageBackground() {
  if (typeof hmUI === 'undefined' || !hmUI.widget ||
      hmUI.widget.FILL_RECT === undefined ||
      typeof hmUI.createWidget !== 'function') return null
  try {
    return hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0, y: 0, w: ScreenLayout.width, h: ScreenLayout.usableHeight,
      color: getActiveTheme().bg
    })
  } catch (error) {
    console.log('RideWake: background unavailable')
    return null
  }
}

export function updatePageBackground(widget) {
  if (!widget || typeof widget.setProperty !== 'function' ||
      typeof hmUI === 'undefined' || !hmUI.prop ||
      hmUI.prop.MORE === undefined) return
  try {
    widget.setProperty(hmUI.prop.MORE, {
      x: 0, y: 0, w: ScreenLayout.width, h: ScreenLayout.usableHeight,
      color: getActiveTheme().bg
    })
  } catch (error) {
    console.log('RideWake: background update failed')
  }
}
