# ROADMAP MACRO — "Kiwi Bakery" (CrazyGames)

Este documento es el mapa general del proyecto. Cada etapa se cierra con un "Definition of Done" antes de pasar a la siguiente — no se avanza en paralelo. Dentro de cada etapa, el trabajo con Antigravity se pide de a una tarea chica por vez, con tu revisión en el medio (nunca tandas grandes).

Estado actual: ya se atravesó parcialmente la Etapa 0 y 2 (skill y MCP configurados, primer intento de core loop con problemas de consistencia visual). Se retoma desde ahí, sin borrar el proyecto.

---

## ETAPA 0 — Fundamentos del proyecto
**Objetivo:** que el entorno sea sólido y reversible antes de seguir generando nada.

- [ ] Confirmar que el repo tiene Git inicializado, con commits separados por etapa/feature de acá en adelante.
- [ ] Confirmar que el skill `crazygames-requirements` y los MCP (`context7`, `sequential-thinking`, `game-asset-gen`) siguen activos.
- [ ] Mover todo el arte generado hasta ahora a `assets/_deprecated/` (no borrar).
- [ ] Confirmar nombre definitivo del juego (o dejarlo como "working title" si todavía no se decide).

**Definition of Done:** repo versionado, entorno confirmado, arte viejo fuera del camino pero conservado.

---

## ETAPA 1 — Art Bible (identidad visual)
**Objetivo:** una única referencia visual aprobada que gobierne todo el arte del juego de acá en adelante. Esta etapa es la causa raíz del problema de calidad visual — no se avanza a arte final de ningún otro asset hasta cerrarla.

- [ ] Generar el gato Kiwi protagonista en su pose/expresión definitiva (1 imagen, no varias opciones a la vez).
- [ ] Iterar sobre ESA misma imagen hasta aprobarla (paleta, grosor de línea, nivel de detalle, proporciones).
- [ ] Documentar las reglas visuales derivadas de esa imagen aprobada (paleta de colores en hex, estilo de sombreado, tamaño de canvas/sprite) en un archivo `art-bible.md` dentro del proyecto.
- [ ] Generar 1 cliente humano de prueba usando la imagen del gato como referencia, para confirmar que el estilo se mantiene entre personajes distintos.

**Definition of Done:** `art-bible.md` aprobado + 2 personajes (gato + 1 cliente) consistentes entre sí, aprobados por vos.

---

## ETAPA 2 — Core loop jugable (lógica, placeholders)
**Objetivo:** que el core loop completo funcione de punta a punta, aunque sea con formas geométricas — separado a propósito del arte para no mezclar bugs de lógica con problemas visuales.

- [ ] Estado "llega cliente" con pedido visible (placeholder).
- [ ] Estación de forma (drag & drop) funcionando con mouse y touch.
- [ ] Timer de paciencia del cliente funcionando y visible.
- [ ] Comparación pedido-vs-entrega y resultado (éxito/parcial/fallo).
- [ ] Verificación en el browser agent de Antigravity de cada punto anterior, uno por uno.

**Definition of Done:** se puede jugar un ciclo completo (cliente → armado → entrega → siguiente cliente) sin errores, en placeholder.

---

## ETAPA 3 — Estaciones adicionales
**Objetivo:** sumar profundidad al gameplay, de a una estación por vez.

- [ ] Estación de masa (elegir tipo).
- [ ] Estación de horno (mini-juego de timing).
- [ ] Estación de decoración (drag & drop de toppings).
- [ ] Integrar las 4 estaciones en el flujo completo y revalidar el core loop con todas activas.

**Definition of Done:** las 4 estaciones funcionan integradas, siguen en placeholder.

---

## ETAPA 4 — Aplicar arte final (retrofit)
**Objetivo:** reemplazar placeholders por arte real, siempre contra el Art Bible aprobado en la Etapa 1.

- [ ] Generar sprites de las 4 estaciones + ingredientes, contra la referencia del Art Bible.
- [ ] Generar variantes de clientes (mínimo 4-5 diseños distintos, misma consistencia de estilo).
- [ ] Reemplazar UI placeholder por iconos finales.
- [ ] Revisión visual conjunta: poner todos los assets nuevos en una misma pantalla y confirmar que no hay derive de estilo.

