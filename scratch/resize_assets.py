from PIL import Image
import os

assets_dir = r"src\assets\stations"

targets_128 = [
    "shape_star.png",
    "shape_heart.png",
    "shape_cat.png",
    "shape_fish.png",
    "topping_sprinkles.png",
    "topping_choco.png",
    "topping_glazing.png"
]

def main():
    # 1. Resize shapes and toppings to 128x128 using high-quality LANCZOS
    for fname in targets_128:
        path = os.path.join(assets_dir, fname)
        if not os.path.exists(path):
            print(f"WARNING: File {path} not found")
            continue
        img = Image.open(path)
        resized = img.resize((128, 128), Image.Resampling.LANCZOS)
        resized.save(path, "PNG")
        print(f"Resized {fname} to 128x128 successfully")

    # 2. Resize oven_station.png to 256x256
    oven_path = os.path.join(assets_dir, "oven_station.png")
    if os.path.exists(oven_path):
        img = Image.open(oven_path)
        resized = img.resize((256, 256), Image.Resampling.LANCZOS)
        resized.save(oven_path, "PNG")
        print("Resized oven_station.png to 256x256 successfully")

if __name__ == "__main__":
    main()
