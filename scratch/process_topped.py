"""
Procesa las 36 galletas con toppings en scratch/topped_input/:
1. Quita el fondo blanco
2. Guarda como PNG transparente en src/assets/cookies/
3. Genera vistas check con fondo gris en la carpeta brain/
"""
from PIL import Image, ImageDraw
import os, shutil

BRAIN_DIR = r"C:\Users\Jonatan Agustín\.gemini\antigravity\brain\fa180234-e6eb-4c98-97ce-4ce2d3743b2b"
ASSETS_DIR = r"src\assets\cookies"
INPUT_DIR  = r"scratch\topped_input"

def remove_white_bg(img, tolerance=40):
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

    print(f"Procesando {len(files)} galletas con toppings...\n")

    for fname in files:
        # Renombrar cookie_heart_oat_baked_sprinkle.jpeg a sprinkles.png si es necesario
        base_name = os.path.splitext(fname)[0]
        if base_name.endswith('_sprinkle'):
            base_name += 's'
            
        out_name = base_name + ".png"
        try:
            img = Image.open(os.path.join(INPUT_DIR, fname))
            if img.width > 512 or img.height > 512:
                img = img.resize((512, 512), Image.LANCZOS)
                
            img = remove_white_bg(img, tolerance=45)
            
            # Guardar en el proyecto
            asset_path = os.path.join(ASSETS_DIR, out_name)
            img.save(asset_path, "PNG")
            
            # Copiar a brain
            shutil.copy(asset_path, os.path.join(BRAIN_DIR, out_name))
            
            # Crear check con fondo gris
            bg = Image.new("RGBA", img.size, (180, 180, 180, 255))
            bg.paste(img, mask=img.split()[3])
            check_name = out_name.replace('.png', '_check.png')
            bg.convert("RGB").save(os.path.join(BRAIN_DIR, check_name))
            
            print(f"  OK: {out_name}")
        except Exception as e:
            print(f"  ERROR en {fname}: {e}")

    print("\nListo. Todos los archivos procesados con éxito.")

if __name__ == "__main__":
    main()
