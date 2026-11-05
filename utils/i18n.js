const strings = {
  es: {
    brand_title: 'RIDEWAKE AI',
    home_headline: 'Tu viaje, bajo control',
    home_description: 'Alertas predictivas al llegar a tu parada',
    home_status: 'LISTO PARA ACOMPAÑARTE',
    btn_start_trip: 'Iniciar viaje',
    btn_settings: 'Ajustes',
    dest_title: '¿A dónde vas?',
    dest_home: 'Casa',
    dest_university: 'Universidad',
    dest_continue: 'Continuar',
    confirmation_title: 'Destino confirmado',
    confirmation_body: 'Te avisaremos antes de llegar',
    trip_eta_label: 'Llegada en',
    trip_distance_label: 'Distancia',
    trip_status_monitoring: 'Monitoreando',
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
    dest_title: 'Choose destination',
    dest_home: 'Home',
    dest_university: 'University',
    dest_continue: 'Continue',
    confirmation_title: 'Destination confirmed',
    confirmation_body: 'We will alert you before arrival',
    trip_eta_label: 'Arriving in',
    trip_distance_label: 'Distance',
    trip_status_monitoring: 'Monitoring',
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
