from PIL import Image, ImageDraw
import os

brain_dir = r"C:\Users\Jonatan Agustín\.gemini\antigravity\brain\fa180234-e6eb-4c98-97ce-4ce2d3743b2b"
assets_dir = r"src\assets\cookies"

def remove_white_bg(img, tolerance=40):
    img = img.convert("RGBA")
    w, h = img.size
    for corner in [(0,0), (w-1,0), (0,h-1), (w-1,h-1)]:
        r, g, b, a = img.getpixel(corner)
        if r > 200 and g > 200 and b > 200:
            ImageDraw.floodfill(img, corner, (255,255,255,0), thresh=tolerance)
    return img

def main():
    files = os.listdir(brain_dir)
    
    flavors = ["classic", "chocolate", "oat"]
    toppings = ["sprinkles", "choco", "glazing"]
    
    os.makedirs(assets_dir, exist_ok=True)
    
    for flavor in flavors:
        for topping in toppings:
            prefix = f"cookie_star_{flavor}_baked_{topping}_"
            matching_files = [f for f in files if f.startswith(prefix) and f.endswith(".png")]
            if not matching_files:
                print(f"No se encontró archivo para: {flavor} - {topping}")
                continue
            
            matching_files.sort()
            latest_file = matching_files[-1]
            
            input_path = os.path.join(brain_dir, latest_file)
            print(f"Procesando {flavor} + {topping} desde: {latest_file}")
            
            img = Image.open(input_path)
            if img.width > 512 or img.height > 512:
                img = img.resize((512, 512), Image.LANCZOS)
                
            img = remove_white_bg(img, tolerance=45)
            
            # Save transparent PNG to assets
            out_name = f"cookie_star_{flavor}_baked_{topping}.png"
            img.save(os.path.join(assets_dir, out_name), "PNG")
            
            # Save check image to brain
            check_name = f"cookie_star_{flavor}_baked_{topping}_check.png"
            bg = Image.new("RGBA", img.size, (180, 180, 180, 255))
            bg.paste(img, mask=img.split()[3])
            bg.convert("RGB").save(os.path.join(brain_dir, check_name))
            print(f"  OK: {out_name}")

if __name__ == "__main__":
    main()
