# Guía de Resolución de Problemas (Troubleshooting & Post-Mortem)

Esta guía documenta los problemas técnicos, de diseño y visuales encontrados durante el desarrollo de **Kiwi Bakery**, sus causas raíces y cómo se solucionaron. Sirve como referencia para evitar cometer los mismos errores en futuras expansiones o proyectos similares.

---

## 🎮 1. Mecánicas e Interacciones del Juego

### 1.1. Monotonía en Pedidos tras Agotarse una Masa (Bug de Masa Agotada)
* **Síntoma**: Si la masa clásica se agotaba en una partida pero quedaban existencias de chocolate o avena, los clientes dejaban de pedir galletas y solo pedían bebidas.
* **Causa Raíz**: Lógica de selección de ingredientes de pedidos en `GameScene.js` con dependencia dura con la masa por defecto (clásica). Al no estar disponible esa masa, la función fallaba y forzaba el pedido a bebida para evitar un crash.
* **Solución**: Se reestructuró la selección en `GameScene.js` para escanear el inventario, filtrar las masas desbloqueadas con stock mayor a cero (`stock > 0`) y elegir aleatoriamente de esa lista.
* **Lección**: Las validaciones de inventario deben ser dinámicas y basadas en colecciones filtradas en tiempo real.

### 1.2. Moldes de Galletas Bloqueados por Días (Conflicto con la Tienda)
* **Síntoma**: En el día 2, el juego forzaba a que los clientes pidieran únicamente la forma de corazón, ignorando las compras de la tienda.
* **Causa Raíz**: Lógica heredada del prototipo inicial donde los moldes se desbloqueaban según el día transcurrido, anulando las compras del jugador en la `ShopScene.js`.
* **Solución**: Se eliminó el desbloqueo secuencial por días. Ahora los pedidos de formas se generan aleatoriamente basándose únicamente en los moldes adquiridos en el inventario.
* **Lección**: Al implementar tiendas dinámicas, elimina las dependencias temporales duras en las escenas.

### 1.3. Desaparición de Galletas Crudas en la Bandeja al Sacar del Horno
* **Síntoma**: Si el jugador tenía galletas en la bandeja de preparación (por ejemplo, una galleta cruda) y retiraba otras galletas del horno, la galleta de la bandeja desaparecía, quedando únicamente las recién horneadas.
* **Causa Raíz**: En `GameScene.js`, la función `handleOvenImageClick()` realizaba `this.prepTrayCookies = [];` al iniciar la extracción, limpiando y perdiendo el contenido previo de la bandeja antes de añadir las galletas del horno.
* **Solución**: Se eliminó el vaciado del arreglo de galletas de la bandeja en `handleOvenImageClick()`, de modo que las galletas extraídas simplemente se añaden al final del listado mediante `.push()`.
* **Lección**: No asumas que un contenedor de destino está vacío al transferir objetos; preserva siempre los elementos existentes a menos que la mecánica requiera un reemplazo total.

### 1.4. Requisito de Taza Vacía Arrastrable en la Cafetería
* **Síntoma**: Se requería añadir una nueva interacción al proceso de preparación: arrastrar una taza vacía desde el techo de la cafetera hasta la boquilla, y posteriormente, arrastrar la bebida preparada directamente a la bandeja de entrega.
* **Solución**:
  1. Se generó una textura procedimental `'beverage_empty_cup'` en `BootScene.js` con relleno nulo.
  2. Se actualizó el ciclo de estados de la cafetera agregando el estado `'no_cup'`.
  3. Se creó una pila interactiva de tazas vacías en el techo de la cafetera (`startY - 68` por defecto). Habilitamos su arrastre (`dragstart`, `drag`, `dragend`): si se suelta a menos de 75px del dispensador de la cafetera se encaja en el mostrador, de lo contrario retorna suavemente con un tween de 250ms a la pila.
  4. Se bloqueó el inicio de preparación de bebidas mediante una validación en `handleDrinkIngredientDrop` si el estado es `'no_cup'`.
  5. Se implementó `makeCupDraggable()` para que, cuando la bebida esté lista, el sprite de la taza con líquido sea arrastrable. Si el jugador la desliza y suelta a menos de 85px de la Bandeja de Entrega, se llama a `pickupDrink()` para servirla; si se suelta fuera, regresa suavemente a la cafetera restableciendo su profundidad (`setDepth(4)`).
* **Lección**: Al agregar capas adicionales de interacción física (como arrastrar el contenedor y luego el contenido preparado), mantén comportamientos de retorno mediante animaciones tween amortiguadas si la colisión falla, asegurando una UX fluida y sin saltos visuales bruscos.

