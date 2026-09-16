---
version: alpha
name: Kiwipaw Bakehouse — Rediseño de UI
colors:
  outline: "#582f0e"
  ink: "#42270f"
  inkSoft: "#8c5847"
  brown: "#7f5539"
  brownDeep: "#654024"
  wall: "#ffe5d9"
  surface: "#fff1e6"
  paper: "#fffdf9"
  line: "#ddb892"
  tan: "#eddcd2"
  coin: "#e0a341"
  coinDeep: "#b8791e"
  rose: "#ffccd5"
  mint: "#d8f3dc"
  mintDeep: "#5f9e76"
  lavender: "#d6c7ff"
  alert: "#c9584f"
  ok: "#4f9d6a"
typography:
  display:
    fontFamily: "Outfit"
    fontSize: "28px"
    fontWeight: 800
    lineHeight: 1.1
  body:
    fontFamily: "Outfit"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.4
  numeric:
    fontFamily: "Outfit"
    fontSize: "31px"
    fontWeight: 800
    lineHeight: 1
rounded:
  base: "18px"
  small: "10px"
  large: "24px"
  pill: "999px"
spacing:
  unit: "12.8px"
  gutter: "17px"
  cardPadding: "19px"
  screenPadding: "26px"
components:
  button-primary:
    backgroundColor: "#7f5539"
    textColor: "#fff6e9"
    rounded: "10px"
    padding: "11px"
  button-mint:
    backgroundColor: "#5f9e76"
    textColor: "#fff6e9"
    rounded: "10px"
    padding: "11px"
  chip:
    backgroundColor: "#fff1e6"
    textColor: "#7f5539"
    rounded: "999px"
    padding: "5px"
  card:
    backgroundColor: "#fff1e6"
    textColor: "#42270f"
    rounded: "24px"
    padding: "19px"
  ticket:
    backgroundColor: "#fffdf9"
    textColor: "#42270f"
    rounded: "13px"
    padding: "24px"
  coin-pill:
    backgroundColor: "#f6dfb6"
    textColor: "#7a4a12"
    rounded: "999px"
    padding: "6px"
  item-card:
    backgroundColor: "#fffaf3"
    textColor: "#654024"
    rounded: "18px"
    padding: "11px"
  action-bar:
    backgroundColor: "#fffaf3"
    textColor: "#7f5539"
    rounded: "18px"
    padding: "13px"
---

## Overview

Rediseño **conceptual** de dos pantallas del juego cozy de pastelería y gatos *Kiwipaw Bakehouse*: el **cierre de jornada** (balance) y el **menú de tienda**. Todo el trabajo vive aislado en `cozy-cat-bakery-redesign/` y **no modifica ningún archivo del juego**: el prototipo es un `App.jsx` autónomo que corre en un marco 4:3 (misma relación que el lienzo real de Phaser) para que las decisiones de composición sean transferibles.

### Regla de contorno

Todos los componentes del sistema comparten un contorno de 2 px en `colors.outline` (`#582f0e`), nunca negro puro: es el trazo del Art Bible y lo que agrupa las tarjetas entre sí sobre la pared durazno. El grosor vive en los estilos de cada componente y no en el token, para poder engrosarlo a 3 px en el estado *pressed* sin duplicar entradas de color.

### Diagnóstico: por qué las pantallas actuales se sienten frías

Revisando `src/scenes/SummaryScene.js`, `src/scenes/ShopScene.js`, `src/game/SummaryLayout.js` y `src/style.css`:

