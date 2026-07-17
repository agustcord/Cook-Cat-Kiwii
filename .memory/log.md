# Bitácora de Cambios (Log)

## [2026-07-17] feat | Implementada mecánica de taza vacía obligatoria en la cafetera
- Se implementó la pila de tazas y la obligatoriedad de colocar tazas vacías antes de preparar café o leche.
- Se eliminaron las etiquetas de texto de CAFETERÍA y TAZAS, y se reubicó la pila de tazas vacías apoyándola físicamente en el techo de la cafetera (Y = startY - 68).
- Se habilitó la pila de tazas como elemento editable en el Modo Editor de UI (`cupStack`) con persistencia en `ui-config.json` para facilitar su ajuste y reubicación.
- Se corrigió `saveUIConfig()` para que clone `UI_CONFIG` inicialmente y no se pierdan propiedades estáticas de etiquetas al exportar el JSON.
- Se unificó la coordenada Y inicial de la pila de tazas a 202 en `ui-config.json` para evitar que aparezca flotando al iniciar el juego.
- Se actualizó [[guia_resolucion_problemas|Guía de Resolución de Problemas]] con la sección 1.4 detallando el diseño técnico de la estación de bebidas.

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