### 1.5. Mecánica de Rasguñar Clientes (Garras Fuera)
* **Síntoma**: Se deseaba añadir una interacción graciosa de "castigo" o juego salvaje: si el jugador pasa la pata cerrada (con garras) y vacía sobre el cliente activo, este reacciona dolorido/enojado y huye del local sin pagar ni recibir pedidos.
* **Solución**:
  1. Se implementó un flag booleano `this.isHoldingItem` en la escena, asignado a `true` al arrancar cualquier arrastre o hacer `pointerdown` (en masa, molde, galleta, taza, o la bandeja de entrega `deliveryDragZone`) y reestablecido a `false` al finalizar. Para evitar rasguños accidentales al hacer clic sostenido en los bordes inferiores de la bandeja de entrega, se amplió la zona interactiva verticalmente (`hitHeight = deliveryTrayHeight + 24`) garantizando un agarre instantáneo y seguro desde cualquier ángulo.
  2. En el ciclo `update()`, si el cliente está activo, el ratón está presionado (`pointer.isDown`, mostrando la pata cerrada con garras) y no se sostiene ningún item (`!this.isHoldingItem`), se calcula la distancia Euclidiana.
  3. Si la distancia al cliente es menor a 95 píxeles, se llama a `scratchCustomer()`.
  4. La función reproduce `SoundEffects.playAngry()`, muestra diálogos aleatorios de queja (rojos) como `"¡AUCH! ¡Qué servicio tan salvaje! 😡🐾"`, dibuja marcas de garras rojas en pantalla usando `graphics` con un fundido rápido, aplica un efecto shake (sacudida) al cliente, y finalmente realiza un tween de huida hacia la izquierda de la pantalla (`x: -300`) antes de destruirse y traer al siguiente cliente a los 1.5s.
* **Lección**: La combinación de inputs de Phaser (pointer.isDown + drag flags) y cálculos de distancia Euclidiana permite crear interacciones físicas ricas y orgánicas (como gestos o ataques a personajes) de manera muy ligera y sin sobrecargar la física del motor. Asegúrate siempre de darle a las hitboxes interactivos un margen de tolerancia holgado (+20px) respecto al arte visual para absorber imperfecciones en los clicks rápidos del usuario.

### 1.6. Música de Fondo y Panel de Audio
* **Síntoma**: Se requería agregar la reproducción de música de fondo (en loop) a partir del archivo `.mp3` suministrado por el usuario, y añadir un icono de nota musical interactivo accesible en el HUD que despliegue un panel para regular el volumen (0% a 100%) y silenciar (Mute/Unmute).
* **Solución**:
  1. Se cargó el audio `'bg_music'` en `BootScene.js` apuntando a `assets/audio/Kiwi's Simple Bakehouse Loop.mp3`.
  2. En `GameScene.js`, se inicializó `this.bgMusic` con volumen recuperado de `localStorage` (o 15% por defecto para que sea sutil).
  3. Se colocó un botón flotante con el icono de nota musical (`🎵`) leyendo su posición de `UI_CONFIG.musicButton` (por defecto en `x: 195, y: 200` debajo del letrero del día), quedando en la zona interactiva del mostrador para ser accesible por la pata del gato (la cual tiene un límite superior de Y = 180). Se habilitó como elemento editable en `this.editableUIElements` para que el usuario pueda reubicarlo mediante arrastre en el Modo Editor de UI y guardarlo en `ui-config.json`.
  4. Al pulsar el botón, se abre `openAudioPanel()` y se activa `this.isAudioPanelOpen = true`. Esto congela la actualización de la pata del gato en `update()`, la hace invisible y activa el cursor de sistema por defecto (`default`) para evitar conflictos al arrastrar o pulsar los botones del panel.
  5. Se implementó la barra visual de volumen, botones `-` / `+` (regulando de 5% en 5% con pasos de `0.05`) y mute, persistiendo las preferencias en `localStorage` (`bg_music_volume` y `bg_music_muted`).
  6. Al cerrar el panel de audio, se establece `this.isAudioPanelOpen = false`, `this.scratchBlockedUntilPointerUp = true` (bloqueando rasguños hasta que el jugador levante el ratón para evitar que el click de la "X" rasguñe al cliente instantáneamente), se oculta de nuevo el cursor de sistema (`none`) y se hace visible la pata del gato para continuar jugando.
* **Lección**: Al alternar menús y elementos modales, implementa flags de control de click persistente (`scratchBlockedUntilPointerUp`) para requerir que el usuario libere el ratón antes de procesar clicks de juego físico (como golpes o garras), evitando falsas colisiones y rasguños indeseados en la transición.

