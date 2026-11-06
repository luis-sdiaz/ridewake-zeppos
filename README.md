# RideWake Band — Sistema de Alerta Predictiva de Transporte para Wearables

Aplicación nativa para Zepp OS que demuestra un flujo de acompañamiento de viaje con selección de destino, alertas visuales predictivas y retroalimentación háptica en la muñeca.

[![Zepp OS](https://img.shields.io/badge/Zepp%20OS-1.0-111827)](https://docs.zepp.com/docs/1.0/intro/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6-F7DF1E?logo=javascript&logoColor=000)](https://developer.mozilla.org/docs/Web/JavaScript)
[![Target](https://img.shields.io/badge/Target-Band%207%20%7C%20192%C3%97490-59D9FF)](#ficha-técnica-y-entorno)
[![License](https://img.shields.io/badge/License-MIT-72E4C1)](#licencia)
[![Build](https://img.shields.io/badge/Build-Passing-72E4C1)](#verificación-de-compilación)

## Descripción general

En trayectos urbanos, un pasajero puede distraerse, quedarse dormido o perder la referencia de su ubicación y sobrepasar su parada. RideWake Band aborda este problema mediante una experiencia compacta que presenta el progreso del viaje y comunica los hitos relevantes con color y vibración.

Esta versión es un prototipo funcional para Xiaomi Smart Band 7 y mantiene compatibilidad de desarrollo con el emulador oficial de Amazfit Band 7. Implementa el flujo completo de interfaz y un motor local de simulación; no consume todavía GPS, rutas de transporte ni datos de llegada en tiempo real.

## Ficha técnica y entorno

| Propiedad | Especificación |
|---|---|
| Hardware objetivo | Xiaomi Smart Band 7; emulación compatible con Amazfit Band 7 |
| Pantalla | 192 × 490 px (Xiaomi) / 194 × 368 px (Amazfit) |
| Interacción | Pantalla táctil capacitiva y motor háptico integrado |
| Identificador Zepp | `deviceSource: 263` (Xiaomi) / `254` (Amazfit) |
| Target del proyecto | `band-7` |
| Runtime | Zepp OS 1.0, JavaScript ES6 sobre QuickJS |
| API declarada | Compatible `1.0.0`, target `1.0.1`, mínima `1.0.0` |
| CLI de desarrollo | `@zeppos/zeus-cli@1.9.3` |
| Permiso | `device:os.vibrate` |
| Versión de la aplicación | `1.0.0` — código `1` |
| Formato de distribución | Paquete `.zab` |

## Arquitectura del software

La aplicación utiliza las primitivas globales de Zepp OS 1.0: `App`, `Page`, `hmUI`, `hmApp`, `hmSensor` y `timer`. No utiliza frameworks de interfaz, TypeScript ni dependencias de ejecución dentro del wearable.

```text
ridewake-zeppos/
├── app.json                    # Manifiesto, runtime, permiso, páginas y target
├── app.js                      # Ciclo de vida global y registro de diagnóstico
├── package.json                # Scripts npm y Zeus CLI fijado en 1.9.3
├── package-lock.json           # Resolución reproducible de herramientas
├── assets/
│   └── band-7/
│       └── icon.png            # Icono de la aplicación para el target
├── page/
│   ├── index.js                # Inicio y accesos a viaje y ajustes
│   ├── destination.js          # Selección exclusiva de destino
│   ├── confirmation.js         # Resumen previo e inicio del trayecto
│   ├── trip.js                 # Telemetría simulada y máquina de estados
│   └── settings.js             # Idioma, intensidad háptica e información
└── utils/
    ├── theme.js                # Colores, tipografía y geometría segura
    ├── session.js              # Destino y modo háptico compartidos
    ├── i18n.js                 # Diccionario ES/EN y fallback a español
    └── haptics.js              # Sensor VIBRATE y duración de pulsos
```

### Responsabilidades transversales

- `utils/theme.js` evita valores de color dispersos y define las medidas base del dispositivo.
- `utils/session.js` comparte el destino y la intensidad háptica mediante `getApp()._options.globalData`.
- `utils/i18n.js` conserva el idioma activo en el mismo estado global y resuelve cada clave con fallback a español.
- `utils/haptics.js` mantiene una única instancia de `hmSensor.id.VIBRATE`, detiene cualquier pulso previo antes de iniciar otro y libera sus temporizadores al destruir la página.
- `app.js` registra `onCreate` y `onDestroy` y emite trazas con `DeviceRuntimeCore.HmLogger`.

El estado global es deliberadamente temporal: permanece mientras la Mini App está activa, pero no constituye persistencia después de cerrar la aplicación o reiniciar el dispositivo.

## Flujo de navegación y estados

### Navegación

| Pantalla origen | Acción del usuario | Pantalla o resultado | Retroalimentación física |
|---|---|---|---|
| Inicio | Pulsar **Iniciar viaje** | Selección de destino | Pulso corto |
| Inicio | Pulsar **Ajustes** | Configuración | Pulso corto |
| Destino | Elegir **Casa** o **Universidad** | Selección exclusiva y activación de Continuar | Pulso corto |
| Destino | Pulsar **Continuar** | Confirmación | Pulso corto |
| Destino | Pulsar **Volver** | Inicio | Pulso corto |
| Confirmación | Pulsar **Comenzar viaje** | Viaje activo | Pulso corto |
| Confirmación | Pulsar **Cambiar destino** | Selección de destino | Pulso corto |
| Viaje activo | Transición a aviso temprano | Actualización de estado y métricas | Pulso corto |
| Viaje activo | Transición a cerca/llegada | Alerta visual crítica | Pulso de advertencia |
| Viaje activo | Pulsar **Finalizar viaje** | Limpieza del destino y regreso a Inicio | Pulso corto |
| Ajustes | Alternar idioma | Recarga inmediata de la pantalla | Pulso corto |
| Ajustes | Elegir intensidad | Actualización del toggle y prueba háptica | Pulso con la nueva duración |
| Ajustes | Pulsar **Volver** | Inicio | Pulso corto |

### Máquina de estados del viaje

`page/trip.js` inicia un temporizador periódico de 4 segundos. Cada ciclo avanza una posición en `STAGES`, actualiza los widgets existentes sin reconstruir la pantalla y aplica la respuesta háptica correspondiente.

| Estado lógico | Distancia | ETA | Superficie/acento | Háptica |
|---|---:|---:|---|---|
| `MONITORING` | 3.2 km | 12 min | Navy900 / Mint400 | Sin alerta automática |
| `EARLY_ALERT` | 1.5 km | 5 min | Navy700 / Amber400 | Pulso corto |
| `NEAR` | 0.3 km | 1 min | Coral400 / Amber400 | Advertencia |
| `ARRIVED` | 0.0 km | ¡Ahora! | Coral400 / White | Advertencia |

Al llegar, el temporizador se detiene. La función compartida `stopSimulation()` también se ejecuta al finalizar manualmente y en `onDestroy`, lo que previene procesos periódicos huérfanos y consumo innecesario de batería.

## Sistema de diseño

### Tokens de color

| Token | Valor Zepp OS | Hexadecimal | Rol funcional |
|---|---:|---:|---|
| `Cyan500` | `0x59D9FF` | `#59D9FF` | Marca, encabezados y ETA |
| `Mint400` | `0x72E4C1` | `#72E4C1` | Monitoreo, éxito, selección y confirmación |
| `Amber400` | `0xFFC857` | `#FFC857` | Aviso temprano y precaución |
| `Coral400` | `0xFF6B6B` | `#FF6B6B` | Parada cercana y llegada crítica |
| `Navy950` | `0x020405` | `#020405` | Fondo AMOLED principal |
| `Navy900` | `0x071015` | `#071015` | Tarjetas y superficies elevadas |
| `Navy700` | `0x123442` | `#123442` | Controles secundarios y selección inactiva |
| `White` | `0xFFFFFF` | `#FFFFFF` | Texto de alta prioridad |
| `Slate300` | `0xB6C4CA` | `#B6C4CA` | Texto secundario claro |
| `Slate350` | `0x9DB3BD` | `#9DB3BD` | Etiquetas y descripciones |
| `Slate500` | `0x82959E` | `#82959E` | Texto auxiliar |
| `Ink` | `0x001018` | `#001018` | Texto oscuro sobre superficies claras |
| `DisabledSurface` | `0x16262D` | `#16262D` | Fondo de controles deshabilitados |
| `DisabledContent` | `0x60737C` | `#60737C` | Contenido deshabilitado |

### Tipografía y layout

| Token | Valor |
|---|---:|
| `Type.brand` | 18 px |
| `Type.headline` | 22 px |
| `Type.body` | 14 px |
| `Type.button` | 16 px |
| `Type.caption` | 12 px |
| `Layout.width` | 192 px |
| `Layout.height` | 490 px |
| `Layout.leftMargin` | 16 px |
| `Layout.contentWidth` | 160 px |

La interfaz reserva 16 px a cada lado. Los controles principales utilizan un ancho máximo de 160 px para reducir recortes cerca de los bordes curvos de la pantalla. Las coordenadas verticales se compactan automáticamente con `hmSetting.getDeviceInfo()` cuando la pantalla es más baja que los 490 px del diseño base.

## Internacionalización y accesibilidad

La función `t(key)` consulta un diccionario bilingüe español/inglés. El idioma predeterminado es español y, si una clave no existe en el idioma activo, el sistema intenta resolverla en español antes de mostrar el identificador de la clave.

La pantalla de ajustes permite alternar el idioma y recargar sus textos inmediatamente. El valor se comparte con el resto de páginas durante la sesión de la Mini App.

La comunicación de alertas no depende únicamente del color: cada hito muestra texto, distancia y ETA, y los estados importantes incorporan respuesta háptica. Existen dos perfiles:

| Perfil | Interacción corta | Alerta de parada |
|---|---:|---:|
| Normal | 90 ms | 400 ms |
| Intensa | 180 ms | 650 ms |

## Ciclo de vida y gestión de recursos

- Cada página inicializa la háptica mediante `initHaptics()` y ejecuta `destroyHaptics()` en `onDestroy`.
- Los pulsos usan `timer.createTimer` para detener el motor después de la duración seleccionada.
- Antes de crear un nuevo pulso se cancela el temporizador háptico anterior.
- `page/trip.js` conserva el identificador del temporizador de simulación y lo cancela en todas las rutas de salida.
- Finalizar el viaje ejecuta `clearSession()`, que elimina el destino activo sin restablecer la preferencia háptica.

## Instalación, compilación y despliegue

### Requisitos previos

- Node.js 16 o superior.
- npm.
- Zeus CLI 1.8.2, fijado por compatibilidad con Xiaomi Smart Band 7 y `deviceSource: 263`.
- Zepp App con modo desarrollador para la instalación mediante QR.

### Instalación de dependencias

El repositorio declara Zeus CLI como dependencia local reproducible:

```bash
npm install
```

También puede instalarse globalmente la misma versión:

```bash
npm install -g @zeppos/zeus-cli@1.9.3
```

### Compilación

Con la dependencia local:

```bash
npm run build
```

O con la instalación global:

```bash
zeus build
```

El instalador resultante se escribe en `dist/` con extensión `.zab`.

### Previsualización e instalación en dispositivo

```bash
npm run preview
```

O bien:

```bash
zeus preview
```

`zeus preview` genera el flujo de previsualización y el código QR para instalar la Mini App desde el modo desarrollador de Zepp App. Esta operación puede requerir autenticación y una pulsera vinculada.

## Verificación de compilación

La última verificación local finalizó correctamente:

```text
BUILD_EXIT=0
ROLLUP: 6 archivos
QJSC: 6 archivos
```

Zeus 1.9.3 reconoce ambos `deviceSource`, redimensiona el icono a 96 px para Amazfit Band 7, compila los seis bundles QuickJS y genera el `.zab`.

## Alcance y trabajo pendiente

- Sustituir la máquina de estados simulada por ubicación y estimaciones reales.
- Definir un `appId` de producción; el manifiesto utiliza actualmente `1000000` como identificador provisional.
- Validar en hardware la intensidad de ambos perfiles hápticos y la legibilidad en movimiento.
- Validar instalación por QR con la versión de Zepp App utilizada para vincular la Xiaomi Smart Band 7.
- Añadir pruebas automatizadas cuando exista un entorno de ejecución Zepp OS adecuado para CI.

## Gobernanza y créditos

Desarrollado por **Luis Sebastián Díaz**.

**Universidad Cooperativa de Colombia — UCC Pasto**  
Ingeniería de Software

## Licencia

Este proyecto se distribuye bajo la licencia MIT.
