# RideWake AI

Aplicación nativa de demostración para Xiaomi Smart Band 7. RideWake AI simula un recorrido, estima localmente el tiempo restante y genera alertas visuales y hápticas antes del destino.

El prototipo usa Zepp OS 1.0, QuickJS, Zeus CLI 1.8.2 y una única plataforma con `deviceSource: 263`. No utiliza GPS, Internet, Firebase ni datos reales de transporte.

## Pantallas y flujo

La aplicación registra cinco páginas:

1. `page/index`: selección Casa o Universidad y acceso a Ajustes.
2. `page/destination`: ruta, distancia y ETA iniciales de demostración.
3. `page/confirmation`: confirmación e inicio protegido contra pulsaciones repetidas.
4. `page/trip`: inferencia, estados del recorrido, alertas y avance manual.
5. `page/settings`: idioma, vibración e intensidad durante la sesión.

El recorrido se avanza manualmente. No se crean temporizadores de simulación. Las pantallas usan fondo negro nativo y widgets `TEXT` y `BUTTON` dentro de 192×349 píxeles.

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

Cada pulsación de AVANZAR incorpora una nueva velocidad observada, actualiza el suavizado exponencial, calcula la variabilidad reciente y solicita una ETA al modelo. Si una entrada o un parámetro no es finito, la aplicación utiliza `distancia / velocidad` como respaldo. Los resultados se limitan a valores finitos y no negativos.

La ETA inferida y la distancia alimentan la máquina de estados sin permitir regresiones:

- `MONITORING`: recorrido normal.
- `EARLY_ALERT`: ETA ≤ 6 minutos o distancia ≤ 1.2 km.
- `NEAR`: ETA ≤ 2 minutos o distancia ≤ 0.35 km.
- `ARRIVED`: distancia ≤ 0.05 km.

Las transiciones a `EARLY_ALERT`, `NEAR` y `ARRIVED` activan como máximo una vibración. Las escenas son 23/24 para aviso anticipado y 25 para proximidad o llegada. Si la vibración está desactivada o el sensor no existe, la alerta visual continúa funcionando.

## Estado y ciclo de vida

`getApp()._options.globalData` conserva durante la sesión el destino, idioma, activación de vibración, intensidad y estado del viaje. No se usa almacenamiento físico.

Viaje crea el sensor `VIBRATE` únicamente al producirse una alerta. Antes de iniciar una escena llama a `stop()`. Al finalizar o destruir la página detiene el sensor, elimina su referencia y anula las referencias a widgets y predicción. No existen timers de viaje ni de vibración.

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
npm run build
```

Generar posteriormente el QR, cuando se quiera probar físicamente:

```powershell
npm run preview
```

## Limitaciones

- Los recorridos, velocidades, congestión y demoras son simulados.
- El MAE documentado corresponde a escenarios sintéticos, no a viajes reales.
- El modelo no aprende continuamente en la pulsera.
- No existe GPS, conectividad con transporte público ni servidor remoto.
- Las preferencias duran únicamente durante la sesión activa.
- La navegación, inferencia y vibraciones requieren validación final en la Xiaomi Smart Band 7 física.
- La pantalla amarilla intermitente observada anteriormente no tiene una causa confirmada y no se considera resuelta.

Desarrollado por Luis Sebastián Díaz — Universidad Cooperativa de Colombia, UCC Pasto.