---

## 🛠️ 2. Código e Infraestructura (Vite + Phaser)

### 2.1. Bloqueo en Pantalla de Carga (Ciclo Infinito en BootScene)
* **Síntoma**: El juego se quedaba en "Cargando..." infinitamente y no mostraba el menú principal.
* **Causa Raíz**: Al importar la clase procedural `SoundEffects.js` en múltiples escenas, se omitió la extensión `.js` en las sentencias de importación. Bajo Vite y ES Modules nativos, el navegador requiere obligatoriamente las extensiones de archivos para resolver los módulos locales.
* **Solución**: Se corrigieron todos los imports añadiendo la extensión explícita: `../game/SoundEffects.js`.
* **Lección**: En entornos con módulos ES modernos, todas las importaciones locales de archivos JS **deben** llevar la extensión `.js` explícitamente.

---

## 🎨 3. Arte, Assets y Cursor Dinámico (Pata de Gato)

### 3.2. Reemplazo del Asset de la Cafetera Base (`cafeteteria_base.png`)
* **Síntoma**: La cafetera previa era un gráfico vector dibujado de forma procedimental mediante código en `BootScene.js`. Se requirió reemplazar la estructura por la ilustración artística original subida por el usuario (`public/assets/cafeteteria_base.png`), manteniendo los botones, indicadores y tazas en capas superiores.
* **Solución**:
  1. Se eliminó la función de dibujado procedimental `generateTexture('drink_machine')` en `BootScene.js`.
  2. Se cargó directamente la imagen nativa `assets/cafeteteria_base.png` asociándola a la clave `'drink_machine'`.
  3. En `GameScene.js`, se ajustó el tamaño visual `setDisplaySize(160, 160)` para encajar de forma nítida y perfectamente alineada sobre el mostrador, preservando la interactividad de botones y tazas.
* **Lección**: Al reemplazar gráficos procedimentales por ilustraciones artísticas en PNG, desacopla las capas de UI (botones y contadores) asignando profundidades de renderizado superiores (`setDepth`), permitiendo actualizar el arte base sin afectar la lógica de programación.

### 3.3. Integración de los Assets de Botones de Bebidas (`boton_cafe.png` y `boton_leche.png`)
* **Síntoma**: Se añadieron los diseños originales de los botones rectangulares de café (`public/assets/boton_cafe.png`) y leche (`public/assets/boton_leche.png`), los cuales incluyen etiquetas superiores ("CAFE" / "LECHE") y un recuadro inferior gris claro diseñado para alojar los contadores digitales de insumos.
* **Solución**:
  1. Se cargaron las texturas `btn_coffee_asset` y `btn_milk_asset` en `BootScene.js`.
  2. En `GameScene.js`, se renderizaron los botones a dimensiones `44 x 36` px en las posiciones `beansX = startX - 34` y `milkX = startX + 18`.
  3. Se colocaron las cifras numéricas de stock (`this.beansStockText` y `this.milkStockText`) centradas dentro de sus recuadros grises inferiores (`btnY + 6`).
  4. Se asociaron animaciones de escalado suave en hover (1.1x) y rebote sutil al presionar (tap bounce), sincronizadas entre las imágenes de los botones y los números del contador.
  5. Se eliminó el botón verde flotante "SERVIR" (`drinkServeBtnBg` y `drinkServeZone`) ya que quedó obsoleto con la integración del arrastre directo (`drag & drop`) de la taza servida hacia la Bandeja de Entrega.
* **Lección**: Al integrar elementos visuales con contenedores de texto nativos dibujados por el usuario, utiliza offsets exactos de Y e integra los `targets` de las animaciones en arreglos de Phaser (`targets: [image, text]`) para garantizar una interactividad limpia y coordinada.

### 3.1. El Efecto "Guante de Boxeo" del Cursor
* **Síntoma**: La pata de gato se veía gigante en comparación con el mostrador y parecía un guante de boxeo colgado de un brazo de Phaser muy delgado.
* **Causa Raíz**: Las texturas generadas por la IA eran de $256 \times 256$ píxeles y se renderizaban a escala `1.0`, mientras que el brazo vectorial dinámico dibujado por Phaser tenía un grosor de solo `42px`.
* **Solución**: Se redimensionó la visualización del sprite en `GameScene.js` a `96 x 96` píxeles. A esta escala, la muñeca de la pata mide exactamente `42px` en pantalla, logrando una unión visual perfecta.
* **Lección**: Diseña los assets con una resolución mayor para conservar calidad, pero define siempre una escala de renderizado que guarde relación directa con los grosores de los elementos vectoriales que se conectan a ellos.

