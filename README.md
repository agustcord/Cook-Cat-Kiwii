<div align="center">

<img src="https://raw.githubusercontent.com/agustcord/Cook-Cat-Kiwii/main/public/assets/chef_cat.png" alt="Kiwipaw Bakehouse - el gato chef" width="380" />

# 🐱 Kiwipaw Bakehouse
### *Cook Cat Kiwii* — Pastelería Felina Cozy & Gestión Tycoon

**Un michi renunció a su gris trabajo de oficina para cumplir su sueño: abrir una pastelería artesanal. Ayudalo a amasar, hornear, decorar y pagar sus deudas antes de que el banco cierre el negocio.**

[![Jugar ahora](https://img.shields.io/badge/🎮_JUGAR_AHORA-en_el_navegador-8CC84B?style=for-the-badge)](https://agustcord.github.io/Cook-Cat-Kiwii/)

![Phaser](https://img.shields.io/badge/Phaser_4-8CC84B?style=flat-square&logo=phaser&logoColor=white)
![Vite](https://img.shields.io/badge/Vite_8-646CFF?style=flat-square&logo=vite&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES_Modules-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Tests](https://img.shields.io/badge/Tests-288_passing-success?style=flat-square)
![Resolución](https://img.shields.io/badge/Resolución-1920x1080_FHD-blue?style=flat-square)
![CrazyGames](https://img.shields.io/badge/CrazyGames_SDK-v3_Ready-purple?style=flat-square)
![Estado](https://img.shields.io/badge/Estado-Beta_Jugable-orange?style=flat-square)

</div>

---

## 🎮 Jugalo en Vivo

👉 **[agustcord.github.io/Cook-Cat-Kiwii](https://agustcord.github.io/Cook-Cat-Kiwii/)**

Ejecuta directamente en tu navegador (escritorio y móvil) sin descargas ni instalaciones requeridas.

---

## 📖 La Historia

Michi trabajaba como analista en una corporación gris: planillas infinitas, reuniones interminables y un jefe insoportable (*"El Gato Superior"*). Su único refugio era observar, desde la ventana de su cubículo, una cálida pastelería al otro lado de la calle.

Un lunes cualquiera tomó valor: renunció a la oficina, solicitó un **préstamo inicial de 200 monedas** y abrió su propia pastelería. Para conservar su sueño debe hornear contra reloj, satisfacer a clientes exigentes y administrar cuidadosamente sus ingresos diarios para cubrir alquiler, insumos y la cuota del banco.

Si el saldo no alcanza al cerrar el día, el negocio cae en **quiebra**. Si logra sostener la pastelería durante los 4 días y saldar la deuda, *Kiwipaw Bakehouse* será suyo para siempre. 🎉

---

## 🎨 Identidad Visual: Transición Integral a Arte Propio Ilustrado

El proyecto ha dado un salto cualitativo reemplazando progresivamente casi la totalidad de prototipos y formas vectoriales por **arte propio original ilustrado digitalmente en Krita**, rigurosamente gobernado por nuestra **Biblia de Arte** (`art-bible.md`):

- 🪵 **Mesa y Mostrador Ilustrado a Mano:** Un lienzo continuo y detallado con textura de madera cálida, calibrado al píxel para albergar con ergonomía orgánica todas las estaciones de trabajo.
- 🖼️ **Pared de Fondo Panorámica 1080p (`fondo_pared.png`):** Fondo nativo en resolución Full HD (1920x1080) con iluminación pastel, profundidad calibrada en capa defensiva (`depth -100`) y perfecta integración con el mostrador.
- 🗑️ **Basurero Ilustrado a Escala 1:1:** Sprite reactivo que reemplaza al viejo marcador vectorial, con detección de arrastre, feedback de proximidad y animación de descarte.
- 🥐 **Horno Multicapa Interactivo:** Estación ilustrada con cristal dinámico de horneado (encendido/apagado), perillas mecánicas de cocción y botones analógicos de control.
- 🪧 **Cartelería HUD de Madera:** Placas colgantes de madera para el seguimiento de día (`daySign`), monedas (`coinsSign`), meta de ventas (`metaSign`) y botón ergonómico de finalización de jornada.
- 🐾 **Patas Felinas Interactivas (`paws`):** Sprites de patitas de gato animadas para sostener, amasar y servir los pedidos con inmersión táctil.
- 🎨 **Biblia de Estilo Cozy:** Paleta pastel desaturada (crema base `#fdfbf7`, tostado `#caa689`, lavanda `#d6c7ff`, rosa `#ffccd5`, madera `#ddb892`), contornos cálidos sin negro puro (`#4e3629`) y acabado *flat* con *cel-shading* suave.

---

## 🍪 Cómo se Juega: Core Loop de Repostería

Atendés clientes felinos y humanos contra reloj, completando recetas paso a paso a través de las estaciones interactivas:

| Estación | Acción de Juego |
|---|---|
| 🥣 **Masa** | Seleccionás la base de receta (Clásica, Chocolate, Avena). |
| ⭐ **Forma** | Cortás la masa en la bandeja con el molde solicitado (Michi, Huesito, etc.). |
| 🔥 **Horno** | Horneás vigilando el temporizador — ¡cuidado con retirar a tiempo antes de que se queme! |
| 🎨 **Decoración** | Agregás glaseados dulces y toppings de colores según el pedido. |
| ☕ **Cafetería** | Servís bebidas calientes en taza para acompañar los pedidos combinados. |
| 🗑️ **Basurero** | Descartás recetas fallidas o galletas quemadas para liberar la bandeja. |

---

## ✨ Sistemas Avanzados y Avances Recientes

### 🎓 Tutorial Guiado por Bloques con Input Gating (Día 1)
- **Pedagogía en 6 Bloques:** Enseña desde el amasado inicial hasta el empaque final sin sobrecargar al jugador.
- **Input Gating Defensivo:** Bloquea toques fuera de la zona requerida para evitar errores accidentales o pérdida del foco interactivo.
- **Guía Visual en Dos Fases:** Puntero animado de patita que indica origen y destino de cada gesto de arrastre.
- **Bocadillo de Diálogo Responsive:** Posicionamiento inteligente del diálogo del Michi Chef para no tapar la mesa de trabajo.
- **Afianzamiento con Cliente 2 (Bloque 6):** Permite al jugador completar un pedido de forma autónoma antes de liberar el juego libre.
- **Safety Nets:** Recuperación automática ante quemado fortuito de galletas o desvíos de bandeja.

### 📈 Progresión y Rebalanceo Económico
- Curva de dificultad rebalanceada con clientes procedurales, tiempos de paciencia escalonados y pedidos combinados.
- Meta de supervivencia financiera: pagar 200 monedas de deuda en 4 días de gestión.

### 🛍️ Tienda de Mejoras y Nuevas Recetas (`ShopScene`)
- Tarjeta de compras rediseñada con scroll vertical interactivo (rueda de mouse, arrastre y barra deslizante).
- Desbloqueo voluntario y manual de ingredientes y mejoras con las monedas acumuladas.

### 🧾 Pantalla de Balance Fin de Día (`SummaryScene`)
- Recibo contable animado con micro-interacciones.
- Desglose transparente de ingresos por ventas, propinas, costo de insumos, alquiler y cuota del préstamo.
- Calificación de jornada con estrellas doradas reactivas.

### 🎵 Soundscape ASMR y Audio Modular (`SoundManager`)
- Gestor de sonido desacoplado con soporte para feedback acústico: horneado, corte de masa, tintineo de monedas y maullidos.

### 🌐 Soporte Multi-Idioma (i18n)
- Localización completa en Español e Inglés con conmutador interactivo visual en el menú principal.

### 🕹️ Integración CrazyGames SDK v3
- Preparado para publicación en plataformas web con control del ciclo de vida del juego (`gameplayStart` / `gameplayStop`).

---

## 🛠️ Stack Tecnológico e Ingeniería

- **Motor:** [Phaser 4](https://phaser.io/) (v4.2.0 *Giedi*) en resolución nativa 1920x1080 (16:9 Full HD) con auto-escalado `Scale.FIT`.
- **Bundler & Dev Server:** [Vite 8](https://vitejs.dev/) con compilación ultrarrápida.
- **Procesamiento de Sprites:** Pipeline propio en Node.js impulsado por [Sharp](https://sharp.pixelplumbing.com/).
- **Testing Automatizado:** Suite de **288 pruebas unitarias en 14 suites** con el Node.js Test Runner nativo (`npm test`).
- **CI/CD:** Despliegue automatizado a GitHub Pages vía GitHub Actions en cada actualización a `main`.

---

## 🚀 Instalación y Desarrollo Local

Requisitos: Node.js 20+ y Git.

```bash
# Clonar el repositorio
git clone https://github.com/agustcord/Cook-Cat-Kiwii.git

# Ingresar al directorio
cd Cook-Cat-Kiwii

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo local
npm run dev

# Ejecutar la suite completa de pruebas unitarias (288 tests)
npm test

# Compilar para producción
npm run build
```

---

## 🗺️ Estado del Proyecto y Próximos Pasos

> 🟢 **Beta Jugable de Punta a Punta:** El ciclo completo de juego está operativo (Menú → Días 1 a 4 con tutorial e incremento de dificultad → Pantallas de balance → Tienda → Victoria / Quiebra).

**Próximas metas:**
- Integración final de catálogo de SFX personalizados de ambientación cozy.
- Expansión de catálogo de clientes con nuevas expresiones e ilustraciones.
- Incorporación de recetas premium de repostería.

---

## 📬 Contacto y Créditos

Creado con 🧉, dedicación y muchas galletas por **[Jonatan Agustín Córdoba](https://github.com/agustcord)**.

*© 2026 — Todos los derechos reservados.*
