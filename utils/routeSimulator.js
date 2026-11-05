const HOME_ROUTE = [
  {
    stop: 'Parque Bolívar',
    distance: '3.2 km',
    eta: '12 min',
    progress: 0.10,
    state: 'MONITORING'
  },
  {
    stop: 'Av. Las Américas',
    distance: '1.5 km',
    eta: '5 min',
    progress: 0.50,
    state: 'EARLY_ALERT'
  },
  {
    stop: 'Calle 18 (Cerca)',
    distance: '0.3 km',
    eta: '1 min',
    progress: 0.90,
    state: 'NEAR'
  },
  {
    stop: 'Destino Casa',
    distance: '0.0 km',
    eta: '¡Ahora!',
    progress: 1.0,
    state: 'ARRIVED'
  }
]

const UNIVERSITY_ROUTE = [
  {
    stop: 'Plaza Carnaval',
    distance: '3.0 km',
    eta: '11 min',
    progress: 0.10,
    state: 'MONITORING'
  },
  {
    stop: 'Parque Nariño',
    distance: '1.4 km',
    eta: '5 min',
    progress: 0.50,
    state: 'EARLY_ALERT'
  },
  {
    stop: 'Entrada UCC',
    distance: '0.2 km',
    eta: '1 min',
    progress: 0.90,
    state: 'NEAR'
  },
  {
    stop: 'Campus Universidad',
    distance: '0.0 km',
    eta: '¡Ahora!',
    progress: 1.0,
    state: 'ARRIVED'
  }
]

function copyRoute(route) {
  return route.map((step) => ({ ...step }))
}

export function getRouteSteps(destinationKey) {
  const normalizedKey = String(destinationKey || 'home').toLowerCase()
  const isUniversity = normalizedKey === 'university' ||
    normalizedKey === 'universidad'

  return copyRoute(isUniversity ? UNIVERSITY_ROUTE : HOME_ROUTE)
}
