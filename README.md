# RideWake AI

Aplicación nativa de demostración para Xiaomi Smart Band 7. RideWake AI simula un recorrido, estima localmente el tiempo restante y genera alertas visuales y hápticas antes del destino.

El prototipo usa Zepp OS 1.0, QuickJS, Zeus CLI 1.8.2 y una única plataforma con `deviceSource: 263`. No utiliza GPS, Internet, Firebase ni datos reales de transporte.

## Pantallas y flujo

La aplicación registra seis páginas:

1. `page/index`: selección Casa o Universidad y acceso a Ajustes.
2. `page/destination`: ruta, distancia y ETA iniciales de demostración.
3. `page/confirmation`: confirmación e inicio protegido contra pulsaciones repetidas.
4. `page/trip`: inferencia, estados del recorrido, alertas y simulación automática.
5. `page/settings`: idioma, vibración y apariencia durante la sesión.
6. `page/keyboard`: teclado experimental agrupado para probar destinos escritos en la pulsera.

El recorrido comienza automáticamente al abrir Viaje y consume un checkpoint cada 10 segundos. La constante `DEMO_CHECKPOINT_MS` de `page/trip.js` centraliza el intervalo de demostración. Las pantallas usan una paleta clara u oscura compartida y un `FILL_RECT` como primer widget de fondo, con widgets nativos dentro de 192×349 o 192×490 píxeles.

Viaje muestra estado, destino, distancia destacada, ETA, cuatro hitos y referencia del recorrido. La identificación «ETA local / simulación» permanece en el pie; se retiró la línea superior de simulación sin mover ni cambiar tamaños del resto del diseño. Los hitos usan rectángulos redondeados nativos: activo de 16 px, restantes de 10 px, puntos completados y segmentos en el color de acento. Un único botón FINALIZAR centrado conserva un área táctil de 144×42 o 144×52 px. Se eliminaron de esta pantalla las explicaciones de umbrales, estabilidad y velocidad para priorizar la proximidad. El motor sigue calculando esas variables.

Desde Inicio, `OTRO`/`OTHER` abre un teclado experimental de nueve grupos (`ABC` a `XYZ`). Las letras, espacios y borrado se mantienen en la pantalla hasta `LISTO`/`DONE`, que solo muestra una confirmación de prueba. Los destinos escritos no se envían a `utils/prediction.js` ni crean rutas, distancias o ETA.

## Inteligencia artificial de RideWake AI

RideWake AI incorpora una regresión lineal multivariable supervisada, entrenada realmente en el computador y exportada como siete parámetros: un intercepto y seis coeficientes. No es IA generativa ni un modelo preentrenado de terceros.

### Variables de entrada

La inferencia usa información disponible en el instante de la predicción:

- ETA convencional derivada de distancia y velocidad suavizada.
- Distancia restante en kilómetros.
- Progreso del recorrido entre 0 y 1.
- Variabilidad reciente de velocidad.
- Demora simulada conocida en el punto actual.
- Interacción entre ETA convencional y variabilidad.

El tiempo real restante y los datos futuros no se usan como entrada.

### Datos y entrenamiento reproducible

`scripts/train-ai.js` genera escenarios sintéticos urbanos con variaciones de velocidad, congestión, paradas y demoras. Los datos son exclusivamente sintéticos y no representan mediciones reales de Pasto ni de una empresa de transporte.

El generador usa la semilla fija `20261107`. Se producen 160 escenarios con diez observaciones cada uno. La división se realiza por escenarios completos:

- Entrenamiento: 120 escenarios y 1.200 ejemplos.
- Evaluación: 40 escenarios no vistos y 400 ejemplos.

Ninguna observación de un mismo escenario aparece en ambos conjuntos. La normalización se calcula únicamente con entrenamiento. Los coeficientes se ajustan resolviendo regresión lineal con una regularización numérica mínima en la matriz.

Para reproducir el entrenamiento:

```powershell
npm run train:ai
```

El comando genera `utils/mlModel.js`. Con la semilla y el conjunto actuales, la evaluación medida es:

| Estimador | MAE en escenarios no vistos |
|---|---:|
| Regresión multivariable | 0.1525 min |
| Referencia distancia/velocidad | 2.2122 min |

Estas métricas proceden de los datos sintéticos de evaluación; no miden precisión en transporte real.

### Inferencia en el reloj

`utils/prediction.js` importa los parámetros de `utils/mlModel.js`, normaliza las seis características y ejecuta una suma ponderada determinista compatible con QuickJS. No requiere bibliotecas de Machine Learning durante la ejecución.

Cada tick automático incorpora la velocidad simulada del siguiente checkpoint, actualiza el suavizado exponencial, calcula la variabilidad reciente y solicita una ETA al modelo. Los segundos de demostración no sustituyen los minutos simulados de los checkpoints. Si una entrada o un parámetro no es finito, la aplicación utiliza `distancia / velocidad` como respaldo. Los resultados se limitan a valores finitos y no negativos.

