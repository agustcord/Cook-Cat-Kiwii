---
name: obsidian-memory
description: Trabajar con la memoria de diseño del proyecto en Obsidian (el vault `.memory/`). Usar siempre que haya que leer contexto/documentación del proyecto, crear o actualizar notas de la wiki (historia, arte, roadmap, troubleshooting, UI), consultar decisiones de diseño previas, registrar bugs resueltos en el post-mortem, o mantener el índice y la bitácora del vault de "Kiwipaw Bakehouse".
---

# Obsidian Memory — Memoria de Diseño del Proyecto

El proyecto mantiene un **vault de Obsidian** en la carpeta `.memory/` como base de conocimiento persistente. Antes de tomar decisiones de diseño, arte, economía o narrativa, leer el vault para alinearse con lo ya aprobado.

## Estructura del vault

```
.memory/
├── .obsidian/        Config de la app Obsidian — NUNCA modificar
├── index.md          Catálogo de notas (punto de entrada)
├── log.md            Bitácora de cambios (cronológica, más reciente arriba)
├── wiki/             Notas de conocimiento (una por tema)
└── sources/          Material fuente sin procesar
```

## Flujo de lectura (ponerse en contexto)

1. Leer `.memory/index.md` para ver el catálogo completo de notas.
2. Leer `.memory/log.md` para conocer los cambios recientes.
3. Leer solo las notas de `wiki/` relevantes para la tarea actual — no cargar todo el vault innecesariamente.

## Convenciones obligatorias del vault

- **Idioma:** todo en español.
- **Nombres de archivo:** `snake_case`, sin tildes ni emojis (ej. `guia_resolucion_problemas.md`). El título visible con emoji va en el H1 de la nota, no en el nombre del archivo.
- **Enlaces internos:** sintaxis wiki-link de Obsidian con alias: `[[nombre_archivo|Título Legible]]`.
- **Enlaces a archivos del proyecto (fuera del vault):** ruta absoluta URL-encoded con esquema `file:///`, ej. `[ui-config.json](file:///c:/Users/Jonatan%20Agust%C3%ADn/Desktop/Proyectos/Juegos/Cook%20Gatos%20Kiwii/ui-config.json)`.
- **Emojis por categoría en los H1:** 📖 historia/lore, 🎨 arte, 📋 roadmap/tareas, 🖥️ UI/técnico, 🎮 mecánicas, 🐈 personajes.
- **Avisos destacados:** callouts de Obsidian (`> [!IMPORTANT]`, `> [!NOTE]`, `> [!WARNING]`).
- Las notas documentan decisiones **aprobadas** y lecciones aprendidas; no borradores ni especulaciones.

## Flujo de escritura (crear/actualizar notas)

1. Crear o editar la nota en `.memory/wiki/` siguiendo las convenciones.
2. Actualizar `.memory/index.md`: agregar el wiki-link bajo la sección de categoría correspondiente (General y Proyecto / Mecánicas y Sistemas / Personajes y Entidades / Arte y Assets). Si una sección dice *"Aún no se han documentado..."*, reemplazar ese texto al agregar la primera entrada.
3. Agregar entrada al **tope** de `.memory/log.md` con el formato:

```markdown
## [YYYY-MM-DD] acción | Descripción breve
- Se creó la nota [[nombre_archivo|Título]] explicando X.
- Se actualizó el [[index|Catálogo de Notas]].
```

   Acciones válidas: `init`, `update`, `fix`. Usar la fecha local real del sistema (verificarla, no asumirla).

## Notas clave actuales

- `historia` — lore y economía narrativa (préstamo, alquiler, quiebra, victoria).
- `biblia_arte` — paleta pastel, estilo chibi/flat y specs técnicas **aprobadas**; todo asset nuevo debe respetarla.
- `hoja_ruta` — roadmap macro por etapas (ETAPA 0–10) con checkboxes.
- `configuracion_ui` — `ui-config.json` es la única fuente de verdad para posiciones/tamaños de UI.
- `guia_resolucion_problemas` — post-mortem de bugs (masa agotada, imports `.js` en Vite, cursor pata de gato). **Consultar antes de tocar esas áreas y registrar ahí los bugs nuevos que se resuelvan.**

## Reglas de cuidado

- No modificar `.memory/.obsidian/` ni las notas aprobadas salvo que el usuario lo pida.
- Mantener las notas concisas; el vault es memoria de diseño, no un volcado de chat.
- Al resolver un bug no trivial o aprobar una decisión de diseño/arte, proponer documentarlo en el vault.
