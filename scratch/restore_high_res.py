from PIL import Image
import os

brain_dir = r"C:\Users\Jonatan Agustín\.gemini\antigravity\brain\fa180234-e6eb-4c98-97ce-4ce2d3743b2b"
dest_dir = r"src\assets\stations"

assets = [
    "shape_star.png",
    "shape_heart.png",
    "shape_cat.png",
    "shape_fish.png",
    "topping_sprinkles.png",
    "topping_choco.png",
    "topping_glazing.png"
]

def main():
    for fname in assets:
        src = os.path.join(brain_dir, fname)
        dest = os.path.join(dest_dir, fname)
        if not os.path.exists(src):
            print(f"ERROR: {src} not found")
            continue
        img = Image.open(src)
        # Resize to 512x512 using high quality LANCZOS filter
        resized = img.resize((512, 512), Image.Resampling.LANCZOS)
        resized.save(dest, "PNG")
        print(f"Restored and resized {fname} to 512x512 in project successfully")

if __name__ == "__main__":
    main()