La fuente activa de rutas es `utils/prediction.js`: Casa tiene cuatro checkpoints y Universidad cinco. `utils/routeSimulator.js` contiene un simulador anterior con otros valores; la pantalla ya no lo consumía antes de este rediseño y no se mezclan ambos conjuntos. Se conservan intactos las rutas activas, el modelo y su entrenamiento.

La ETA inferida y la distancia alimentan la máquina de estados sin permitir regresiones:

- `MONITORING`: recorrido normal.
- `EARLY_ALERT`: ETA ≤ 6 minutos o distancia ≤ 1.2 km.
- `NEAR`: ETA ≤ 2 minutos o distancia ≤ 0.35 km.
- `ARRIVED`: distancia ≤ 0.05 km.

Cada estado de alerta se registra antes de solicitar su vibración y se avisa como máximo una vez por viaje; renderizar no produce alertas. Si la vibración está desactivada o el sensor no existe, la alerta visual continúa funcionando. No se cambian las preferencias.

| Estado | Escena nativa Zepp OS 1.0 | Patrón documentado |
|---|---|---|
| Aviso anticipado | 23 en Normal; 24 en Fuerte | Pulso de 20 ms, suave o medio |
| Muy cerca | 25 | Pulso fuerte de 20 ms |
| Llegaste | 9 | Cuatro vibraciones fuertes en 1200 ms |

