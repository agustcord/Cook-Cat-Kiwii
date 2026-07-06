import os
from PIL import Image

dirs = [r"public\assets\customers", r"src\assets\customers"]

def resize_customers():
    for d in dirs:
        if not os.path.exists(d):
            print(f"Directory not found: {d}")
            continue
        print(f"Resizing images in {d}...")
        for fname in os.listdir(d):
            if fname.lower().endswith('.png') and fname.startswith('customer_'):
                path = os.path.join(d, fname)
                try:
                    img = Image.open(path)
                    # Resize to 256x256 using high-quality LANCZOS
                    resized = img.resize((256, 256), Image.Resampling.LANCZOS)
                    resized.save(path, "PNG")
                    print(f"  Resized {fname} to 256x256 successfully")
                except Exception as e:
                    print(f"  ERROR resizing {fname}: {e}")

if __name__ == "__main__":
    resize_customers()
