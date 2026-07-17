# Guía de Referencias y Diseño: Cafetería de Kiwipaw Bakehouse

Esta guía te ayudará a buscar inspiración visual, utilizar inteligencia artificial para conceptualizar y estructurar tus assets en Krita con coherencia estética.

---

## 1. Dónde buscar referencias visuales (Plataformas Web)

Para un juego *cozy* (cálido, adorable y relajante), te recomiendo explorar las siguientes plataformas utilizando palabras clave específicas:

### A. Pinterest (La mejor para "Moodboards")
Crea un tablero y busca combinaciones en inglés (suele haber más contenido de arte de videojuegos):
* **Palabras clave**: `Cozy game art`, `Cute game UI`, `kawaii kitchen vector`, `cats and soup aesthetic`, `animal crossing furniture design`.
* **Filtros**: Busca tableros de otros diseñadores sobre "Cute game assets" o "Bakehouse concept art".

### B. Behance y Dribbble (Para Interfaces y Estructura)
Ideales para ver cómo otros artistas profesionales ordenan los botones e iconos de una pantalla de juego.
* **Palabras clave**: `2D Game Asset`, `Cozy Cooking game`, `UI Game cute`.

### C. Itch.io (Para ver juegos reales en acción)
Explora la sección de juegos web gratuitos en las categorías `Cozy`, `Cooking` o `Cute`. 
* Mira juegos como *Cats & Soup*, *Good Pizza, Great Pizza* o simuladores de té boba en 2D para ver cómo disponen las cafeteras, tazas y la interacción con el mouse.

---

## 2. Cómo buscar referencias con Inteligencia Artificial (Prompts)

Si usas herramientas como ChatGPT (DALL-E 3), Midjourney o Leonardo.ai para obtener ideas rápidas, la clave está en describir el estilo artístico exacto. Aquí tienes algunas plantillas de *prompts* que puedes copiar y adaptar:

### Prompt 1: Para la Cafetera Base
> "A cozy 2D vector game asset of a cute cat-themed espresso machine. Kawaii aesthetic, pastel colors (cream, soft brown, mint), clean line art, flat design style. The machine has a space to place a cup at the bottom. Isolated on a transparent background, high resolution, game concept art style."

### Prompt 3: Para los Botones y Palancas
> "A set of cute, matching buttons for a 2D cozy game interface. Coffee bean button, milk bottle button, kawaii vector icons, wooden or pastel circle borders, clean outlines, flat game design style, white background."

---

## 3. Pautas de Diseño para la Cafetera de Kiwipaw Bakehouse

Para que la nueva cafetería no solo se vea hermosa, sino que sea funcional con el código que ya tenemos programado, te sugeriero incluir los siguientes elementos en tu lienzo de Krita:

* **La Base (`drink_machine_base.png`)**:
  * Dibuja la estructura de la cafetera.
  * Deja un espacio hueco o una "bandeja" en la parte inferior central donde se note que va colocada la taza.
  * Diseña una boquilla o dispensador de donde caerá el chorro de café/leche.
* **Los Botones (`btn_brew_coffee.png` y `btn_brew_milk.png`)**:
  * Exporta cada botón por separado.
  * Te sugiero que tengan una silueta clara: por ejemplo, el de café con un grano de café 🫘 o una taza ☕, y el de leche con una botella de leche 🥛 o una gota blanca.
  * Hazlos en un lienzo pequeño (ej. 64x64 px) centrados, para que podamos posicionarlos en el panel superior de la cafetera.
* **Coherencia de Color**:
  * Utiliza la paleta de colores de nuestro juego: marrones pastel (`#582f0e`, `#7f5539`, `#ddb892`), cremas (`#f5ebe0`, `#e6ccb2`) y algún tono de acento sutil (como el verde menta o el azul pastel para la leche).
