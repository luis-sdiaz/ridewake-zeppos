# RideWake AI

**Aplicación para smartwatch con predicción del tiempo de llegada y alertas de proximidad.**

RideWake AI es una aplicación desarrollada para la **Xiaomi Smart Band 7**, cuyo propósito es ayudar a las personas que utilizan el transporte público a estar pendientes de su destino sin tener que revisar constantemente el celular.

La aplicación permite seleccionar un destino, consultar la distancia restante y el tiempo estimado de llegada (ETA), visualizar el progreso del recorrido y recibir alertas por vibración cuando se aproxima la parada.

Para calcular el ETA se implementó un modelo de Machine Learning basado en regresión lineal multivariable. El proyecto funciona actualmente con recorridos simulados, lo que permite demostrar sus principales características directamente desde el reloj.

## 1. Problemática

Durante los desplazamientos en transporte público es común que las personas se distraigan utilizando el celular, escuchando música o incluso se queden dormidas. Esto puede ocasionar que no identifiquen a tiempo la parada en la que deben bajarse.

A partir de esta situación surgió la idea de desarrollar RideWake AI, una aplicación que aprovecha las funciones de una pulsera inteligente para mostrar información del viaje y avisar al usuario cuando se acerca a su destino.

La propuesta busca ofrecer una experiencia sencilla y práctica, especialmente en un dispositivo donde el espacio de pantalla es limitado y la información debe poder consultarse rápidamente.

## 2. Objetivo del proyecto

Desarrollar una aplicación para smartwatch que permita seleccionar destinos, visualizar el avance de un recorrido y estimar el tiempo restante mediante Machine Learning, incorporando alertas visuales y hápticas para informar al usuario cuando se aproxima a su destino.

## 3. Funcionalidades principales

RideWake AI cuenta con las siguientes funcionalidades:

- Selección rápida de los destinos Casa y Universidad.
- Teclado personalizado para seleccionar Centro, Belén y Único.
- Consulta de distancia y tiempo estimado de llegada.
- Confirmación del destino antes de comenzar un recorrido.
- Seguimiento automático mediante puntos de control simulados.
- Actualización del ETA utilizando un modelo de Machine Learning.
- Indicador visual de cuatro etapas del recorrido.
- Alertas automáticas por vibración según la proximidad al destino.
- Configuración del idioma en español e inglés.
- Activación y desactivación de vibraciones.
- Temas de apariencia claro y oscuro.
- Interfaz adaptada a las dimensiones de la Xiaomi Smart Band 7.

### Destinos disponibles

Actualmente la aplicación permite realizar recorridos completos hacia cinco destinos.

| Destino | Selección | Distancia inicial de demostración |
|---|---|---:|
| Casa | Botón de Inicio | 2,4 km |
| Universidad | Botón de Inicio | 4,1 km |
| Centro | Teclado personalizado | 3,0 km |
| Belén | Teclado personalizado | 3,6 km |
| Único | Teclado personalizado | 2,8 km |

Los destinos Centro, Belén y Único se seleccionan escribiendo su nombre desde la opción **OTRO DESTINO**.

El teclado reconoce los nombres sin importar el uso de mayúsculas o minúsculas. También permite escribir `belen` y `unico` sin tildes.

Una vez seleccionado el destino, se puede continuar normalmente por las pantallas de información, confirmación y seguimiento del viaje.

Por ahora, el sistema trabaja con estos cinco destinos. Si se escribe un nombre que no está disponible, la aplicación informa al usuario en lugar de iniciar una ruta incorrecta.

**Nota:** las distancias y los recorridos corresponden a escenarios simulados. No son mediciones obtenidas mediante GPS.

## 4. Diseño de interfaces

Uno de los principales retos del proyecto fue desarrollar una interfaz que resultara cómoda de utilizar en una pantalla pequeña.

Durante el diseño se priorizaron la legibilidad, el contraste de colores, la distribución de los elementos, el tamaño de los botones y la navegación entre pantallas.

La aplicación cuenta con seis pantallas:

| Pantalla | Descripción |
|---|---|
| **Inicio** | Permite seleccionar un destino, comenzar el recorrido y acceder a los ajustes. |
| **Teclado** | Permite escribir y seleccionar destinos mediante grupos de letras. |
| **Destino** | Muestra la distancia inicial, el ETA y la información del recorrido. |
| **Confirmación** | Permite revisar los datos del destino antes de iniciar el viaje. |
| **Viaje en curso** | Presenta el progreso, la distancia restante, el ETA y las alertas de proximidad. |
| **Ajustes** | Permite cambiar el idioma, configurar las vibraciones y seleccionar el tema visual. |

Para mantener una apariencia consistente se utilizaron colores turquesa en las acciones principales y en los indicadores importantes. También se implementaron temas claro y oscuro para ofrecer distintas opciones de visualización.

El teclado se diseñó específicamente para la pulsera, agrupando las letras en botones que facilitan la escritura sin necesidad de utilizar un teclado convencional.

La interfaz fue probada en una Xiaomi Smart Band 7 física para comprobar la navegación, la distribución de los elementos y el funcionamiento de los controles.

