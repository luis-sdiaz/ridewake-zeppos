const fallbackState = {
  selectedDestination: null,
  language: 'es',
  vibrationEnabled: true,
  vibrationIntensity: 'normal',
  tripRunId: 0,
  tripActive: false
}

export function getGlobalState() {
  try {
    if (typeof getApp === 'function') {
      const app = getApp()
      if (app && app._options) {
        if (!app._options.globalData) app._options.globalData = {}
        return app._options.globalData
      }
    }
  } catch (error) {
    console.log('RideWake: globalData unavailable')
  }
  return fallbackState
}

export function normalizeDestination(value) {
  if (value === 'Casa' || value === 'home') return 'Casa'
  if (value === 'Universidad' || value === 'university') return 'Universidad'
  return null
}

export function setSelectedDestination(value) {
  const destination = normalizeDestination(value)
  getGlobalState().selectedDestination = destination
  return destination
}

export function getSelectedDestination() {
  return normalizeDestination(getGlobalState().selectedDestination)
}

export function setLanguage(value) {
  if (value === 'es' || value === 'en') getGlobalState().language = value
}

export function getLanguage() {
  return getGlobalState().language === 'en' ? 'en' : 'es'
}

export function setVibrationEnabled(value) {
  getGlobalState().vibrationEnabled = value === true
}

export function isVibrationEnabled() {
  return getGlobalState().vibrationEnabled !== false
}

export function setVibrationIntensity(value) {
  if (value === 'normal' || value === 'strong') {
    getGlobalState().vibrationIntensity = value
  }
}

export function getVibrationIntensity() {
  return getGlobalState().vibrationIntensity === 'strong' ? 'strong' : 'normal'
}

export function startTripSession() {
  const state = getGlobalState()
  const currentId = Number(state.tripRunId)
  state.tripRunId = (isFinite(currentId) ? currentId : 0) + 1
  state.tripActive = true
  return state.tripRunId
}

export function finishTripSession() {
  getGlobalState().tripActive = false
}
