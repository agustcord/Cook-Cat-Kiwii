"""
Resize assets to 2x display size for HiDPI/CSS-upscale sharpness.
Shapes: 116x116 (displayed at 58x58 game px, CSS upscales to ~108 physical px)
Toppings: 168x168 (displayed at 84x84 game px, CSS upscales to ~156 physical px)
"""
from PIL import Image
import os

brain_dir = r"C:\Users\Jonatan Agustín\.gemini\antigravity\brain\fa180234-e6eb-4c98-97ce-4ce2d3743b2b"
dest_dir = r"public\assets\stations"

# Maps (source_filename, destination_filename, target_size)
shapes = [
    ("shape_star_v2.png", "shape_star.png", 116),
    ("shape_heart.png", "shape_heart.png", 116),
    ("shape_cat.png", "shape_cat.png", 116),
    ("shape_fish.png", "shape_fish.png", 116),
]

toppings = [
    ("topping_sprinkles.png", "topping_sprinkles.png", 168),
    ("topping_choco.png", "topping_choco.png", 168),
    ("topping_glazing.png", "topping_glazing.png", 168),
]

def crop_and_resize(src_path, dest_path, target_size):
    img = Image.open(src_path).convert('RGBA')
    alpha = img.split()[3]
    bbox = alpha.getbbox()
    if not bbox:
        return
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
    final.save(dest_path, "PNG")
    print(f"  {os.path.basename(dest_path)}: {img.size} -> {target_size}x{target_size}")

def main():
    os.makedirs(dest_dir, exist_ok=True)
    print("=== Shapes at 2x (116x116) ===")
    for src_name, dest_name, size in shapes:
        src = os.path.join(brain_dir, src_name)
        if os.path.exists(src):
            crop_and_resize(src, os.path.join(dest_dir, dest_name), size)
        else:
            print(f"  ERROR: Source {src_name} not found!")

    print("\n=== Toppings at 2x (168x168) ===")
    for src_name, dest_name, size in toppings:
        src = os.path.join(brain_dir, src_name)
        if os.path.exists(src):
            crop_and_resize(src, os.path.join(dest_dir, dest_name), size)
        else:
            print(f"  ERROR: Source {src_name} not found!")

    print("\nDone!")

if __name__ == "__main__":
    main()