**Definition of Done:** el juego se ve con arte final, consistente, sin mezclar placeholders.

---

## ETAPA 5 — Progresión y contenido
**Objetivo:** darle profundidad y motivo para volver a jugar.

- [ ] Sistema de monedas/puntaje.
- [ ] Desbloqueo progresivo de recetas/decoraciones/estaciones.
- [ ] Definir 8-10 combinaciones de recetas para el MVP.
- [ ] Dificultad creciente (clientes más exigentes, pedidos combinados) — de a un incremento por vez.

**Definition of Done:** hay una curva de progresión jugable de principio a fin, sin saltos de dificultad abruptos.

---

## ETAPA 6 — Pulido de UX/feedback
**Objetivo:** que cada acción del jugador tenga respuesta inmediata (lo que más pesa en el ranking de calidad de CrazyGames).

- [ ] Animaciones de reacción del cliente (contento/tibio/decepcionado).
- [ ] Sonido y música (comprimidos, livianos).
- [ ] Feedback visual de éxito (confetti/estrellas) sin abusar del efecto.
- [ ] Revisión de legibilidad en pantalla chica (mobile).

**Definition of Done:** el juego "se siente" bien, no solo funciona.

---

## ETAPA 7 — Checklist técnico de CrazyGames
**Objetivo:** validar contra los requisitos obligatorios antes de subir nada.

- [ ] Build ≤20MB ideal (nunca superar 50MB), ≤250MB total, ≤1500 archivos.
- [ ] Onboarding sin pantallas de texto, gameplay en máximo 1 click.
- [ ] `user-select: none` en el body.
- [ ] Sin fullscreen propio, sin links a app stores.
- [ ] Test de performance en equipo de gama baja (simular 4GB RAM).
- [ ] Nombre del juego final confirmado como original.

**Definition of Done:** checklist completo tildado, sin pendientes.

---

## ETAPA 8 — Integración SDK CrazyGames (Basic Launch)
**Objetivo:** dejar el juego listo para el primer submit, sin monetización todavía (Basic Launch no la requiere).

- [ ] Cargar el script del SDK v3 antes del código del juego.
- [ ] Inicializar el SDK de forma asíncrona (esperar confirmación antes de usar cualquier método).
- [ ] Implementar `loadingStart()` / `loadingStop()` si el motor elegido lo requiere.
- [ ] Probar con el Preview tool de CrazyGames antes del submit real.

**Definition of Done:** el juego pasa la preview de CrazyGames sin errores de SDK.

---

## ETAPA 9 — QA final y submit (Basic Launch)
**Objetivo:** submit real a la plataforma.

- [ ] Testeo cruzado: Chrome, Edge, mobile touch.
- [ ] Revisión final del Art Bible vs. producto terminado (consistencia).
- [ ] Submit como Basic Launch.
- [ ] Recolectar datos de engagement/feedback antes de decidir pasar a Full Launch.

**Definition of Done:** juego publicado en Basic Launch, con datos reales entrando.

---

## ETAPA 10 — Full Launch (monetización)
**Objetivo:** solo si el Basic Launch mostró buen engagement.

- [ ] Integrar ads, analytics y cloud save del SDK completo.
- [ ] Ajustar balance de dificultad/progresión según datos reales de Basic Launch.
- [ ] Submit como Full Launch.

**Definition of Done:** juego monetizando, con SDK completo integrado.

---

## Reglas transversales (aplican en TODAS las etapas)

1. Una tarea chica por vez, con tu revisión antes de seguir a la siguiente.
2. Ningún asset nuevo se genera sin usar el Art Bible como referencia (desde la Etapa 4 en adelante).
3. Toda feature jugable se verifica en el browser agent antes de darse por cerrada.
4. No se avanza a la etapa siguiente sin cerrar el Definition of Done de la actual.
5. Commits de Git separados por tarea, no por etapa completa — así se puede revertir algo puntual sin perder toda la etapa.
