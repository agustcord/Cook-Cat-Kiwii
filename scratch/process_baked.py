"""
Versión simplificada: SOLO quita el fondo blanco.
No toca colores internos. Las imágenes ya vienen limpias (sin chips).
"""
from PIL import Image, ImageDraw
import os, shutil

BRAIN_DIR = r"C:\Users\Jonatan Agustín\.gemini\antigravity\brain\fa180234-e6eb-4c98-97ce-4ce2d3743b2b"
ASSETS_DIR = r"src\assets\cookies"
INPUT_DIR  = r"scratch\baked_input"

def remove_white_bg(img, tolerance=40):
    """Quita el fondo blanco haciendo flood fill desde las 4 esquinas."""
    img = img.convert("RGBA")
    w, h = img.size
    for corner in [(0,0), (w-1,0), (0,h-1), (w-1,h-1)]:
        r, g, b, a = img.getpixel(corner)
        if r > 200 and g > 200 and b > 200:
            ImageDraw.floodfill(img, corner, (255,255,255,0), thresh=tolerance)
    return img

def main():
    os.makedirs(ASSETS_DIR, exist_ok=True)
    files = sorted([f for f in os.listdir(INPUT_DIR)
                    if f.lower().endswith(('.jpg','.jpeg','.png'))
                    and f.startswith('cookie_')])

    print(f"Procesando {len(files)} archivos (solo quitar fondo, sin alterar colores)...\n")

    for fname in files:
        out_name = os.path.splitext(fname)[0] + ".png"
        try:
            img = Image.open(os.path.join(INPUT_DIR, fname))
            # Resize a 512x512 si hace falta
            if img.width > 512 or img.height > 512:
                img = img.resize((512, 512), Image.LANCZOS)
            # Solo quitar fondo blanco
            img = remove_white_bg(img, tolerance=40)
            # Guardar PNG transparente en assets
            asset_path = os.path.join(ASSETS_DIR, out_name)
            img.save(asset_path, "PNG")
            # Copiar al brain para preview
            shutil.copy(asset_path, os.path.join(BRAIN_DIR, out_name))
            # Crear versión _check con fondo gris para verificar transparencia
            bg = Image.new("RGBA", img.size, (180, 180, 180, 255))
            bg.paste(img, mask=img.split()[3])
            check_name = out_name.replace('.png', '_check.png')
            bg.convert("RGB").save(os.path.join(BRAIN_DIR, check_name))
            print(f"  OK: {out_name}")
        except Exception as e:
            print(f"  ERROR en {fname}: {e}")

    print("\nListo. Archivos guardados en:", ASSETS_DIR)

if __name__ == "__main__":
    main()
