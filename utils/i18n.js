const strings = {
  es: {
    brand_title: 'RIDEWAKE AI',
    home_headline: 'Tu viaje, bajo control',
    home_description: 'Alertas predictivas al llegar a tu parada',
    home_status: 'LISTO PARA ACOMPAÑARTE',
    btn_start_trip: 'Iniciar viaje',
    btn_settings: 'Ajustes',
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

export function setLanguage(lang) {
  if (strings[lang]) currentLang = lang
}

export function getLanguage() {
  return currentLang
}

export function t(key) {
  return (strings[currentLang] && strings[currentLang][key]) ||
    strings.es[key] ||
    key
}
