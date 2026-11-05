const logger = DeviceRuntimeCore.HmLogger.getLogger('ridewake-app')

App({
  onCreate() {
    logger.log('RideWake AI created')
  },

  onDestroy() {
    logger.log('RideWake AI destroyed')
  }
})
