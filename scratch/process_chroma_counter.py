from PIL import Image
import os
import math

input_path = r"scratch\topped_input\Bakery_work_table_2D.jpeg"
output_dir = r"public\assets\backgrounds"
brain_dir = r"C:\Users\Jonatan Agustín\.gemini\antigravity\brain\fa180234-e6eb-4c98-97ce-4ce2d3743b2b"

def color_distance(c1, c2):
    return math.sqrt((c1[0]-c2[0])**2 + (c1[1]-c2[1])**2 + (c1[2]-c2[2])**2)

def main():
    if not os.path.exists(input_path):
        print(f"ERROR: No se encontró {input_path}")
        return
        
    img = Image.open(input_path).convert("RGBA")
    
    # 1. Muestrear el color de fondo en la esquina superior izquierda (0,0)
    bg_color = img.getpixel((0, 0))[:3]
    print(f"Color de fondo detectado (Chroma Key): {bg_color}")
    
    # 2. Redimensionar proporcionalmente a ancho 800
    target_width = 800
    aspect_ratio = img.height / img.width
    target_height = int(target_width * aspect_ratio) # 446px
    resized_img = img.resize((target_width, target_height), Image.LANCZOS)
    
    # 3. Cortar los 360px inferiores (de Y=86 a Y=446)
    top_y = target_height - 360 # 446 - 360 = 86
    cropped_img = resized_img.crop((0, top_y, target_width, target_height))
    
    # Eliminar el color croma con una tolerancia y detección de dominio verde
    # Esto elimina el borde verde difuminado en los límites de la madera
    tolerance = 100
    pixels = cropped_img.load()
    w, h = cropped_img.size
    
    transparent_count = 0
    for x in range(w):
        for y in range(h):
            r, g, b, a = pixels[x, y]
            dist = color_distance((r, g, b), bg_color)
            
            is_chroma = dist < tolerance
            is_greenish = (g > r + 10) and (g > b + 10) and (g > 50)
            
            if is_chroma or is_greenish:
                pixels[x, y] = (0, 0, 0, 0)
                transparent_count += 1
                
    print(f"Procesados {w*h} píxeles. {transparent_count} píxeles hechos transparentes.")
    
    # 5. Guardar en public/assets/backgrounds/bakery_counter_base.png
    os.makedirs(output_dir, exist_ok=True)
    out_path = os.path.join(output_dir, "bakery_counter_base.png")
    cropped_img.save(out_path, "PNG")
    print(f"Mostrador sin croma guardado en: {out_path}")
    
    # Guardar versión de verificación con fondo gris en brain
    bg_check = Image.new("RGBA", cropped_img.size, (180, 180, 180, 255))
    bg_check.paste(cropped_img, mask=cropped_img.split()[3])
    check_path = os.path.join(brain_dir, "bakery_counter_base_chroma_check.png")
    bg_check.convert("RGB").save(check_path)
    print(f"Copia de verificación guardada en: {check_path}")

if __name__ == "__main__":
    main()
