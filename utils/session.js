let selectedDestination = null
let hapticMode = 'normal'
let themeMode = 'light'

function getGlobalState() {
  const app = getApp()
  if (!app._options.globalData) app._options.globalData = {}
  const globalState = app._options.globalData
  if (globalState.themeMode !== 'dark' && globalState.themeMode !== 'light') {
    globalState.themeMode = themeMode
  }
  return globalState
}

export function setSelectedDestination(destination) {
  selectedDestination = destination
  getGlobalState().selectedDestination = destination
}

export function getSelectedDestination() {
  const savedDestination = getGlobalState().selectedDestination
  return savedDestination === undefined ? selectedDestination : savedDestination
}

export function clearSession() {
  selectedDestination = null
  getGlobalState().selectedDestination = null
}

export function setHapticMode(mode) {
  if (mode === 'normal' || mode === 'strong') {
    hapticMode = mode
    getGlobalState().hapticMode = mode
  }
}

export function getHapticMode() {
  const savedMode = getGlobalState().hapticMode
  return savedMode === 'normal' || savedMode === 'strong'
    ? savedMode
    : hapticMode
}

export function setThemeMode(mode) {
  if (mode === 'dark' || mode === 'light') {
    themeMode = mode
    getGlobalState().themeMode = mode
  }
}

export function getThemeMode() {
  const savedMode = getGlobalState().themeMode
  return savedMode === 'dark' || savedMode === 'light'
    ? savedMode
    : themeMode
}
