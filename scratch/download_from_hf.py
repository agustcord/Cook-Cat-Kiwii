import os
import time
import requests
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import distance_transform_edt, binary_dilation

HF_TOKEN = "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"
MODEL_URL = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell"

prompts = {
    "heart": "A plain unbaked raw cookie in a perfect heart shape, made of creamy-beige cookie dough. The top surface must be completely empty and smooth with NO chocolate chips, NO toppings, NO decorations, and NO sprinkles. Flat 2D vector style, clean medium-thick dark brown outlines (#4e3629), soft desaturated pastel cream color. Chibi cartoon/kawaii style, plain solid white background. No frames, no borders.",
    "cat": "A plain unbaked raw cookie in a cute cat-head shape with pointed ears, made of creamy-beige cookie dough. The top surface must be completely empty and smooth with NO eyes, NO whiskers, NO face, NO chocolate chips, and NO toppings. Flat 2D vector style, clean medium-thick dark brown outlines (#4e3629), soft desaturated pastel cream color. Chibi cartoon/kawaii style, plain solid white background. No frames, no borders.",
    "fish": "A plain unbaked raw cookie in a cute fish shape, made of creamy-beige cookie dough. The top surface must be completely empty and smooth with NO eyes, NO scales, NO details, NO chocolate chips, and NO toppings. Flat 2D vector style, clean medium-thick dark brown outlines (#4e3629), soft desaturated pastel cream color. Chibi cartoon/kawaii style, plain solid white background. No frames, no borders."
}

def download_image_with_retry(shape, prompt, max_retries=5):
    headers = {
        "Authorization": f"Bearer {HF_TOKEN}",
        "Content-Type": "application/json"
    }
    
    print(f"\n[1/4] Llamando a Hugging Face para: {shape.upper()}...")
    
    for i in range(max_retries):
        try:
            response = requests.post(MODEL_URL, headers=headers, json={"inputs": prompt}, timeout=60)
            
            if response.status_code == 200:
                print(f" -> ¡Generado exitosamente!")
                # Save temp draft in memory using BytesIO
                from io import BytesIO
                return Image.open(BytesIO(response.content))
                
            elif response.status_code == 503:
                # Model is loading, wait and retry
                try:
                    err_json = response.json()
                    estimated_time = err_json.get("estimated_time", 15.0)
                except:
                    estimated_time = 15.0
                print(f" -> [Intento {i+1}/{max_retries}] El modelo se está iniciando en los servidores de Hugging Face. Esperando {estimated_time}s...")
                time.sleep(estimated_time)
                
            else:
                print(f" -> Error de Servidor {response.status_code}: {response.text}")
                time.sleep(5)
                
        except Exception as e:
            print(f" -> Error de conexión: {e}")
            time.sleep(5)
            
    raise Exception(f"No se pudo generar la imagen para {shape} después de {max_retries} intentos.")

def erase_inner_details(img, distance_threshold=25):
    img = img.convert("RGBA")
    width, height = img.size
    
    img_np = np.array(img)
    alpha = img_np[:, :, 3]
    rgb = img_np[:, :, :3]
    
    bg_mask = (alpha == 0)
    is_white_bg = np.mean(rgb[bg_mask], axis=0).mean() > 240 if np.any(bg_mask) else True
    if is_white_bg:
        bg_mask = (rgb[:, :, 0] > 240) & (rgb[:, :, 1] > 240) & (rgb[:, :, 2] > 240)
        
    distances = distance_transform_edt(~bg_mask)
    cream_candidates = rgb[(distances > 100) & (rgb[:, :, 0] > 200)]
    if len(cream_candidates) > 0:
        cream_color = np.median(cream_candidates, axis=0).astype(int)
    else:
        cream_color = np.array([245, 235, 224])
        
    new_rgb = rgb.copy()
    dark_mask = (rgb[:, :, 0] < 120) & (rgb[:, :, 1] < 100) & (rgb[:, :, 2] < 80)
    details_mask = dark_mask & (distances > distance_threshold)
    details_mask = binary_dilation(details_mask, iterations=3)
    
    new_rgb[details_mask] = cream_color
    img_np[:, :, :3] = new_rgb
    
    return Image.fromarray(img_np).copy()

