"""
Crop transparent padding from shape/topping assets so the actual content 
fills the entire canvas. This maximizes the effective resolution when 
Phaser displays them at small sizes.
"""
from PIL import Image
import os

brain_dir = r"C:\Users\Jonatan Agustín\.gemini\antigravity\brain\fa180234-e6eb-4c98-97ce-4ce2d3743b2b"
dest_dir = r"src\assets\stations"

files = [
    "shape_star.png",
    "shape_heart.png",
    "shape_cat.png",
    "shape_fish.png",
    "topping_sprinkles.png",
    "topping_choco.png",
    "topping_glazing.png",
]

TARGET_SIZE = 512  # Output resolution

def crop_and_resize(src_path, dest_path, fname):
    img = Image.open(src_path).convert('RGBA')
    
    # Get bounding box of non-transparent content
    alpha = img.split()[3]
    bbox = alpha.getbbox()
    
    if not bbox:
        print(f"  SKIPPED {fname}: fully transparent")
        return
    
    # Add a small margin (4% of content size) to avoid clipping edges
    margin_x = int((bbox[2] - bbox[0]) * 0.04)
    margin_y = int((bbox[3] - bbox[1]) * 0.04)
    
    padded_bbox = (
        max(0, bbox[0] - margin_x),
        max(0, bbox[1] - margin_y),
        min(img.width, bbox[2] + margin_x),
        min(img.height, bbox[3] + margin_y),
    )
    
    # Crop to content
    cropped = img.crop(padded_bbox)
    crop_w, crop_h = cropped.size
    
    # Make it square by centering the content on a square canvas
    side = max(crop_w, crop_h)
    square = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    paste_x = (side - crop_w) // 2
    paste_y = (side - crop_h) // 2
    square.paste(cropped, (paste_x, paste_y))
    
    # Resize to target resolution with high-quality LANCZOS
    final = square.resize((TARGET_SIZE, TARGET_SIZE), Image.Resampling.LANCZOS)
    final.save(dest_path, "PNG")
    
    old_content_pct = (bbox[2]-bbox[0]) * (bbox[3]-bbox[1]) / (img.width * img.height) * 100
    print(f"  {fname}: cropped from {img.width}x{img.height} (content was {old_content_pct:.0f}% of canvas)")
    print(f"    Content {crop_w}x{crop_h} -> centered on {side}x{side} -> resized to {TARGET_SIZE}x{TARGET_SIZE}")
    print(f"    Content now fills ~100% of the canvas!")

def main():
    print("=== Cropping transparent padding from assets ===\n")
    
    for fname in files:
        src = os.path.join(brain_dir, fname)
        dest = os.path.join(dest_dir, fname)
        
        if not os.path.exists(src):
            # Try to read from the original 1024x1024 in brain
            print(f"  WARNING: {src} not found in brain dir, checking assets...")
            src = dest
            if not os.path.exists(src):
                print(f"  ERROR: {fname} not found anywhere!")
                continue
        
        crop_and_resize(src, dest, fname)
    
    print("\n=== Done! All assets now have content filling the full canvas ===")

if __name__ == "__main__":
    main()