## 5. Funcionamiento de la aplicación

El recorrido comienza cuando el usuario selecciona un destino y confirma que desea iniciar el viaje.

El flujo general es:

**Inicio → Destino → Confirmación → Viaje en curso → Llegada**

Cuando se utiliza un destino escrito, primero se accede al teclado para seleccionarlo.

Durante el recorrido, RideWake AI actualiza automáticamente la distancia restante, el ETA y la referencia del trayecto.

La aplicación utiliza puntos de control (*checkpoints*) que representan diferentes momentos del desplazamiento. En la demostración, cada punto avanza automáticamente después de 10 segundos, permitiendo observar el comportamiento de la aplicación en un tiempo reducido.

### Estados del recorrido

| Estado | Funcionamiento |
|---|---|
| **En ruta** | Muestra la información del viaje mientras el destino todavía está lejos. |
| **Aviso anticipado** | Informa que el usuario comienza a acercarse al destino y genera una primera alerta. |
| **Muy cerca** | Indica una proximidad mayor y activa una nueva vibración. |
| **Llegaste** | Muestra la llegada al destino y ejecuta la alerta final. |

Estos estados se representan mediante textos y un indicador de progreso de cuatro puntos.

Las vibraciones se ejecutan utilizando los patrones disponibles en Zepp OS 1.0. Si el usuario desactiva esta función desde Ajustes, el seguimiento visual continúa funcionando.

## 6. Inteligencia artificial

RideWake AI incorpora un modelo de **Machine Learning basado en regresión lineal multivariable**, utilizado para estimar el tiempo restante de un recorrido.

El modelo fue entrenado previamente en el computador y sus parámetros se integraron posteriormente en la aplicación. De esta forma, el reloj puede calcular el ETA localmente sin depender de un servidor para realizar las predicciones.

### Variables utilizadas

El modelo considera seis características:

1. ETA inicial calculado a partir de la distancia y la velocidad.
2. Distancia restante del recorrido.
3. Porcentaje de progreso del viaje.
4. Variabilidad reciente de la velocidad.
5. Demoras conocidas del escenario.
6. Relación entre el ETA inicial y la variabilidad de velocidad.

Estas variables permiten que la estimación cambie a medida que se actualiza la información de cada checkpoint.

### Entrenamiento del modelo

Para entrenar el modelo se desarrolló un script en JavaScript ejecutado mediante Node.js.

Se generaron escenarios sintéticos de desplazamiento que incluyen variaciones de velocidad, tiempos de recorrido y demoras.

Los datos se dividieron en dos conjuntos:

| Conjunto | Cantidad |
|---|---:|
| Entrenamiento | 1.200 ejemplos |
| Evaluación | 400 ejemplos |

La evaluación se realizó utilizando escenarios diferentes de los empleados para entrenar el modelo.

Los resultados obtenidos fueron:

| Método | Error medio absoluto (MAE) |
|---|---:|
| Regresión lineal multivariable | 0,1525 minutos |
| Estimación base mediante distancia y velocidad | 2,2122 minutos |

En los escenarios sintéticos de evaluación, el modelo de regresión presentó un error menor que el método de referencia.

**Estos resultados corresponden únicamente a datos simulados y no representan una precisión comprobada en recorridos reales de transporte público.**

### Integración con el reloj

El entrenamiento y las predicciones se organizan principalmente en tres archivos:

- `scripts/train-ai.js`: genera los datos y entrena el modelo.
- `utils/mlModel.js`: contiene los parámetros obtenidos durante el entrenamiento.
- `utils/prediction.js`: utiliza el modelo para calcular el ETA y actualizar la información del viaje.

Durante el recorrido, los nuevos datos del checkpoint se procesan para calcular nuevamente el tiempo restante.

Las alertas de proximidad se activan mediante reglas que utilizan la distancia y el ETA disponible. De esta manera, el sistema combina el modelo predictivo con la lógica de seguimiento del viaje.

## 7. Tecnologías utilizadas

| Tecnología | Uso dentro del proyecto |
|---|---|
| **JavaScript** | Desarrollo de las pantallas y la lógica de la aplicación. |
| **Zepp OS 1.0** | Sistema y APIs utilizadas para ejecutar la aplicación en la pulsera. |
| **QuickJS** | Ejecución del código JavaScript en el dispositivo. |
| **Zeus CLI 1.8.2** | Compilación y preparación de la aplicación para el reloj. |
| **Node.js** | Entrenamiento del modelo y ejecución de pruebas automatizadas. |
| **Visual Studio Code** | Entorno de desarrollo. |
| **Git y GitHub** | Control de versiones y almacenamiento del código fuente. |

**Dispositivo de pruebas:** Xiaomi Smart Band 7 estándar, con identificador `deviceSource: 263`.

## 8. Estructura del proyecto

