from PIL import Image, ImageFilter
import os

input_path = r"scratch\topped_input\Bakery_lobby_back_wall.jpeg"
output_dir = r"public\assets\backgrounds"
brain_dir = r"C:\Users\Jonatan Agustín\.gemini\antigravity\brain\fa180234-e6eb-4c98-97ce-4ce2d3743b2b"

def main():
    if not os.path.exists(input_path):
        print(f"ERROR: No se encontró el archivo {input_path}")
        return
        
    img = Image.open(input_path)
    
    # 1. Redimensionar proporcionalmente a ancho 800
    target_width = 800
    aspect_ratio = img.height / img.width
    target_height = int(target_width * aspect_ratio)
    resized_img = img.resize((target_width, target_height), Image.LANCZOS)
    
    # 2. Cortar 240px de alto centrado verticalmente
    top = (target_height - 240) // 2
    bottom = top + 240
    cropped_img = resized_img.crop((0, top, target_width, bottom))
    
    # 3. Aplicar efecto Gaussian Blur (radio = 4)
    blurred_img = cropped_img.filter(ImageFilter.GaussianBlur(radius=4))
    
    # 4. Crear carpeta de salida y guardar
    os.makedirs(output_dir, exist_ok=True)
    out_path = os.path.join(output_dir, "bakery_background_top.png")
    blurred_img.save(out_path, "PNG")
    print(f"Imagen con blur guardada en el proyecto: {out_path}")
    
    # Guardar en brain para vista previa
    preview_path = os.path.join(brain_dir, "bakery_background_top_blurred.png")
    blurred_img.save(preview_path, "PNG")
    print(f"Copia de vista previa guardada en: {preview_path}")

if __name__ == "__main__":
    main()