1. **El balance es un libro contable, no un momento.** Cuatro filas tipográficas alineadas a la izquierda sobre tarjetas de 1 px de borde, títulos en `Outfit` suelto y una línea de "Insolvencia" en texto plano. No hay jerarquía entre *ventas*, *gastos* y *resultado*: los tres pesan igual, así que nada celebra y nada alarma.
2. **Nada tiene dueño emocional.** Kiwi no aparece. El género cozy se sostiene con un personaje que reacciona a lo que hiciste; sin él, el cierre del día es un formulario.
3. **El cierre no empuja al siguiente paso.** "Continuar" es un botón plano que compite con "Ganar", "Tienda" y "Menú" en la misma fila: el jugador no ve la cadena *cerrar → reponer → abrir*.
4. **La tienda es un catálogo sin mundo.** Tres columnas de tarjetas de 435×156 px idénticas, dos pestañas ("Suministros" / "Decoración"), iconos de 56 px sobre círculos blancos y un botón que repite el emoji 🪙. Sin toldo, sin tendero, sin respuesta táctil, sin contador de stock del artículo.
5. **Los estados límite se explican con texto, no con forma.** La masa agotada, la caja vacía y la quiebra aparecen como cadenas de aviso al final del flujo, cuando ya es tarde para decidir.
6. **Detalles que rompen la ficción:** fondo blanco `#ffffff` detrás del lienzo, emoji como iconos de moneda y café, y texto de sistema mezclado con los degradados cálidos.

### Dirección elegida

**Mundo único de panadería cálida.** Un mismo escenario para las dos pantallas — pared durazno con tablones, mostrador de madera, toldo a rayas en la tienda — de modo que el jugador sienta que se mueve dentro del local y no entre menús. La paleta sale de la biblia de arte real del proyecto (`art-bible.md`): crema, tostado, fresa, menta y lavanda sobre contornos marrón café, nunca negro.

Cada pantalla tiene **una cifra protagonista**: en el balance, el saldo neto restante dentro del ticket; en la tienda, las monedas disponibles en la píldora del encabezado. Todo lo demás se ordena en torno a ella.

### Pantalla 1 — Cierre de jornada

- **Rótulo colgante** con orejas de gato: "DÍA 3 COMPLETADO" y el sello de cierre.
- **Banner de desempeño:** tres estrellas que entran escalonadas, título del resultado ("¡Récord de ventas!"), barra de meta con marcador, clientes felices, clientes perdidos y el más vendido del día.
- **Ticket de cierre** (nuevo patrón central): muescas troqueladas arriba y abajo, cinta adhesiva en las esquinas, mancha de café, filas con línea de puntos conductora y jerarquía real — ventas y saldo previo en primer plano, gastos atenuados en rojo, total deducido en bloque dorado y **saldo neto restante** con cifra grande y contador animado.
- **Columna derecha:** Kiwi con bocadillo que cambia de tono según el resultado, estado de la despensa con cinco puntos de masa por tipo, y préstamo del banco con barra y marcador de huella.
- **Barra de acción:** resumen de preparación a la izquierda ("Todo en orden: 4 u. de masa y 185 monedas para reponer") y las acciones a la derecha: *Reintentar el día* (fantasma) e *Ir a la tienda* (menta). En insolvencia, el primario pasa a *Declarar quiebra* en rojo.

**Estados cubiertos** (revisables con los botones del prototipo): `3★ Récord`, `1★ Ajustado`, `Deuda` (insolvencia financiera) y `Sin masa` (desabastecimiento). El estado de insolvencia no solo cambia el color: el rótulo pasa a "Cierre con números en rojo", el neto se muestra en negativo sobre fondo de alerta, el sello dice CERRADO en ámbar y desaparece la puerta a la tienda porque no hay dinero para reponer.

### Pantalla 2 — Tienda

- **Toldo a rayas** con fleco de semicírculos alineados a las rayas + rótulo "TIENDA KIWI BAKERY" y píldora de monedas disponibles que pulsa al gastar.
- **Riel de categorías** en lugar de dos pestañas: Moldes, Masas, Toppings, Bebidas y Decoración, cada uno con su función explicada ("Base de la galleta", "Glaseado y chispas") y contador de desbloqueados.
- **Tarjetas de artículo** con viñeta ilustrada por categoría, nombre, para qué sirve dentro del juego, etiqueta de unidad (*Permanente* / *Pack ×5*), stock que ya se tiene ("Tienes 4 u.") y botón de precio con estado: disponible, sin monedas, *Listo* (ya en el local) o *Próximamente* con candado.
- **Cesta del día:** lo comprado, total gastado, masa disponible para mañana con medidor, y el aviso del juego real reescrito como decisión: "Sin masa no podemos abrir. Compra al menos 1 pack de Masa Clásica."
- **Mostrador con el tendero:** Kiwi de delantal menta con bocadillo que reacciona a cada compra (faltan monedas, molde nuevo, masa en la cesta) y la acción *Empezar Día 4*, deshabilitada hasta que haya masa.