```text
ridewake-zeppos/
├── assets/                  # Recursos e ícono de la aplicación
├── page/                    # Pantallas de la interfaz
│   ├── index.js
│   ├── keyboard.js
│   ├── destination.js
│   ├── confirmation.js
│   ├── trip.js
│   └── settings.js
├── utils/                   # Lógica y funciones compartidas
│   ├── prediction.js
│   ├── mlModel.js
│   ├── session.js
│   ├── haptics.js
│   ├── nativeTimer.js
│   ├── i18n.js
│   ├── theme.js
│   └── layout.js
├── scripts/                 # Entrenamiento y compilación
│   ├── train-ai.js
│   └── build-band7-patched.js
├── test/                    # Pruebas automatizadas
├── app.js
├── app.json
├── package.json
└── README.md
```

## 9. Instalación y ejecución

Para ejecutar el proyecto es necesario contar con Node.js y npm instalados, además de configurar el entorno de desarrollo de Zepp OS para trabajar con la Xiaomi Smart Band 7.

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

La compilación genera un paquete `.zab` en el directorio `dist/`.

### Generar el código QR para realizar pruebas en el reloj

```bash
npm run preview:band-7
```

Este comando permite generar el QR utilizado durante las pruebas con la aplicación Zepp y el dispositivo vinculado.

### Entrenar nuevamente el modelo

```bash
npm run train:ai
```

Este comando ejecuta el entrenamiento y actualiza los parámetros del modelo.

### Nota sobre la compilación

Durante el desarrollo se encontró un problema de redimensionamiento del ícono dentro del empaquetador de Zeus CLI para la Smart Band 7.

Para manejarlo se incorporó `scripts/build-band7-patched.js`, que aplica temporalmente una comprobación durante la compilación y después restaura el archivo original de la herramienta.

Por esta razón, se recomienda utilizar los comandos `build:band-7` y `preview:band-7` definidos en el proyecto.

## 10. Pruebas y resultados

Para comprobar el funcionamiento de RideWake AI se implementaron pruebas automatizadas y se realizaron pruebas directamente en una Xiaomi Smart Band 7.

Las pruebas cubren aspectos como:

- Navegación entre pantallas.
- Selección y validación de destinos.
- Funcionamiento del teclado personalizado.
- Configuración de idioma y apariencia.
- Predicción del ETA.
- Avance automático de los recorridos.
- Transiciones entre estados.
- Activación y control de vibraciones.
- Finalización del viaje y liberación de recursos.
- Adaptación de la interfaz a diferentes dimensiones de pantalla.

### Resultados de las pruebas automatizadas

| Indicador | Resultado |
|---|---:|
| Suites de pruebas | 11 |
| Suites aprobadas | 11 |
| Aserciones correctas | 39.874 |

La aplicación también se compiló correctamente para el dispositivo `band-7`.

### Validación en el dispositivo físico

Se realizaron pruebas en la Xiaomi Smart Band 7 para comprobar el funcionamiento de la interfaz y de los recorridos.

Inicialmente se validaron Casa y Universidad. Posteriormente, se implementaron y probaron los destinos Centro, Belén y Único, verificando que pudieran seleccionarse desde el teclado y completar el flujo de viaje.

Estas pruebas permitieron comprobar el comportamiento de la navegación, la actualización automática del recorrido y la presentación de los estados de proximidad en el dispositivo.

## 11. Alcance actual y mejoras futuras

RideWake AI es un prototipo funcional que permite demostrar una propuesta de seguimiento de recorridos y alertas de proximidad desde un smartwatch.

Actualmente utiliza rutas simuladas debido a que la Xiaomi Smart Band 7 estándar no dispone de GPS integrado y todavía no existe una conexión con la ubicación del teléfono.

Por este motivo, la aplicación no realiza seguimiento en tiempo real de vehículos ni utiliza información de rutas de transporte público.

Además, el modelo predictivo fue entrenado con datos sintéticos y todavía no ha sido evaluado con mediciones reales de desplazamiento.

Como posibles mejoras futuras se plantean:

- Integrar la ubicación GPS del teléfono móvil.
- Implementar seguimiento mediante datos reales de recorridos.
- Incorporar más destinos y rutas.
- Evaluar y mejorar el modelo con información real de transporte.
- Guardar las preferencias del usuario entre sesiones.
- Explorar mecanismos de alertas y seguimiento que puedan funcionar cuando la aplicación no esté visible.

## 12. Conclusiones

El desarrollo de RideWake AI permitió aplicar conocimientos de programación, diseño de interfaces y Machine Learning en un dispositivo con recursos y dimensiones limitadas.

Uno de los principales aprendizajes fue adaptar la navegación y la presentación de información a la pantalla de una pulsera inteligente, buscando que las funciones importantes fueran fáciles de identificar y utilizar.

También fue posible integrar un modelo predictivo dentro de la aplicación y relacionar sus estimaciones con un sistema de alertas visuales y por vibración.

Aunque todavía se trabaja con recorridos simulados, el proyecto permitió desarrollar y probar una aplicación funcional en hardware real, estableciendo una base para futuras integraciones con información de ubicación y transporte.

## 13. Autor

**Luis Sebastián Díaz**

Universidad Cooperativa de Colombia  
Sede Pasto

Proyecto académico de desarrollo de software y diseño de interfaces para dispositivos inteligentes.