Son escenas predefinidas, no niveles arbitrarios de intensidad. Las tres son finitas y no requieren temporizadores de vibración. La diferencia percibida entre los pulsos cortos debe comprobarse en la pulsera física. Referencia: [VIBRATE, API 1.0](https://docs.zepp.com/docs/1.0/reference/device-app-api/hmSensor/sensorId/VIBRATE/).

## Estado y ciclo de vida

`getApp()._options.globalData` conserva durante la sesión el destino, idioma, activación de vibración, intensidad, tema y estado del viaje. No se usa almacenamiento físico; por tanto, el tema vuelve a oscuro al cerrar completamente la aplicación.

Viaje usa un solo `timer.createTimer(10000, 10000, callback, {})`, a través de `utils/nativeTimer.js`. Esta abstracción usa exclusivamente la API nativa 1.0 y conserva la referencia devuelta para pasarla intacta a `timer.stopTimer`; no instala polyfills ni depende de `setTimeout` o `setInterval`. `build()` repetido no crea widgets ni controladores adicionales. El temporizador se detiene al llegar, finalizar o destruir la página; cada cancelación invalida también los callbacks pendientes mediante una generación y una marca de actividad. Los callbacks comprueban la página activa, la finalización y el identificador de sesión para no avanzar un viaje anterior. Si falla el inicio, el estado indica EN PAUSA y el pie muestra un código breve de error junto a la identificación de simulación. FINALIZAR sigue accesible.

Viaje crea el sensor `VIBRATE` únicamente al producirse una alerta. Antes de iniciar una escena llama a `stop()`. Al finalizar o destruir la página detiene el sensor y elimina su referencia; al destruirla también anula widgets y predicción. FINALIZAR cancela antes de navegar, incluso si la navegación falla, y permite reintentar la salida. La destrucción termina solo la sesión que pertenece a esa página. Los widgets se actualizan con `setProperty` y su destrucción corresponde al ciclo nativo de página.

No se interceptan gestos ni se fuerza el encendido de pantalla. La navegación nativa destruye la página saliente según el [enrutamiento de Zepp OS 1.0](https://docs.zepp.com/docs/1.0/guides/framework/device/router/). No se añaden hooks `onPause`/`onResume` no documentados para estas páginas. El apagado, suspensión o salida del sistema pueden afectar los tiempos; no se garantiza seguimiento ni alertas en segundo plano. Referencias: [temporizador nativo](https://docs.zepp.com/docs/1.0/reference/device-app-api/timer/createTimer/) y [actualización de FILL_RECT](https://docs.zepp.com/docs/1.0/reference/device-app-api/hmUI/widget/FILL_RECT/).

### Diagnóstico del fallo físico de avance

La primera versión automática pasó Node y compilación, pero el usuario observó «Simulación automática no disponible» en la Smart Band 7. Ese texto solo se emitía en el `catch` de `startAutoAdvance()`: API ausente, excepción de creación o rechazo del resultado con `typeof timerId !== 'number'`. No provenía de la ETA de 20 minutos ni de los controles del callback o de `onDestroy`. El registro anterior descartaba el error original, por lo que el mensaje por sí solo no permite distinguir esas causas en el firmware.

Se reprodujo un defecto concreto con una API nativa simulada que devuelve un identificador opaco: la versión anterior creaba el temporizador, lo rechazaba por su tipo, llamaba inmediatamente a `stopTimer` y mostraba el aviso. Las pruebas anteriores solo devolvían números. La documentación describe un resultado numérico, pero su [polyfill oficial](https://docs.zepp.com/docs/1.0/guides/best-practice/polyfill/setTimeout/) devuelve la referencia sin convertirla ni exigir ese tipo. La corrección conserva esa referencia; rechaza resultados ausentes o explícitamente inválidos. **La reproducción local demuestra esa cancelación prematura; no demuestra todavía que el firmware del usuario devuelva un objeto. Sin registros del dispositivo, esa explicación del fallo físico permanece como hipótesis y requiere la siguiente prueba.**

Los registros nuevos indican `RideWake timer: created delay=10000 repeat=10000 handleType=...`, cada checkpoint realmente ejecutado y la cancelación. No se convierten ni serializan identificadores opacos. Los errores conservan su motivo original:

| Código | Diagnóstico |
|---|---|
| T01 | Falta `timer`, `createTimer` o `stopTimer`; se registran sus tipos |
| T02 | La llamada nativa de creación lanzó una excepción; se registra su mensaje |
| T03 | La creación devolvió un resultado ausente/inválido; se registra tipo y valor |
| T04 | Falló la cancelación nativa; se invalidan callbacks y se reintenta al limpiar de nuevo |

No se prueban APIs alternativas inventadas si falta el temporizador. El diseño no muestra el antiguo aviso superior, pero tampoco presenta EN RUTA cuando detecta un fallo de inicio. La nueva compilación es candidata a validación física, no una solución confirmada en hardware.

## Desarrollo y validación

Instalar dependencias:

```powershell
npm install
```

Entrenar y exportar el modelo:

```powershell
npm run train:ai
```

Ejecutar pruebas:

```powershell
npm test
```

Compilar para el único target `band-7`:

```powershell
npx --no-install zeus build -t band-7
```

Generar posteriormente el QR, cuando se quiera probar físicamente:

```powershell
npm run preview
```

### Prueba física de la simulación

La compilación nueva queda en `dist/`; `release/RideWake-AI-1.0.0.zab` corresponde a la versión anterior y no se sobrescribe. Todos los cambios del rediseño son locales, pendientes de revisión física.

1. Instala o abre la compilación local para `band-7` con tu flujo habitual de Zeus/QR.
2. Activa Vibración y selecciona Casa. Entra por Destino → Confirmar → INICIAR. Mantén visible la página de viaje durante la demostración.
3. Sin pulsar nada, comprueba esta secuencia aproximada; el ETA se recalcula con el modelo en cada checkpoint:

| Tiempo activo | Casa | Universidad |
|---|---|---|
| 0 s | En ruta, 2,40 km | En ruta, 4,10 km |
| 10 s | Aviso anticipado, 1,05 km | En ruta, 2,70 km; nueva referencia |
| 20 s | Muy cerca, 0,28 km | Aviso anticipado, 1,10 km |
| 30 s | Llegaste, 0,00 km, ETA 0 min | Muy cerca, 0,30 km |
| 40 s | Sin cambios ni nuevas alertas | Llegaste, 0,00 km, ETA 0 min |

4. Comprueba el pulso breve, el pulso fuerte y los cuatro pulsos finales. Espera otros 15 segundos tras llegar: la alerta final no debe repetirse.
5. Repite con Universidad, Vibración No, ajuste Fuerte, ambos idiomas y ambos temas. Con Vibración No deben verse los mismos estados en silencio.
6. Finaliza antes de los 10 segundos y espera: no debe vibrar. Repite saliendo con navegación nativa, luego inicia otro viaje y verifica que comienza desde el primer punto.
7. Comprueba lectura, márgenes, botón inferior y gestos en el dispositivo. Las pruebas locales cubren 192×349 y 192×490; la métrica aproximada de texto en Node no sustituye la fuente real del firmware. Observa aparte el comportamiento al apagar y despertar la pantalla.
8. Para validar esta corrección, prioriza Universidad durante 40 segundos: a los 10 s debe cambiar a 2,70 km aunque siga el primer punto; a los 20/30/40 s deben activarse los puntos segundo/tercero/cuarto y sus tres alertas. Si aparece EN PAUSA, anota el código T01/T02/T03 del pie y el registro correspondiente. Si sigue EN RUTA sin cambiar distancia después de 10 s, conserva los registros `created` y `checkpoint`; un identificador devuelto no basta para confirmar que el firmware ejecutó el callback.

La suite `trip-automatic.test.js` ejecuta los módulos reales de sesión, idioma, tema, predicción, temporización y vibración con un reloj controlable. Cubre 32 combinaciones de ruta/idioma/tema/altura/vibración y escenarios adicionales sin `setTimeout` ni `setInterval`, con identificadores numéricos y opacos. Comprueba identidad al cancelar, cuatro puntos, callbacks, sensor que exige `stop` entre llamadas a `start`, cancelaciones anticipadas, reinicios, fallos T01–T04 y reintento de navegación sin esperas reales. Estas pruebas no ejecutan el firmware físico.

## Limitaciones

- Los recorridos, velocidades, congestión y demoras son simulados.
- El MAE documentado corresponde a escenarios sintéticos, no a viajes reales.
- El modelo no aprende continuamente en la pulsera.
- No existe GPS, conectividad con transporte público ni servidor remoto.
- Las preferencias duran únicamente durante la sesión activa.
- La navegación, inferencia y vibraciones requieren validación final en la Xiaomi Smart Band 7 física.
- La pantalla amarilla intermitente observada anteriormente no tiene una causa confirmada y no se considera resuelta.

Desarrollado por Luis Sebastián Díaz — Universidad Cooperativa de Colombia, UCC Pasto.
