const FALLBACK_WIDTH = 192
const FALLBACK_HEIGHT = 349
const EXPANDED_MIN_HEIGHT = 480

let reportedWidth = FALLBACK_WIDTH
let reportedHeight = FALLBACK_HEIGHT

try {
  if (typeof hmSetting !== 'undefined' &&
      typeof hmSetting.getDeviceInfo === 'function') {
    const deviceInfo = hmSetting.getDeviceInfo()
    if (deviceInfo && Number(deviceInfo.width) > 0) {
      reportedWidth = Math.round(Number(deviceInfo.width))
    }
    if (deviceInfo && Number(deviceInfo.height) > 0) {
      reportedHeight = Math.round(Number(deviceInfo.height))
    }
  }
} catch (error) {
  reportedWidth = FALLBACK_WIDTH
  reportedHeight = FALLBACK_HEIGHT
}

const expanded = reportedHeight >= EXPANDED_MIN_HEIGHT

export const ScreenLayout = {
  width: reportedWidth,
  height: reportedHeight,
  expanded: expanded,
  usableHeight: expanded ? Math.min(reportedHeight, 490) : FALLBACK_HEIGHT
}

try {
  if (typeof globalThis !== 'undefined' &&
      !globalThis.__RIDEWAKE_DISPLAY_LOGGED__) {
    globalThis.__RIDEWAKE_DISPLAY_LOGGED__ = true
    console.log(
      'RideWake display: ' + reportedWidth + 'x' + reportedHeight +
      ' layout=' + (expanded ? 'expanded' : 'compact')
    )
  }
} catch (error) {}

export function layoutValue(compactValue, expandedValue) {
  return ScreenLayout.expanded ? expandedValue : compactValue
}

export function measureWrappedText(text, textSize, width, minimumHeight, maximumHeight) {
  try {
    if (typeof hmUI !== 'undefined' && typeof hmUI.getTextLayout === 'function') {
      const measured = hmUI.getTextLayout(String(text), {
        text_size: textSize,
        text_width: width,
        wrapped: 1
      })
      if (measured && Number(measured.height) > 0) {
        return Math.max(
          minimumHeight,
          Math.min(maximumHeight, Math.ceil(Number(measured.height)) + 2)
        )
      }
    }
  } catch (error) {}
  return minimumHeight
}
