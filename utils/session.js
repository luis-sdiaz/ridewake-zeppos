let selectedDestination = null

export function setSelectedDestination(destination) {
  selectedDestination = destination
}

export function getSelectedDestination() {
  return selectedDestination
}

export function clearSession() {
  selectedDestination = null
}
