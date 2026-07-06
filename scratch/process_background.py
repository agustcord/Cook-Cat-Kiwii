from PIL import Image
import os

input_path = r"scratch\topped_input\Bakery_lobby_back_wall.jpeg"
brain_dir = r"C:\Users\Jonatan Agustín\.gemini\antigravity\brain\fa180234-e6eb-4c98-97ce-4ce2d3743b2b"

def main():
    if not os.path.exists(input_path):
        print(f"ERROR: No se encontró el archivo {input_path}")
        return
        
    img = Image.open(input_path)
    print(f"Dimensiones originales: {img.size}")
    
    # 1. Redimensionar de modo que el ancho sea 800
    target_width = 800
    aspect_ratio = img.height / img.width
    target_height = int(target_width * aspect_ratio)
    
    resized_img = img.resize((target_width, target_height), Image.LANCZOS)
    print(f"Redimensionado a: {resized_img.size}")
    
    # 2. Cortar 240px de alto centrado verticalmente
    # El alto es de 446px, necesitamos 240px. El sobrante es 446 - 240 = 206px.
    # Cortamos 103px de arriba y de abajo.
    top = (target_height - 240) // 2
    bottom = top + 240
    
    cropped_img = resized_img.crop((0, top, target_width, bottom))
    print(f"Cortado final: {cropped_img.size}")
    
    # Guardar en la carpeta brain para preview
    out_path = os.path.join(brain_dir, "bakery_background_top_cropped.png")
    cropped_img.save(out_path, "PNG")
    print(f"Guardado exitosamente en: {out_path}")

if __name__ == "__main__":
    main()
