---
schemaVersion: 1
scope: workspace
updatedAt: "2026-09-16T23:11:54.219Z"
workspaceName: "Cook Gatos Kiwii"
---

# Project Memory

## Project Overview
- Workspace del videojuego **Kiwipaw Bakehouse** (Cook Gatos Kiwii): juego cozy de cocina/pastelería con gatos, hecho en Phaser.
- Objetivo: rediseñar **conceptualmente** la pantalla de Balance de Fin de Día y el Menú de Tienda, en carpeta aislada, sin tocar el código del juego base.
- Entregable tipo prototipo de UI/UX: el usuario lo implementará luego en el motor.

## Current State
- Prototipo verificado: `preview ok: 284 nodes, 0 console errors, 0 asset errors` sobre `cozy-cat-bakery-redesign/App.jsx`.
- Resuelto el "no se carga": el problema nunca fue `App.jsx`, sino que un `.jsx` suelto no es una página web, y el `index.html` raíz es la entrada de Vite del juego real (`/src/main.js`, `#game-container`), no tiene `#root` y por eso la vista previa salía en blanco. Ese archivo quedó intacto.
- Ya existe entrada propia y autónoma en `cozy-cat-bakery-redesign/index.html` (React + Babel desde cdnjs, versiones fijas) con respaldo para `file://`.
- En el sandbox del visor el CDN externo se bloquea (`ERR_BLOCKED_BY_CLIENT`); es limitación del entorno, no un error del prototipo.
- Feedback de diseño del usuario sobre el prototipo: **pendiente**.

## Artifacts
- `cozy-cat-bakery-redesign/App.jsx` — prototipo interactivo (Balance + Tienda), ~1528 líneas, con bloque EDITMODE (moneda, redondez, papel, madera) y datos auténticos del juego. **Ruta de vista previa que funciona sin internet.**
- `cozy-cat-bakery-redesign/index.html` — entrada propia que monta el prototipo; detecta restricción `file://` y ofrece elegir `App.jsx` una vez.
- `cozy-cat-bakery-redesign/COMO-VERLO.md` — tres vías para abrirlo, explicación del bloqueo y tabla de qué mirar en cada pantalla.
- `index.html` (raíz) — entrada Vite del juego real; **no tocar**.
- `cozy-cat-bakery-redesign/README.md` — notas de uso y alcance.
- `DESIGN.md` (raíz) — diagnóstico, tokens y guía de handoff/integración a motor; único artefacto autoritativo del sistema de diseño.
- `references/image.png`, `references/image-2.png` — referencias visuales aportadas.
- Fuentes del juego solo como lectura: `src/scenes/ShopScene.js`, `src/game/EconomyManager.js`, `src/game/SummaryLayout.js`, `src/locales/es.js`, Art Bible e historia.

## Design Direction
- Estética *cozy cat bakery*: pasteles desaturados cálidos (crema, tostado, fresa, menta, marrón cálido oscuro como tinta), radios *squircle* y tarjeta con orejas de gato.
- Balance como **ticket de panadería** troquelado con cinta adhesiva, sello animado, banner de estrellas, Kiwi con bocadillo reactivo y estado de la despensa; jerarquía clara entre ventas, gastos y saldo neto.
- Tienda como **"El Almacén de Don Bigotes"**: toldo a rayas, tendero gatuno con diálogos dinámicos, riel de categorías, tarjetas con stock real, panel inspector con *perks* y cesta del día que bloquea «Empezar Día 4» hasta que haya masa.
- Micro-interacciones: sonidos sintetizados con Web Audio API (click de madera, tintineo de monedas), botón de silencio, atajos de teclado. Marco 4:3 del juego con apoyo de modo móvil.

## User Feedback
- Rechazo al balance de fin de jornada actual: frío, pobre, sin pulido.
- Rechazo al menú de tienda actual: plano, simple, sin vida.
- Requisitos expresos: investigar el juego antes de diseñar, rediseñar (no implementar) y dejarlo en carpeta separada.
- Preferencia por acabado emocional, cálido y pulido acorde al género cozy.
- Reportó que no lograba cargar/ver `App.jsx`; necesitaba una forma clara de abrirlo.

## Decisions
- No modificar el código fuente principal; encapsular la propuesta en `cozy-cat-bakery-redesign/`.
- Alcance limitado a dos pantallas: Balance de Fin de Día y Tienda.
- Usar datos reales del juego (alquiler 20, cuota 35, meta 150 del Día 3, préstamo 200, precios del catálogo, strings ES) en lugar de copy inventado.
- Consumir hooks de React desde el objeto `React`; evitar `@import` de fuentes externas y no crear `AudioContext` antes del primer gesto.
- `DESIGN.md` es el único artefacto autoritativo del sistema de diseño; los tokens no se duplican aquí.
- La vista previa canónica del prototipo es `cozy-cat-bakery-redesign/App.jsx`; el HTML nuevo es alternativa para navegador (servir con `npx serve` o doble clic).

## Open Questions
- ¿Motor destino para assets y atlas de UI: **Godot o Unity**?
- ¿Se ajustan animaciones, densidad o contenido interactivo tras probar el prototipo?
- ¿El prototipo crece a más pantallas o se queda en las dos actuales?
- ¿El usuario pudo abrir el prototipo fuera del sandbox y ve el arranque del CDN sin bloqueos?

## Next Steps
- Confirmar que el usuario logra ver ambas pantallas y recoger impresiones de diseño.
- Iterar detalles visuales, densidad y ritmo de animaciones según feedback.
- Definir motor destino y preparar la guía de exportación de assets y atlas de UI.
- Mantener `DESIGN.md` validando limpio en cada cambio de tokens.

## Promotion Candidates For DESIGN.md
- Paleta oficial cozy de pastelería derivada del Art Bible, con el marrón cálido oscuro como tinta principal.
- Tipografía redondeada tipo Outfit/Fredoka como base de la UI del juego.
- Radios *squircle* y silueta de tarjeta con orejas de gato como firma visual.
- Patrón de "desglose tipo ticket" para resúmenes numéricos y jerarquía de micro-recompensas al cerrar jornada.
- Pestañas por categoría con panel inspector lateral en pantallas de compra, y cesta del día como puerta de avance.
- Regla de contorno cálido (borde color línea/marrón) como separador estándar de superficies.

## Recent History
- **2026-09-16** — Reinicio desde cero; inspección del repo Phaser real (564 archivos) y lectura de Art Bible, historia, `EconomyManager`, `SummaryLayout`, `ShopScene` y locales ES.
- **2026-09-16** — Creación de `cozy-cat-bakery-redesign/App.jsx` (Balance + Tienda); resolución de errores de JSX, audio y fuentes hasta preview limpio.
- **2026-09-16** — Pulido de modo móvil, micro-recompensas de compra, `DESIGN.md` y `README.md`; corrección del frontmatter al esquema estricto (regla de contorno al cuerpo).
- **2026-09-16** — Verificación limpia: 284 nodos, 0 errores de consola y de assets.
- **2026-09-16** — Diagnóstico del "no se carga": `index.html` raíz es entrada de Vite sin `#root`; creada entrada propia `cozy-cat-bakery-redesign/index.html` con arranque robusto y respaldo `file://`; documentado en `COMO-VERLO.md`. El único error restante es el CDN bloqueado por el sandbox.