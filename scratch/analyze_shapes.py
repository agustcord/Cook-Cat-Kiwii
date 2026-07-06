from PIL import Image
import os

brain_dir = r"C:\Users\Jonatan Agustín\.gemini\antigravity\brain\fa180234-e6eb-4c98-97ce-4ce2d3743b2b"
public_dir = r"public\assets\stations"

files = [
    ("shape_star.png", os.path.join(brain_dir, "shape_star.png")),
    ("shape_star_v2.png", os.path.join(brain_dir, "shape_star_v2.png")),
    ("shape_heart.png", os.path.join(brain_dir, "shape_heart.png")),
    ("shape_cat.png", os.path.join(brain_dir, "shape_cat.png")),
    ("shape_fish.png", os.path.join(brain_dir, "shape_fish.png")),
]

for name, path in files:
    if not os.path.exists(path):
        print(f"{name}: NOT FOUND at {path}")
        continue
    img = Image.open(path).convert('RGBA')
    w, h = img.size
    
    # Let's count completely transparent pixels (alpha == 0)
    # completely opaque pixels (alpha == 255)
    # semi-transparent pixels (0 < alpha < 255)
    alpha_data = list(img.split()[3].getdata())
    trans = sum(1 for a in alpha_data if a == 0)
    opaque = sum(1 for a in alpha_data if a == 255)
    semi = len(alpha_data) - trans - opaque
    
    trans_pct = 100 * trans / len(alpha_data)
    opaque_pct = 100 * opaque / len(alpha_data)
    semi_pct = 100 * semi / len(alpha_data)
    
    print(f"{name}: {w}x{h}")
    print(f"  Transparent: {trans} ({trans_pct:.1f}%)")
    print(f"  Opaque: {opaque} ({opaque_pct:.1f}%)")
    print(f"  Semi-transparent: {semi} ({semi_pct:.1f}%)")
    
    # Check center pixel transparency
    center_alpha = img.getpixel((w // 2, h // 2))[3]
    center_color = img.getpixel((w // 2, h // 2))
    print(f"  Center pixel (alpha): {center_alpha}, color: {center_color}")
    print()
