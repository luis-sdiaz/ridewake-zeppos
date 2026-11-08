const fallbackState = {
  selectedDestination: null,
  customDestination: null,
  language: 'es',
  vibrationEnabled: true,
  vibrationIntensity: 'normal',
  theme: 'dark',
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
  const normalized = String(value || '').trim().toLowerCase()
    .replace(/[áàä]/g, 'a')
    .replace(/[éèë]/g, 'e')
    .replace(/[íìï]/g, 'i')
    .replace(/[óòö]/g, 'o')
    .replace(/[úùü]/g, 'u')

  if (normalized === 'casa' || normalized === 'home') return 'Casa'
  if (normalized === 'universidad' || normalized === 'university') return 'Universidad'
  if (normalized === 'centro' || normalized === 'downtown') return 'Centro'
  if (normalized === 'belen') return 'Belén'
  if (normalized === 'unico') return 'Único'
  return null
}

export function getDestinationDisplayName(value, language) {
  const destination = normalizeDestination(value)
  if (!destination) return null
  if (language === 'en') {
    if (destination === 'Casa') return 'Home'
    if (destination === 'Universidad') return 'University'
  }
  return destination
}

export function setSelectedDestination(value) {
  const destination = normalizeDestination(value)
  getGlobalState().selectedDestination = destination
  return destination
}

export function getSelectedDestination() {
  return normalizeDestination(getGlobalState().selectedDestination)
}

export function setCustomDestination(value) {
  const destination = normalizeDestination(String(value || '').slice(0, 20))
  if (!destination) return null
  const state = getGlobalState()
  state.customDestination = destination
  state.selectedDestination = destination
  return destination
}

export function getCustomDestination() {
  return normalizeDestination(getGlobalState().customDestination)
}

export function clearCustomDestination() {
  getGlobalState().customDestination = null
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

export function setTheme(value) {
  getGlobalState().theme = value === 'light' ? 'light' : 'dark'
  return getGlobalState().theme
}

export function getTheme() {
  return getGlobalState().theme === 'light' ? 'light' : 'dark'
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
