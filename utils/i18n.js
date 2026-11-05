const strings = {
  es: {
    brand_title: 'RIDEWAKE AI',
    home_headline: 'Tu viaje, bajo control',
    home_description: 'Alertas predictivas al llegar a tu parada',
    home_status: 'LISTO PARA ACOMPAÑARTE',
    btn_start_trip: 'Iniciar viaje',
    btn_settings: 'Ajustes',
    settings_title: 'AJUSTES',
    settings_lang_label: 'Idioma',
    settings_lang_btn: 'Español / English',
    settings_haptic_label: 'Vibración',
    settings_haptic_normal: 'Normal',
    settings_haptic_strong: 'Intensa',
    settings_about_label: 'Acerca de',
    settings_version: 'RideWake Band v1.0.0',
    settings_target: 'Xiaomi Band 7 (Zepp OS)',
    settings_btn_back: 'Volver',
    dest_header: 'DESTINO',
    dest_subtitle: '¿A dónde vas?',
    dest_title: '¿A dónde vas?',
    dest_home: 'Casa',
    dest_university: 'Universidad',
    dest_continue: 'Continuar',
    dest_back: 'Volver',
    conf_title: 'CONFIRMAR',
    conf_subtitle: 'Detalles del viaje',
    conf_destination_label: 'Destino',
    conf_eta_label: 'Tiempo estimado',
    conf_dist_label: 'Distancia',
    conf_btn_start: 'Comenzar viaje',
    conf_btn_change: 'Cambiar destino',
    confirmation_title: 'Destino confirmado',
    confirmation_body: 'Te avisaremos antes de llegar',
    trip_title: 'VIAJE EN CURSO',
    trip_eta_label: 'Llegada en',
    trip_distance_label: 'Distancia',
    trip_distance_remaining: 'DISTANCIA RESTANTE',
    trip_eta_remaining: 'LLEGADA ESTIMADA',
    trip_now: '¡Ahora!',
    trip_status_monitoring: 'En camino',
    trip_status_early: 'Aviso temprano',
    trip_status_near: 'Cerca de tu parada',
    trip_status_arrived: '¡Llegaste a tu parada!',
    trip_btn_finish: 'Finalizar viaje',
    trip_early_alert: 'Aviso temprano',
    btn_finish_trip: 'Finalizar viaje'
  },
  en: {
    brand_title: 'RIDEWAKE AI',
    home_headline: 'Your ride, under control',
    home_description: 'Predictive alerts before your stop',
    home_status: 'READY TO RIDE WITH YOU',
    btn_start_trip: 'Start trip',
    btn_settings: 'Settings',
    settings_title: 'SETTINGS',
    settings_lang_label: 'Language',
    settings_lang_btn: 'Español / English',
    settings_haptic_label: 'Vibration',
    settings_haptic_normal: 'Normal',
    settings_haptic_strong: 'Strong',
    settings_about_label: 'About',
    settings_version: 'RideWake Band v1.0.0',
    settings_target: 'Xiaomi Band 7 (Zepp OS)',
    settings_btn_back: 'Back',
    dest_header: 'DESTINATION',
    dest_subtitle: 'Where to?',
    dest_title: 'Choose destination',
    dest_home: 'Home',
    dest_university: 'University',
    dest_continue: 'Continue',
    dest_back: 'Back',
    conf_title: 'CONFIRM',
    conf_subtitle: 'Trip details',
    conf_destination_label: 'Destination',
    conf_eta_label: 'Estimated time',
    conf_dist_label: 'Distance',
    conf_btn_start: 'Start trip',
    conf_btn_change: 'Change destination',
    confirmation_title: 'Destination confirmed',
    confirmation_body: 'We will alert you before arrival',
    trip_title: 'ACTIVE TRIP',
    trip_eta_label: 'Arriving in',
    trip_distance_label: 'Distance',
    trip_distance_remaining: 'DISTANCE REMAINING',
    trip_eta_remaining: 'ESTIMATED ARRIVAL',
    trip_now: 'Now!',
    trip_status_monitoring: 'On the way',
    trip_status_early: 'Early alert',
    trip_status_near: 'Near your stop',
    trip_status_arrived: 'Arrived at stop!',
    trip_btn_finish: 'Finish trip',
    trip_early_alert: 'Early alert',
    btn_finish_trip: 'Finish trip'
  }
}

let currentLang = 'es'

function getGlobalState() {
  const app = getApp()
  if (!app._options.globalData) app._options.globalData = {}
  return app._options.globalData
}

export function setLanguage(lang) {
  if (strings[lang]) {
    currentLang = lang
    getGlobalState().language = lang
  }
}

export function getLanguage() {
  const savedLanguage = getGlobalState().language
  return strings[savedLanguage] ? savedLanguage : currentLang
}

export function t(key) {
  const language = getLanguage()
  return (strings[language] && strings[language][key]) ||
    strings.es[key] ||
    key
}