def remove_bg_flood(img, tolerance=30):
    img = img.copy()
    width, height = img.size
    corners = [(0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)]
    for corner in corners:
        color = img.getpixel(corner)
        if color[3] > 0 and color[0] > 200 and color[1] > 200 and color[2] > 200:
            ImageDraw.floodfill(img, corner, (255, 255, 255, 0), thresh=tolerance)
    return img

def recolor_cookie(img, highlight, mid, shadow):
    img = img.copy()
    datas = img.getdata()
    newData = []
    for item in datas:
        r, g, b, a = item
        if a == 0:
            newData.append(item)
            continue
        if r < 105 and g < 85 and b < 65:
            newData.append(item)
            continue
        brightness = (r + g + b) / 3.0
        if brightness > 230:
            newData.append(highlight + (a,))
        elif brightness > 195:
            newData.append(mid + (a,))
        else:
            newData.append(shadow + (a,))
    out_img = Image.new("RGBA", img.size)
    out_img.putdata(newData)
    return out_img

def main():
    brain_dir = "C:\\Users\\Jonatan Agustín\\.gemini\\antigravity\\brain\\fa180234-e6eb-4c98-97ce-4ce2d3743b2b"
    output_dir = "c:\\Users\\Jonatan Agustín\\Desktop\\Proyectos\\Juegos\\Cook Gatos Kiwii\\src\\assets\\cookies"
    
    os.makedirs(output_dir, exist_ok=True)
    
    for shape, prompt in prompts.items():
        try:
            # 1. Download
            raw_draft = download_image_with_retry(shape, prompt)
            
            # 2. Erase inner details (using threshold=25)
            print("[2/4] Limpiando detalles y chispas internas...")
            cleaned_img = erase_inner_details(raw_draft, 25)
            
            # 3. Apply transparent background
            print("[3/4] Aplicando transparencia de fondo...")
            transparent_img = remove_bg_flood(cleaned_img, 30)
            
            # Save classic raw
            classic_path = os.path.join(output_dir, f"cookie_{shape}_classic_raw.png")
            transparent_img.save(classic_path, "PNG")
            print(f" -> Guardado Vainilla: {classic_path}")
            
            # 4. Generate variations
            print("[4/4] Creando variaciones de sabor...")
            # Chocolate raw
            choco_img = recolor_cookie(transparent_img, (85, 45, 30), (70, 30, 15), (45, 15, 5))
            choco_path = os.path.join(output_dir, f"cookie_{shape}_chocolate_raw.png")
            choco_img.save(choco_path, "PNG")
            
            # Oat raw
            oat_img = recolor_cookie(transparent_img, (235, 220, 205), (213, 189, 175), (180, 150, 130))
            oat_path = os.path.join(output_dir, f"cookie_{shape}_oat_raw.png")
            oat_img.save(oat_path, "PNG")
            
            # Copy to artifacts for preview
            import shutil
            shutil.copy(classic_path, os.path.join(brain_dir, f"cookie_{shape}_classic_raw.png"))
            shutil.copy(choco_path, os.path.join(brain_dir, f"cookie_{shape}_chocolate_raw.png"))
            shutil.copy(oat_path, os.path.join(brain_dir, f"cookie_{shape}_oat_raw.png"))
            
            # Also copy to _clean.png for cache bypass
            shutil.copy(classic_path, os.path.join(brain_dir, f"cookie_{shape}_classic_raw_clean.png"))
            shutil.copy(choco_path, os.path.join(brain_dir, f"cookie_{shape}_chocolate_raw_clean.png"))
            shutil.copy(oat_path, os.path.join(brain_dir, f"cookie_{shape}_oat_raw_clean.png"))
            print(f" -> Éxito total en {shape.upper()}. Copiado a carpeta temporal.")
            
        except Exception as e:
            print(f"ERROR PROCESANDO {shape.upper()}: {e}")
            
    print("\n¡PROCESO FINALIZADO! Todas las galletas crudas limpias están listas.")

if __name__ == "__main__":
    main()
