# RideWake AI

**Aplicación para smartwatch con predicción de tiempo de llegada y alertas de proximidad.**

RideWake AI es una aplicación desarrollada para la **Xiaomi Smart Band 7**, cuyo objetivo es ayudar a los usuarios del transporte público a reconocer cuándo están próximos a llegar a su destino.

El proyecto combina una interfaz diseñada para pantallas pequeñas, un modelo de Machine Learning para estimar el tiempo de llegada (ETA) y alertas mediante vibraciones.

## 1. Problemática

Durante los viajes en transporte público es común que las personas se distraigan, utilicen el celular o incluso se queden dormidas. Esto puede ocasionar que pasen por alto la parada donde necesitan bajarse.

A partir de esta situación desarrollé RideWake AI, una propuesta que busca aprovechar las características de un reloj inteligente para ofrecer información del recorrido y avisos progresivos de proximidad.

El propósito es que el usuario pueda consultar su viaje de manera rápida y recibir alertas sin depender constantemente de la pantalla del celular.

## 2. Objetivo

Desarrollar una aplicación para smartwatch que permita visualizar el progreso de un recorrido, estimar el tiempo restante mediante Machine Learning y generar alertas hápticas cuando el usuario se aproxima a su destino.

## 3. Funcionalidades implementadas

- Selección de destinos predefinidos: Casa y Universidad.
- Consulta de distancia y tiempo estimado de llegada.
- Confirmación del viaje antes de iniciarlo.
- Avance automático del recorrido simulado.
- Actualización del ETA mediante un modelo predictivo.
- Indicador visual de cuatro etapas del recorrido.
- Tres alertas de vibración según la proximidad al destino.
- Teclado para escribir destinos personalizados.
- Interfaz disponible en español e inglés.
- Configuración de vibraciones.
- Temas claro y oscuro.
- Diseño adaptado a la pantalla de la Xiaomi Smart Band 7.

Los destinos personalizados pueden escribirse y guardarse durante la sesión, pero la generación de recorridos está implementada actualmente para Casa y Universidad.

## 4. Diseño de interfaces

Uno de los aspectos principales del proyecto fue adaptar la experiencia de usuario a las dimensiones y características de una pulsera inteligente.

La aplicación cuenta con seis pantallas:

| Pantalla | Función |
|---|---|
| **Inicio** | Seleccionar un destino y acceder a los ajustes. |
| **Destino** | Consultar la información inicial del recorrido. |
| **Confirmación** | Revisar el destino antes de iniciar el viaje. |
| **Viaje en curso** | Visualizar distancia, ETA, progreso y alertas. |
| **Ajustes** | Configurar idioma, vibración y apariencia. |
| **Teclado** | Escribir destinos mediante grupos de letras. |

Durante el diseño se tuvieron en cuenta la legibilidad, el contraste, la jerarquía visual, el tamaño de los botones y la facilidad de navegación.

Se incorporaron colores turquesa para destacar acciones e información importante, estados visuales de selección y una línea de progreso que permite identificar rápidamente la etapa del recorrido.

La interfaz fue probada directamente en la Xiaomi Smart Band 7 para comprobar el comportamiento de los botones, la navegación y la distribución de los elementos.

## 5. Inteligencia artificial

RideWake AI incorpora un modelo de **Machine Learning basado en regresión lineal multivariable**, desarrollado para calcular el tiempo estimado de llegada.

El modelo utiliza seis características relacionadas con el viaje, incluyendo la distancia restante, el progreso del recorrido, el tiempo estimado inicial, la variación de velocidad y las demoras del escenario.

### Entrenamiento

El entrenamiento se realizó en Node.js utilizando datos sintéticos generados para representar diferentes condiciones de desplazamiento.

| Datos utilizados | Cantidad |
|---|---:|
| Ejemplos de entrenamiento | 1.200 |
| Ejemplos de evaluación | 400 |

En las pruebas sobre escenarios sintéticos se obtuvieron los siguientes resultados:

| Método | Error medio absoluto (MAE) |
|---|---:|
| Modelo de regresión multivariable | 0,1525 minutos |
| Estimación base por distancia y velocidad | 2,2122 minutos |

Estos valores corresponden a datos sintéticos de evaluación y no representan precisión comprobada en viajes reales.

