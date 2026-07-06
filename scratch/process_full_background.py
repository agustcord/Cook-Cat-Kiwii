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
    
    # 1. Redimensionar exactamente a 1024x576 (resolución de pantalla completa)
    target_width = 1024
    target_height = 576
    resized_img = img.resize((target_width, target_height), Image.LANCZOS)
    
    # 2. Aplicar efecto Gaussian Blur (radio = 4)
    blurred_img = resized_img.filter(ImageFilter.GaussianBlur(radius=4))
    
    # 3. Guardar en el proyecto (sobrescribiendo la recortada anterior)
    os.makedirs(output_dir, exist_ok=True)
    out_path = os.path.join(output_dir, "bakery_background_top.png")
    blurred_img.save(out_path, "PNG")
    print(f"Imagen completa de fondo con blur guardada en: {out_path}")
    
    # Guardar en brain para vista previa
    preview_path = os.path.join(brain_dir, "bakery_background_full_blurred.png")
    blurred_img.save(preview_path, "PNG")
    print(f"Copia en brain guardada en: {preview_path}")

if __name__ == "__main__":
    main()
