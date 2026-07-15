# 🐾 Prompts para Generar Assets de la Pata de Gato (Cursor)

Este archivo contiene los prompts optimizados para generar los sprites de la pata de gato utilizados como cursor interactivo en el juego. Guarda estos prompts para reproducir o mejorar las imágenes en cualquier momento.

---

## 🎨 Directrices Estéticas Base
Para asegurar la consistencia con la Biblia de Arte (art-bible.md), las patas deben tener:
* **Paleta de Colores Cozy:** Pelaje color crema suave (`#fdfbf7`), almohadillas color rosa pastel desaturado (`#ffccd5`).
* **Contorno Limpio:** Trazado de grosor medio-grueso en marrón muy oscuro/cálido (`#4e3629`), nunca negro puro.
* **Estilo Gráfico:** Diseño plano (flat-design), kawaii/chibi, minimalista y limpio. Sin degradados complejos ni brillos hiperrealistas.
* **Fondo de Contraste:** Fondo de color blanco sólido puro (`#ffffff`) para facilitar la eliminación y la transparencia automática.

---

## 🐾 1. Pata Abierta (`cat_paw_open`)

Este sprite se muestra por defecto cuando el jugador desplaza el cursor por la pantalla (el gato tiene la pata relajada y abierta).

### Prompt sugerido:
```text
A cute, simple flat-design chibi cat paw, showing the underside with pink soft pads. The paw is open and relaxed. Minimalist cartoon style, kawaii aesthetic. Muted, desaturated cozy color palette: soft cream fur, pastel pink pads. Medium-thick clean dark brown (#4e3629) outlines. Vector graphics look, flat colors, no shadows, no complex gradients. Solid plain white background. Size: 256x256 pixels.
```

---

## ✊ 2. Pata Cerrada / Agarre (`cat_paw_closed`)

Este sprite reemplaza a la pata abierta cuando el jugador mantiene presionado el click para arrastrar ingredientes o interactuar con el entorno (el gato cierra la pata para simular un agarre).

### Prompt sugerido:
```text
A cute, simple flat-design chibi cat paw, clenched into a closed fist or grabbing pose, showing the folded toes and pink pads partially visible. Minimalist cartoon style, kawaii aesthetic, matching the exact size, orientation, and style of the open cat paw. Muted, desaturated cozy color palette: soft cream fur, pastel pink details. Medium-thick clean dark brown (#4e3629) outlines. Vector graphics look, flat colors, no shadows, no complex gradients. Solid plain white background. Size: 256x256 pixels.
```

---

## 🚀 Proceso de Post-Procesamiento (Eliminación de Fondo)
Una vez generadas las imágenes utilizando tu herramienta favorita de IA (como Midjourney, Stable Diffusion o DALL-E/OpenAI):
1. Elimina el fondo blanco puro (`#ffffff`) convirtiéndolo en transparente (canal alfa).
2. Asegúrate de centrar y alinear ambas imágenes (`cat_paw_open` y `cat_paw_closed`) para que al alternar entre ellas durante el click no se produzca un salto visual brusco.
3. Guarda los archivos resultantes en formato **PNG transparente** en:
   `public/assets/cat_paw_open.png`
   `public/assets/cat_paw_closed.png`