### Funcionamiento dentro del reloj

El entrenamiento se ejecuta previamente en el computador. Posteriormente, los parámetros del modelo se incorporan a la aplicación para realizar las predicciones de ETA directamente en la pulsera.

Durante el recorrido simulado, la aplicación actualiza los datos de cada punto de control y vuelve a calcular el tiempo estimado.

Los archivos principales son:

- `scripts/train-ai.js`: entrenamiento del modelo.
- `utils/mlModel.js`: parámetros del modelo entrenado.
- `utils/prediction.js`: cálculo de predicciones y seguimiento del recorrido.

## 6. Seguimiento y alertas

La pantalla **Viaje en curso** representa cuatro etapas:

1. **En ruta:** muestra los datos iniciales del viaje.
2. **Aviso anticipado:** informa que el destino comienza a estar próximo.
3. **Muy cerca:** indica una proximidad mayor y genera otra alerta.
4. **Llegaste:** informa que se alcanzó el destino.

Las alertas se activan automáticamente mediante patrones de vibración compatibles con Zepp OS 1.0.

Para demostrar el funcionamiento se utilizan checkpoints que avanzan cada 10 segundos. Este tiempo corresponde a una simulación acelerada y es independiente del ETA estimado del recorrido.

## 7. Tecnologías utilizadas

| Tecnología | Aplicación en el proyecto |
|---|---|
| JavaScript | Desarrollo de la aplicación. |
| Zepp OS 1.0 | Sistema operativo del dispositivo. |
| QuickJS | Ejecución del código en el reloj. |
| Zeus CLI 1.8.2 | Compilación y pruebas en el dispositivo. |
| Node.js | Entrenamiento del modelo y pruebas automatizadas. |
| Git y GitHub | Control de versiones. |
| Visual Studio Code | Entorno de desarrollo. |

**Dispositivo utilizado:** Xiaomi Smart Band 7 estándar (`deviceSource: 263`).

## 8. Instalación y ejecución

### Clonar el repositorio

```bash
git clone https://github.com/luis-sdiaz/ridewake-zeppos.git
cd ridewake-zeppos
```

### Instalar las dependencias

```bash
npm ci
```

### Ejecutar las pruebas

```bash
npm test
```

### Compilar para Xiaomi Smart Band 7

```bash
npm run build:band-7
```

### Generar el QR para instalar en el reloj

```bash
npm run preview:band-7
```

Para utilizar el QR se necesita el dispositivo vinculado a Zepp App y el entorno de desarrollo configurado.

### Entrenar nuevamente el modelo

```bash
npm run train:ai
```

**Nota:** el proyecto utiliza un script de compilación específico para Band 7 porque el empaquetador de Zeus CLI presenta un problema con el tamaño del ícono del dispositivo. El script evita el redimensionamiento inválido y restaura la herramienta después del proceso.

## 9. Pruebas y resultados

El proyecto cuenta con pruebas automatizadas para verificar la navegación, los ajustes, el diseño adaptable, el modelo predictivo, los temporizadores y las alertas hápticas.

En la última ejecución se obtuvieron:

- **11 suites de pruebas aprobadas.**
- **39.813 aserciones correctas.**
- Compilación del paquete para Band 7.
- Verificación del funcionamiento en el dispositivo físico.

Durante las pruebas físicas se comprobó el recorrido automático, la actualización visual de los estados, la navegación entre pantallas y la presentación del ícono de la aplicación.

## 10. Alcance y mejoras futuras

RideWake AI funciona actualmente con rutas y condiciones de viaje simuladas.

La Xiaomi Smart Band 7 estándar no dispone de GPS integrado, por lo que una posible mejora consiste en conectar la aplicación con el GPS de un teléfono móvil para recibir ubicaciones reales.

Entre las mejoras futuras se consideran:

- Integración con información GPS del celular.
- Cálculo de distancias utilizando recorridos reales.
- Incorporación de nuevos destinos.
- Evaluación del modelo predictivo con datos reales de transporte.
- Persistencia de preferencias entre sesiones.
- Ampliación de las opciones de personalización.

## 11. Autor

**Luis Sebastián Díaz**

Universidad Cooperativa de Colombia  
Sede Pasto

Proyecto académico de desarrollo y diseño de interfaces para dispositivos inteligentes.
