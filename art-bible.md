# KIWIPAW BAKEHOUSE — Biblia de Arte (Art Bible)

Este documento define la identidad visual y las directrices estéticas aprobadas para el desarrollo de todo el arte y la interfaz gráfica del juego *Kiwipaw Bakehouse*. Cualquier nuevo asset de arte (personajes, repostería, fondos o botones) debe apegarse estrictamente a estas reglas.

---

## 🎨 1. Paleta de Colores Oficial (Tonos Pastel Desaturados)
Para lograr una estética *cozy* (acogedora) y tierna (*kawaii*) de alta identidad, se utiliza una paleta de colores desaturada y de bajo contraste.

| Color | Código Hex | Uso Principal |
| :--- | :--- | :--- |
| **Crema Base** | `#fdfbf7` | Pelaje del gato cocinero principal y bases de masa. |
| **Marrón Tostado** | `#caa689` | Parche del ojo en forma de corazón y bases de galletas de avena o madera clara. |
| **Lavanda Desaturado** | `#d6c7ff` | Sombrero de chef, moño del gato, letreros y acentos secundarios. |
| **Rosa Pastel** | `#ffccd5` | Torta de frutilla bajo la cúpula, glaseados de galletas y mejillas rosadas. |
| **Verde Menta Suave** | `#d8f3dc` | Detalles del letrero, toppings de kiwi abstractos y elementos secundarios. |
| **Madera Cálida** | `#ddb892` | Mostrador de la panadería y repisas. |

---

## ✏️ 2. Estilo de Línea y Contorno
*   **Color de Contorno:** Nunca se utiliza contorno negro puro (`#000000`). Los bordes se trazan en un tono café muy oscuro y cálido (`#4e3629`) o lavanda muy oscuro (`#352f44`). Esto mantiene el estilo cartoon vectorial pero con un acabado suave y premium.
*   **Grosor de Línea:** Líneas limpias, continuas y de grosor medio-grueso (semi-thick, estilo vectorial). El grosor debe ser consistente entre todos los personajes y objetos en pantalla para evitar que unos parezcan tener más resolución que otros.

---

## 🌓 3. Nivel de Detalle y Sombreado
*   **Estilo:** **Flat** (colores planos de relleno) con detalles mínimos de **Cel-Shading** (sombras planas de borde duro y bajo contraste).
*   **Restricciones:** 
    *   Evitar degradados complejos, brillos realistas o sombreados con aerógrafo. 
    *   Los pasteles y dulces deben representarse como formas geométricas simples con glaseados planos y chispas de colores sólidas.
    *   Los fondos deben tener texturas talladas muy sutiles que no compitan en contraste con los elementos interactivos del frente.

---

## 📐 4. Proporciones de Personajes (Estilo Chibi/Kawaii)
*   **Relación Cabeza-Cuerpo:** Proporción Chibi de `1:1`. La cabeza es redonda y chata, con el mismo tamaño o ligeramente mayor que el cuerpo.
*   **Rasgos Faciales:**
    *   *Ojos:* Ojos negros grandes, redondos y muy expresivos (estilo botón), situados en la mitad inferior de la cabeza y bastante separados entre sí.
    *   *Boca:* Pequeña boca estilizada en forma de "3" o "w" colocada muy cerca de los ojos.
    *   *Mejillas:* Círculos rosa pastel difuminados directamente debajo de los ojos.
*   **Identificador Único del Gato:** Un parche color marrón tostado en forma de corazón rodeando su ojo izquierdo.

---

## 🖥️ 5. Especificaciones Técnicas y Resolución
*   **Tamaño del Sprite del Gato:** `256 x 256` píxeles en formato PNG con canal alfa (fondo transparente).
*   **Tamaño de los Sprites de Repostería (Galletas/Cupcakes):** `64 x 64` o `128 x 128` píxeles.
*   **Resolución de Pantalla Base del Juego:** `800 x 600` píxeles (relación de aspecto 4:3), escalado de manera responsiva con la configuración de Phaser `Scale.FIT`.

---

## 🖼️ Imagen de Referencia Master (Aprobada)
El archivo maestro aprobado para la estética del juego se encuentra guardado en:
*   [src/assets/reference/kiwi-cat-master.png](file:///c:/Users/Jonatan%20Agust%C3%ADn/Desktop/Proyectos/Juegos/Cook%20Gatos%20Kiwii/src/assets/reference/kiwi-cat-master.png)
