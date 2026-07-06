import os
import time
import requests
from PIL import Image, ImageDraw

HF_TOKEN = "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"
MODEL_URL = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell"

prompts = {
    "dough_classic": "A single clean, unbaked cookie dough ball, classic vanilla flavor, made of a soft warm pastel cream-beige color. The dough ball has a round, slightly irregular organic shape, representing raw cookie dough. Flat 2D vector style, clean medium-thick dark brown outlines (#4e3629), soft desaturated pastel tones, minimal cel-shading. Chibi cartoon/kawaii style, plain solid white background. No frames, no borders, no text.",
    "dough_chocolate": "A single clean, unbaked cookie dough ball, chocolate flavor, made of a soft warm desaturated dark cocoa brown color. The dough ball has a round, slightly irregular organic shape, representing raw chocolate cookie dough. Flat 2D vector style, clean medium-thick dark brown outlines (#4e3629), soft desaturated pastel tones, minimal cel-shading. Chibi cartoon/kawaii style, plain solid white background. No frames, no borders, no text.",
    "dough_oat": "A single clean, unbaked cookie dough ball, oat flavor, made of a soft warm toasted light-tan brown color with very subtle oat texture flecks. The dough ball has a round, slightly irregular organic shape, representing raw oat cookie dough. Flat 2D vector style, clean medium-thick dark brown outlines (#4e3629), soft desaturated pastel tones, minimal cel-shading. Chibi cartoon/kawaii style, plain solid white background. No frames, no borders, no text."
}

brain_dir = r"C:\Users\Jonatan Agustín\.gemini\antigravity\brain\ab05ab45-a515-4bb6-bd98-976a4c3a6829"

def download_image_with_retry(name, prompt, max_retries=5):
    headers = {
        "Authorization": f"Bearer {HF_TOKEN}",
        "Content-Type": "application/json"
    }
    
    print(f"\n[1/4] Generating {name} on Hugging Face...")
    
    for i in range(max_retries):
        try:
            response = requests.post(MODEL_URL, headers=headers, json={"inputs": prompt}, timeout=60)
            
            if response.status_code == 200:
                print(f" -> Generated successfully!")
                from io import BytesIO
                return Image.open(BytesIO(response.content))
                
            elif response.status_code == 503:
                try:
                    err_json = response.json()
                    estimated_time = err_json.get("estimated_time", 15.0)
                except:
                    estimated_time = 15.0
                print(f" -> [Attempt {i+1}/{max_retries}] Model is loading. Waiting {estimated_time}s...")
                time.sleep(estimated_time)
                
            else:
                print(f" -> Server Error {response.status_code}: {response.text}")
                time.sleep(5)
                
        except Exception as e:
            print(f" -> Connection error: {e}")
            time.sleep(5)
            
    raise Exception(f"Failed to generate {name} after {max_retries} attempts.")

def remove_bg_flood(img, tolerance=40):
    img = img.convert("RGBA")
    w, h = img.size
    corners = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
    for corner in corners:
        r, g, b, a = img.getpixel(corner)
        if a > 0 and r > 200 and g > 200 and b > 200:
            ImageDraw.floodfill(img, corner, (255, 255, 255, 0), thresh=tolerance)
    return img

def crop_and_resize(img, target_size=256):
    img = img.convert('RGBA')
    alpha = img.split()[3]
    bbox = alpha.getbbox()
    if not bbox:
        return img
    
    margin = int(max(bbox[2]-bbox[0], bbox[3]-bbox[1]) * 0.03)
    padded = (
        max(0, bbox[0] - margin),
        max(0, bbox[1] - margin),
        min(img.width, bbox[2] + margin),
        min(img.height, bbox[3] + margin),
    )
    cropped = img.crop(padded)
    side = max(cropped.size)
    square = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    square.paste(cropped, ((side - cropped.width) // 2, (side - cropped.height) // 2))
    final = square.resize((target_size, target_size), Image.Resampling.LANCZOS)
    return final

def main():
    os.makedirs(brain_dir, exist_ok=True)
    
    for name, prompt in prompts.items():
        try:
            # 1. Download raw draft
            img = download_image_with_retry(name, prompt)
            
            # 2. Make transparent
            print(f" -> [2/4] Removing white background...")
            img_trans = remove_bg_flood(img, tolerance=40)
            
            # 3. Crop and resize to 256x256
            print(f" -> [3/4] Cropping and resizing to 256x256...")
            img_final = crop_and_resize(img_trans, 256)
            
            # 4. Save transparent file in brain dir
            final_path = os.path.join(brain_dir, f"{name}.png")
            img_final.save(final_path, "PNG")
            print(f" -> Saved transparent: {final_path}")
            
            # 5. Save a check file on gray background for easy user viewing
            bg = Image.new("RGBA", img_final.size, (180, 180, 180, 255))
            bg.paste(img_final, mask=img_final.split()[3])
            check_path = os.path.join(brain_dir, f"{name}_check.png")
            bg.convert("RGB").save(check_path)
            print(f" -> Saved check: {check_path}")
            
        except Exception as e:
            print(f"ERROR processing {name}: {e}")

if __name__ == "__main__":
    main()
