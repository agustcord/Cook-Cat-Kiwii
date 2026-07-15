# 🐾 Prompts para Generar Assets de la Pata de Gato (Perspectiva desde Arriba)

Este archivo contiene los prompts optimizados para generar los sprites de la pata de gato vistos desde la perspectiva del propio gato (vista dorsal/desde arriba, mostrando solo el pelaje y no las almohadillas rosas).

---

## 🎨 Directrices Estéticas Base
Para asegurar la consistencia con la Biblia de Arte (art-bible.md):
* **Vista Superior (Dorsal):** Solo se ve el pelaje color crema suave (`#fdfbf7`), sin almohadillas rosas.
* **Contorno Limpio:** Trazado de grosor medio-grueso en marrón muy oscuro/cálido (`#4e3629`), nunca negro puro.
* **Estilo Gráfico:** Diseño plano (flat-design), chibi/kawaii, minimalista y limpio. Sin degradados complejos ni brillos hiperrealistas.
* **Fondo de Contraste:** Fondo de color blanco sólido puro (`#ffffff`) para facilitar la eliminación de fondo.

---

## 🐾 1. Pata Abierta (`cat_paw_open`) - Vista desde Arriba

Este sprite representa la pata relajada vista desde arriba mientras se mueve por la pantalla.

### Prompt sugerido:
```text
A cute, simple flat-design chibi cat paw, dorsal view (seen from above, showing only the furry cream top of the paw, NO pink pads). The paw is pointing downwards, relaxed. Minimalist cartoon style, kawaii aesthetic. Muted, desaturated cozy color palette: soft cream fur. Medium-thick clean dark brown (#4e3629) outlines. Vector graphics look, flat colors, no shadows, no complex gradients. Solid plain white background. Size: 256x256 pixels.
```

---

## ✊ 2. Pata Cerrada / Agarre (`cat_paw_closed`) - Vista desde Arriba

Este sprite representa la pata en pose de agarre o haciendo click, vista desde arriba. Para simular el agarre físico, las garras del gatito pueden sobresalir ligeramente o la pata curvarse hacia abajo.

### Prompt sugerido:
```text
A cute, simple flat-design chibi cat paw, clenched or grabbing pose seen from above (dorsal view, showing only the furry cream top of the paw, NO pink pads). Tiny, simple cartoon claws are slightly extended as if pinching or holding something. Minimalist cartoon style, kawaii aesthetic. Matching the exact size, orientation, and cream fur color of the open cat paw. Medium-thick clean dark brown (#4e3629) outlines. Vector graphics look, flat colors, no shadows, no complex gradients. Solid plain white background. Size: 256x256 pixels.
```

---

## 🚀 Proceso de Post-Procesamiento (Eliminación de Fondo)
1. Coloca las imágenes resultantes en formato **JPG** en:
   `public/assets/ui_temp_jpg/cat_paw_open.jpg`
   `public/assets/ui_temp_jpg/cat_paw_closed.jpg`
2. Corre en la consola de tu proyecto:
   `npm run process-paws`
3. ¡Listo! El script generará los archivos transparentes automáticamente.