### 3.2. La Banda Marrón Horizontal en el Agarre (Pata Cerrada)
* **Síntoma**: Al hacer click, aparecía una línea marrón gruesa horizontal en la muñeca cortando la fluidez del brazo.
* **Causa Raíz**: En la imagen del grid de la IA, la pata cerrada tenía un contorno horizontal marrón cerrado en la muñeca. Nuestro script original de estiramiento copió esa última fila hacia arriba, duplicando la línea marrón y creando una banda ancha sólida.
* **Solución**: Se modificó el procesamiento en `process-paws.js` para recortar el cuadrante exacto de la pata antes de procesarla, asegurando que el corte del antebrazo se hiciera en la zona interna de relleno de pelaje crema, eliminando el contorno marrón horizontal.
* **Lección**: Para piezas de extremidades que deben unirse a gráficos procedurales, el extremo de la textura **debe ser abierto** (sin línea de contorno en la base de la muñeca/brazo) para permitir un flujo visual continuo.

### 3.3. Deformación Diagonal y Torsión de la Pata (Warping)
* **Síntoma**: Al recortar el cuadrante de la pata, esta aparecía estirada de lado y muy delgada.
* **Causa Raíz**: Las patas no estaban en el centro del cuadrante de la grilla de la IA; estaban desplazadas a la derecha. Nuestro script intentaba forzar a que la muñeca de la pata se centrara en `x = 128` mediante un cálculo de deformación gradual (tapering), provocando que el brazo se dibujara en diagonal.
* **Solución**: Se implementó un algoritmo en `process-paws.js` que detecta la caja delimitadora real de la pata en el cuadrante, la extrae, y la centra horizontalmente de forma perfecta en un lienzo cuadrado limpio de $440 \times 440$ píxeles antes de aplicarle el tapering y el resize final.
* **Lección**: Nunca intentes centrar un objeto descentrado estirando sus coordenadas en base a interpolaciones. Primero recorta la caja delimitadora del objeto real, céntrala físicamente en un lienzo nuevo, y luego aplica las transformaciones.

### 3.4. Inconsistencia de Colores en la Extremidad
* **Síntoma**: El brazo dinámico de Phaser y la pata de gato tenían tonos crema y marrón ligeramente diferentes.
* **Causa Raíz**: Se estaban utilizando colores aproximados de la paleta general del juego (`0xf5ebe0` y `0x4e3629`). Al analizar los píxeles reales del sprite, se descubrió que el color de pelaje exacto es `#f4f1ce` y el marrón del contorno es `#472918`.
* **Solución**: Se actualizaron las constantes del brazo dinámico en `GameScene.js` para usar los códigos hexadecimales exactos extraídos de la textura.
* **Lección**: Extrae siempre los colores muestreando los píxeles reales de las texturas importadas para que los gráficos generados por código tengan coherencia cromática absoluta.

### 3.5. Unión de la Pata y el Brazo Procedural (Técnica de Sandwich de Capas y Acortamiento Fijo)
* **Síntoma**: La pata abierta y el brazo procedural presentaban un corte horizontal brusco en la muñeca ("notch" o "repisa") al unirse, haciéndose notar la terminación plana de la textura 2D. Además, al mover la pata hacia arriba en la pantalla, esta se desprendía del brazo.
* **Causa Raíz**:
  1. La pata y el brazo compartían la misma capa de profundidad, dejando visible el borde inferior plano de la pata.
  2. El acortamiento del brazo se calculaba mediante un porcentaje estático (12%). A mayor distancia del cursor (pata arriba), el 12% representaba un espacio mayor en píxeles, provocando la separación.
* **Solución**:
  1. *Sandwich de Capas*: Se dividió el dibujo del brazo en dos. El contorno del brazo se asignó a `setDepth(9998)` (detrás de la pata) y el relleno crema del brazo se asignó a `setDepth(10000)` (por encima de la pata a `depth 9999`). De este modo, el relleno crema cubre el corte del final de la muñeca fusionándose de forma invisible con el pelaje del mismo color, mientras que el contorno marrón queda oculto por detrás.
  2. *Acortamiento por Píxeles Fijos*: Se cambió el cálculo para que el trazo del brazo termine siempre exactamente **25 píxeles** antes de llegar al cursor (usando `tMax` dinámico en base al largo total de la curva Bezier).
* **Lección**: Para transiciones impecables entre assets de rasterizado (imágenes) y vectores dibujados por código, combina el ordenamiento fino de capas (sandwiching) con offsets en píxeles fijos para evitar deformaciones dependientes de la escala o la distancia.
