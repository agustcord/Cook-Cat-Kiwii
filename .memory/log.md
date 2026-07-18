# Bitácora de Cambios (Log)

## [2026-07-18] feat | Integrada nueva ilustración para la base de la cafetera
- Se reemplazó el cuerpo procedural de la máquina de café por la nueva ilustración `public/assets/cafeteteria_base.png`.
- Se eliminaron los bloques de dibujo vector de `drink_machine` en `BootScene.js` y se configuró la escala de `160x160` px sobre el mostrador.
- Se mantuvieron los botones de insumos (café, leche), contadores de stock, zonas de click e indicadores encima de la nueva cafetera.
- Se integró la nueva ilustración del botón rectangular de café `public/assets/boton_cafe.png`.
- Se posicionó la cifra de stock dentro del recuadro gris claro inferior del botón y se vincularon animaciones de rebote (bounce tween) e interacción hover.
- Se actualizó [[guia_resolucion_problemas|Guía de Resolución de Problemas]] con la sección 3.3.


## [2026-07-17] feat | Música de fondo y panel de control de volumen
- Se cargó e integró en loop la canción de fondo `Kiwi's Simple Bakehouse Loop.mp3` provista por el usuario, configurando el volumen inicial por defecto al 15% (`0.15`).
- Se agregó el botón de Nota Musical (`🎵`) y se habilitó como elemento editable en el Modo Editor de UI (`musicButton`) con persistencia en `ui-config.json` para facilitar su libre reubicación.
- Se desarrolló el modal `openAudioPanel()`. Al abrirse, congela la pata de gato, la oculta y activa el cursor de ratón nativo del sistema para facilitar el control de audio sin conflictos de garras. El ajuste de volumen ahora se realiza con precisión de 5% en 5% (`0.05` de incremento/decremento).
- Se implementó la prevención de rasguños accidentales al cerrar el panel (`scratchBlockedUntilPointerUp`), requiriendo que el jugador levante el click de la "X" antes de volver a activar rasguños sobre los clientes.
- Se implementó la persistencia de las preferencias de audio del jugador utilizando `localStorage`.
- Se actualizó [[guia_resolucion_problemas|Guía de Resolución de Problemas]] con la sección 1.6 de la música de fondo.

## [2026-07-17] feat | Implementada mecánica de rasguñar clientes (garras fuera)
- Se añadió la interacción de rasguño: al mover la pata cerrada (isDown) y vacía sobre el cliente activo, este grita de dolor, se sacude y huye enojado.
- Se implementaron efectos visuales de líneas rojas de garras, diálogos aleatorios de queja y animación shake con huida rápida.
- Se corrigió un bug que causaba rasguños involuntarios al arrastrar la bandeja de entrega (`deliveryDragZone`), integrando el flag `isHoldingItem` en sus eventos de arrastre.
- Se actualizó [[guia_resolucion_problemas|Guía de Resolución de Problemas]] con la sección 1.5 detallando el diseño técnico de los rasguños.

## [2026-07-17] feat | Taza arrastrable y física en la cafetera
- Se rediseñó el flujo para que la taza vacía sea arrastrable (drag and drop) desde el techo hasta la boquilla, con retorno automático mediante tween si se suelta lejos.
- Se implementó `makeCupDraggable()` para permitir que la taza de bebida preparada sea arrastrada desde la cafetera a la Bandeja de Entrega.
- Se actualizó [[guia_resolucion_problemas|Guía de Resolución de Problemas]] detallando el diseño técnico de las tazas arrastrables.

## [2026-07-17] fix | Corregido bug de desaparición de galletas crudas en la bandeja
- Se actualizó [[guia_resolucion_problemas|Guía de Resolución de Problemas]] con la sección 1.3 detallando la solución al bug que vaciaba prepTrayCookies al sacar galletas del horno.

## [2026-07-16] fix | Solución de corte y desalineación de la pata del gato
- Se actualizó [[guia_resolucion_problemas|Guía de Resolución de Problemas]] con la sección 3.5 sobre la técnica de sandwich de capas y acortamiento por píxeles fijos del brazo procedural.

## [2026-07-16] update | Agregada nota de inspiración de música
- Se creó la nota [[inspiracion_musica|Inspiración de Música]] guardando el enlace de YouTube Music de referencia para el juego.
- Se actualizó el [[index|Catálogo de Notas]].

## [2026-07-16] update | Agregada Guía de Resolución de Problemas (Post-Mortem)
- Se creó la nota [[guia_resolucion_problemas|Guía de Resolución de Problemas]] detallando causas y soluciones para bugs de lógica de masa, Vite ES modules, efecto guante y distorsión diagonal en los assets de patas de gato.
- Se actualizó el [[index|Catálogo de Notas]].

## [2026-07-16] init | Inicialización de la memoria de diseño del proyecto.
- Se crearon notas de wiki para [[historia|Historia y Lore]], [[biblia_arte|Biblia de Arte]], [[hoja_ruta|Hoja de Ruta (Roadmap)]] y [[configuracion_ui|Configuración de la Interfaz (UI)]].
- Se actualizó el [[index|Catálogo de Notas]].

