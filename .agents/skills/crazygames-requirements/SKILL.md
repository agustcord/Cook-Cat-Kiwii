---
name: crazygames-requirements
description: Reglas de diseño, requisitos técnicos obligatorios y checklist de calidad para publicar en CrazyGames. Usar siempre que se trabaje en arquitectura del juego, tamaño de build, onboarding, mecánicas de UI/UX, exportación, o antes de dar por terminada cualquier feature del juego "Kiwi Bakery".
---

# KIWI BAKERY — Juego de gatos Kiwi panaderos para CrazyGames

## Concepto
Un gato Kiwi atiende una tienda/panadería donde clientes humanos entran a pedir
galletas y masitas. El jugador usa un "menú de recetas" para combinar
ingredientes, forma y decoración, y entregar exactamente lo que el cliente pidió.

## Core loop
1. Llega un cliente con un ícono/burbuja de pensamiento mostrando qué quiere
   (sin texto, solo visual: forma + color + topping).
2. El jugador usa las estaciones del menú de recetas del gato.
3. Arma la galleta combinando pasos rápidos (arrastrar, tocar, mezclar).
4. Timer visual (barra de paciencia del cliente, animada).
5. Entrega → feedback inmediato (perfecto = confetti, parcial = reacción tibia,
   mal = cliente se va, sin ser un fracaso duro).
6. Progresión: monedas → desbloqueo de recetas, decoraciones, estaciones y
   clientes más exigentes.

## Estaciones base
- Masa (clásica, chocolate, avena) — 1 tap.
- Forma (cortadores: estrella, corazón, gato, hueso) — drag simple.
- Horno (mini-juego de timing, barra de progreso con zona verde).
- Decoración (glaseado, chispas, frutas) — drag & drop.
- Entrega (comparación visual + animación de reacción).

## Dirección de arte
- Cartoon 2D, colores pastel/cálidos, ESTILO CONSISTENTE en toda la app
  (nunca mezclar realista con cartoon, ni distintas resoluciones).
- Gato Kiwi muy expresivo (orejas, cola, bigotes reactivos).
- UI minimalista, iconos grandes, legible en mobile.
- Mínimo texto — todo comunicado con iconos y expresiones.

## REQUISITOS TÉCNICOS OBLIGATORIOS DE CRAZYGAMES (no negociables)
- Descarga inicial ≤ 20MB ideal (nunca superar 50MB). Build total ≤ 250MB, ≤1500 archivos.
- El jugador debe llegar al gameplay real en máximo 1 click.
- Onboarding DENTRO del gameplay, sin pantallas de texto explicando reglas.
- Soporte mouse + touch desde el diseño de cada mecánica (drag & drop debe
  funcionar con touch).
- Sin botón de fullscreen propio (lo maneja la plataforma).
- Sin links a tiendas de apps ni cross-promoción dentro del juego.
- CSS `user-select: none` in the body (evita menús contextuales en mobile).
- Debe rendir bien en dispositivos de 4GB RAM (Chromebooks) — cuidado con
  partículas/efectos pesados.
- Nombre del juego original, no genérico.
- Dejar preparado el punto de integración del CrazyGames SDK (se agrega
  cuando se pase de Basic Launch a Full Launch), sin acoplar la lógica del
  juego a ese SDK desde el día 1.

## PRINCIPIOS DE CALIDAD (checklist antes de dar por cerrada una feature)
- ¿La acción del jugador tiene feedback visual/sonoro inmediato?
- ¿Se entiende sin necesidad de leer texto?
- ¿El estilo visual es consistente con el resto del juego?
- ¿Funciona igual de bien con mouse que con touch?
- ¿La dificultad se agrega de a un elemento nuevo por vez, sin saltos abruptos?
- ¿Esto se probó primero como placeholder antes de invertir en arte final?

## Stack
- Motor: Phaser 3 (JS/TS). Alternativa low-code: Construct 3.
- Assets en spritesheet optimizados, audio comprimido (ogg/mp3 liviano).

## Orden de trabajo sugerido
1. Nombre original del juego (validar que no sea genérico).
2. Diagrama del core loop (estados: idle → pedido → armado → entrega → resultado).
3. Lista de recetas del MVP (máx. 8-10 combinaciones).
4. Esquema de progresión (clientes por "día", desbloqueo de estaciones).
5. Estructura de carpetas del proyecto en Phaser, con placeholders geométricos.
6. Core loop jugable en placeholder — validar que se sient divertido ANTES de
   pulir arte.
7. Validar contra el checklist de requisitos técnicos antes de cada entrega.
8. Recién ahí: arte final + integración del SDK de CrazyGames.