### Sistema de movimiento y recompensa

Entrada del ticket con ligera rotación, estrellas con rebote escalonado, sello que choca contra el papel, contadores de monedas con easing cúbico, píldora que pulsa al gastar y `+5 u.` flotante al añadir stock. Todo se anula bajo `prefers-reduced-motion`. El sonido es sintetizado con Web Audio (moneda, sello, negación) y arranca solo tras el primer gesto del usuario, con interruptor visible.

### Accesibilidad

Contornos de foco dorados de 3 px con separación, objetivos táctiles de 36 px o más, botones reales en lugar de capas clicables, `aria-pressed` en conmutadores, `aria-label` en el icono de compra indicando el precio, `aria-live` para las notificaciones y el saldo, `role="img"` con etiqueta en la fila de estrellas, y contraste de texto marrón sobre crema por encima de 7:1.

### Modo compacto de revisión

Bajo 900 px el lienzo 4:3 se desarma en una columna legible a pantalla completa con tipografía escalada a píxeles, riel de categorías horizontal y captura de compras apilada. El juego real mantiene 4:3 horizontal (`OrientationManager`); esta variante existe solo para revisar la propuesta en móvil.

### Integración (mapa de transferencia a Phaser)

- `SummaryScene` / `SummaryLayout`: sustituir el bloque de filas por el ticket (muescas con máscara o textura de 9 slices), mover el resultado a un banner con estrellas y añadir el hueco del personaje a la derecha.
- `ShopScene`: cambiar la rejilla de 2 pestañas por riel + rejilla, y añadir stock visible por artículo y panel de cesta con el medidor de masa.
- Reutilizar las claves de `src/locales/es.js` y `en.js`; las nuevas cadenas necesarias son: `summary.ticket.title`, `summary.ticket.rows.rent|utilities|loan`, `summary.ticket.net`, `summary.stars.record|good|tight|insolvent`, `shop.rail.mold|dough|topping|drink|decor`, `shop.stock.owned`, `shop.basket.title|total|doughReady`, `shop.cta.nextDay`.
- Assets a producir como SVG/atlás: rótulo con orejas, toldo + fleco, ticket troquelado, sello (2 variantes), moneda-huella, iconos de artículo (molde corazón/gato/pez, masa, chispas, chips, glaseado, granos, leche, ventana, banderines, luces), Kiwi chef y Kiwi tendero.
- Valores editables en el prototipo (`EDITMODE`): `coin`, `roundness`, `paper`, `counterWood`, `grainStrength`.

## Tipografía y escala

El objetivo del sistema es la tipografía que el juego ya usa: **Outfit 600/800**, con todo el protagonismo en los números. El prototipo no puede cargar webfonts en la vista previa, así que cae en una pila de caras redondeadas del sistema (`SF Pro Rounded`, `Segoe UI Rounded`, `Trebuchet MS`); la propuesta de mejora es **Baloo 2** para rótulos y cifras si se quiere reforzar el tono kawaii, o mantener Outfit para no tocar la identidad existente.

Escala interna del lienzo 4:3, expresada en `--u: 1cqw` sobre un ancho de referencia de 1280 px (1u ≈ 12,8 px):

| Uso | Tamaño |
| --- | --- |
| Rótulo colgante | 3,1u |
| Cifra protagonista (saldo neto) | 3,1u |
| Total del ticket | 2,4u |
| Título de sección | 2,15u |
| Nombre de artículo | 1,5u |
| Botón | 1,42u |
| Fila de ticket | 1,28u |
| Descripción / nota | 1,08–1,14u |

Todas las columnas de dinero y unidades usan `tabular-nums` para que los contadores animados no bailen. Las cifras se leen en español (`+185`, `−75`), sin decimales, y los números grandes se reservan para una sola cifra por pantalla.
