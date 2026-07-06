import os
import shutil
from PIL import Image, ImageDraw

brain_dir = r"C:\Users\Jonatan Agustín\.gemini\antigravity\brain\ab05ab45-a515-4bb6-bd98-976a4c3a6829"
draft_path = os.path.join(brain_dir, "customer_5_draft_1783252851945.png")

target_dirs = [
    r"public\assets\customers",
    r"src\assets\customers",
    brain_dir
]

def remove_white_bg(img, tolerance=40):
    img = img.convert("RGBA")
    w, h = img.size
    for corner in [(0,0), (w-1,0), (0,h-1), (w-1,h-1)]:
        r, g, b, a = img.getpixel(corner)
        if r > 200 and g > 200 and b > 200:
            ImageDraw.floodfill(img, corner, (255,255,255,0), thresh=tolerance)
    return img

def main():
    if not os.path.exists(draft_path):
        print(f"Error: Draft not found at {draft_path}")
        return

    print("Loading draft image...")
    img = Image.open(draft_path)
    
    print("Resizing to 256x256...")
    img_resized = img.resize((256, 256), Image.Resampling.LANCZOS)
    
    print("Removing white background...")
    img_transparent = remove_white_bg(img_resized, tolerance=45)
    
    # Save to all target locations
    for d in target_dirs:
        os.makedirs(d, exist_ok=True)
        save_path = os.path.join(d, "customer_5.png")
        img_transparent.save(save_path, "PNG")
        print(f"Saved: {save_path}")

    # Generate a grey-background check image for visual confirmation
    bg = Image.new("RGBA", img_transparent.size, (180, 180, 180, 255))
    bg.paste(img_transparent, mask=img_transparent.split()[3])
    check_path = os.path.join(brain_dir, "customer_5_check.png")
    bg.convert("RGB").save(check_path)
    print(f"Saved check image: {check_path}")

    print("\nGamer customer asset processed and saved successfully!")

if __name__ == "__main__":
    main()
