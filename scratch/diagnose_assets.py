"""
Diagnose why the shape/topping images look low-res in-game.
Check: actual file dimensions, content bounding box (trimmed area),
and what percentage of the canvas the actual drawing occupies.
"""
from PIL import Image, ImageChops
import os

assets_dir = r"public\assets\stations"

files = [
    "shape_star.png",
    "shape_heart.png",
    "shape_cat.png",
    "shape_fish.png",
    "topping_sprinkles.png",
    "topping_choco.png",
    "topping_glazing.png",
]

def get_content_bbox(img):
    """Get the bounding box of non-transparent content."""
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    alpha = img.split()[3]
    bbox = alpha.getbbox()  # Returns (left, upper, right, lower) of non-zero alpha
    return bbox

for fname in files:
    path = os.path.join(assets_dir, fname)
    if not os.path.exists(path):
        print(f"MISSING: {fname}")
        continue
    
    img = Image.open(path)
    w, h = img.size
    bbox = get_content_bbox(img)
    
    if bbox:
        content_w = bbox[2] - bbox[0]
        content_h = bbox[3] - bbox[1]
        usage_pct = (content_w * content_h) / (w * h) * 100
        
        is_topping = 'topping' in fname
        display_size = 84 if is_topping else 58
        scale_factor = display_size / w
        effective_content_px = min(content_w, content_h) * scale_factor
        
        print(f"{fname}:")
        print(f"  File size: {w}x{h}")
        print(f"  Content bbox: left={bbox[0]}, top={bbox[1]}, right={bbox[2]}, bottom={bbox[3]}")
        print(f"  Content size: {content_w}x{content_h}")
        print(f"  Canvas usage: {usage_pct:.1f}%")
        print(f"  At {display_size}px display, actual content is ~{effective_content_px:.0f}px")
        print()
    else:
        print(f"{fname}: FULLY TRANSPARENT (no content!)")
        print()
