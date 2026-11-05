let selectedDestination = null
let hapticMode = 'normal'

function getGlobalState() {
  const app = getApp()
  if (!app._options.globalData) app._options.globalData = {}
  return app._options.globalData
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
