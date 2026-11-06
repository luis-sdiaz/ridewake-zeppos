export const Palette = {
  Cyan500: 0x59D9FF,
  Mint400: 0x72E4C1,
  Amber400: 0xFFC857,
  Coral400: 0xFF6B6B,
  Navy950: 0x0A1118,
  Navy900: 0x111C26,
  Navy700: 0x1B2A38,
  White: 0xFFFFFF,
  Slate300: 0xB6C4CA,
  Slate350: 0x8FA3B8,
  Slate500: 0x506578,
  Ink: 0x001018,
  DisabledSurface: 0x16262D,
  DisabledContent: 0x60737C,
  LightBg: 0xF0F4F8,
  LightCard: 0xFFFFFF,
  LightButton: 0xD9E2EC,
  LightDisabled: 0xC7D3DD,
  LightTextSecondary: 0x334E68,
  LightTextMuted: 0x627D98,
  LightAccent: 0x007F9E,
  LightSuccess: 0x087F68,
  LightWarning: 0x8A5A00,
  LightDanger: 0xB83D4A
}

// Alias retrocompatible para las pantallas que consumen tokens absolutos.
export const Colors = Palette

const Themes = {
  dark: {
    bg: Palette.Navy950,
    cardBg: Palette.Navy900,
    btnSecondary: Palette.Navy700,
    textPrimary: Palette.White,
    textSecondary: Palette.Slate350,
    textMuted: Palette.Slate500,
    accent: Palette.Cyan500,
    success: Palette.Mint400,
    warning: Palette.Amber400,
    danger: Palette.Coral400,
    onAccent: Palette.Ink,
    disabledBg: Palette.DisabledSurface,
    disabledText: Palette.DisabledContent,
    divider: Palette.Navy700,
    Cyan500: Palette.Cyan500,
    Mint400: Palette.Mint400,
    Amber400: Palette.Amber400,
    Coral400: Palette.Coral400
  },
  light: {
    bg: Palette.LightBg,
    cardBg: Palette.LightCard,
    btnSecondary: Palette.LightButton,
    textPrimary: Palette.Navy950,
    textSecondary: Palette.LightTextSecondary,
    textMuted: Palette.LightTextMuted,
    accent: Palette.LightAccent,
    success: Palette.LightSuccess,
    warning: Palette.LightWarning,
    danger: Palette.LightDanger,
    onAccent: Palette.White,
    disabledBg: Palette.LightDisabled,
    disabledText: Palette.LightTextMuted,
    divider: Palette.LightButton,
    Cyan500: Palette.Cyan500,
    Mint400: Palette.Mint400,
    Amber400: Palette.Amber400,
    Coral400: Palette.Coral400
  }
}

export function getTheme(mode) {
  return mode === 'light' ? Themes.light : Themes.dark
}

export const Type = {
  brand: 18,
  headline: 22,
  body: 14,
  button: 16,
  caption: 12
}

const BASE_HEIGHT = 490
let deviceHeight = BASE_HEIGHT

try {
  if (typeof hmSetting !== 'undefined' && hmSetting.getDeviceInfo) {
    const currentDevice = hmSetting.getDeviceInfo()
    if (currentDevice && currentDevice.height > 0) {
      deviceHeight = currentDevice.height
    }
  }
} catch (error) {
  deviceHeight = BASE_HEIGHT
}

export function scaleVertical(value, height = deviceHeight) {
  if (value === 0) return 0
  if (height >= BASE_HEIGHT) return value
  return Math.max(1, Math.round(value * height / BASE_HEIGHT))
}

export const Layout = {
  width: 192,
  height: deviceHeight,
  baseHeight: BASE_HEIGHT,
  topSafe: 28,
  bottomSafe: 28,
  contentWidth: 152,
  leftMargin: 20,
  innerWidth: 136,
  innerMargin: 28,
  cardRadius: 20,
  controlRadius: 26,
  y(value) {
    return scaleVertical(value)
  },
  h(value) {
    return scaleVertical(value)
  }
}
