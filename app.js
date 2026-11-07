const logger = DeviceRuntimeCore.HmLogger.getLogger('ridewake-app')

App({
  globalData: {
    selectedDestination: null,
    language: 'es',
    vibrationEnabled: true,
    vibrationIntensity: 'normal',
    tripRunId: 0,
    tripActive: false
  },

  onCreate() {
    logger.log('RideWake AI created')
  },

  onDestroy() {
    logger.log('RideWake AI destroyed')
  }
})
