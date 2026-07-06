import os
import math
import random
from PIL import Image, ImageDraw

# Target directory for current conversation artifacts
brain_dir = r"C:\Users\Jonatan Agustín\.gemini\antigravity\brain\ab05ab45-a515-4bb6-bd98-976a4c3a6829"

def get_organic_points(center_x, center_y, base_radius, noise_amp, seed):
    random.seed(seed)
    num_points = 64
    points = []
    # Combine low-frequency sine waves to distort the circle organically
    harmonics = [
        (3, random.uniform(-0.8, 0.8)),
        (4, random.uniform(-0.8, 0.8)),
        (5, random.uniform(-0.5, 0.5)),
    ]
    for i in range(num_points):
        theta = 2 * math.pi * i / num_points
        r = base_radius
        for freq, amp in harmonics:
            r += math.sin(freq * theta) * amp * noise_amp
        # Add very small high-frequency jitter for handmade clay look
        r += random.uniform(-1.5, 1.5)
        x = center_x + r * math.cos(theta)
        y = center_y + r * math.sin(theta)
        points.append((x, y))
    return points

def is_point_in_poly(x, y, poly):
    num = len(poly)
    j = num - 1
    c = False
    for i in range(num):
        if ((poly[i][1] > y) != (poly[j][1] > y)) and \
                (x < (poly[j][0] - poly[i][0]) * (y - poly[i][1]) / (poly[j][1] - poly[i][1]) + poly[i][0]):
            c = not c
        j = i
    return c

def create_dough_ball(name, config, seed):
    # Canvas size
    canvas_size = 512
    img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    
    # 1. Generate organic shape points
    center = canvas_size / 2
    # Base radius 180 so it fills most of the 512x512 canvas, leaving margin for outline and shift
    points = get_organic_points(center, center, 180, 25, seed)
    
    # 2. Create the mask for clipping
    mask = Image.new("L", (canvas_size, canvas_size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.polygon(points, fill=255)
    
    # 3. Create the content layer (fills, shadows, highlights)
    content = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    content_draw = ImageDraw.Draw(content)
    
    # A. Draw the shadow color everywhere in the shape
    content_draw.polygon(points, fill=config["shadow"])
    
    # B. Draw the main color shifted up-left by 22px to leave a bottom-right crescent shadow
    shift = 22
    shifted_points = [(x - shift, y - shift) for (x, y) in points]
    content_draw.polygon(shifted_points, fill=config["main"])
    
    # C. Draw oat flecks if it is oat dough
    if config.get("is_oat", False):
        random.seed(seed + 10)
        # We try to place flecks inside the shifted main body
        # Let's define the shifted bounding box area
        bbox_min = int(center - 130)
        bbox_max = int(center + 130)
        
        # Color palettes for flecks
        fleck_colors = [
            config["shadow"], # darker flecks
            (253, 251, 247, 255), # lighter flecks
        ]
        
        for _ in range(35):
            fx = random.randint(bbox_min, bbox_max)
            fy = random.randint(bbox_min, bbox_max)
            # Check if inside shifted points
            if is_point_in_poly(fx, fy, shifted_points):
                # Draw a tiny oat flake (oval/rectangle)
                fw = random.randint(6, 12)
                fh = random.randint(3, 6)
                angle = random.uniform(0, 360)
                
                # Create a temporary canvas for the single flake to rotate it
                flake_canvas = Image.new("RGBA", (30, 30), (0,0,0,0))
                flake_draw = ImageDraw.Draw(flake_canvas)
                f_color = random.choice(fleck_colors)
                flake_draw.ellipse([15 - fw//2, 15 - fh//2, 15 + fw//2, 15 + fh//2], fill=f_color)
                
                rotated = flake_canvas.rotate(angle, resample=Image.Resampling.BICUBIC)
                content.paste(rotated, (fx - 15, fy - 15), mask=rotated.split()[3])
    
    # D. Draw the highlight oval in the top-left area
    # Oval centered at ~ (center - 70, center - 70)
    hx = center - 80
    hy = center - 80
    hr_w = 45
    hr_h = 25
    
    # Temporary canvas to rotate the highlight slightly
    highlight_canvas = Image.new("RGBA", (150, 150), (0,0,0,0))
    hl_draw = ImageDraw.Draw(highlight_canvas)
    hl_draw.ellipse([75 - hr_w, 75 - hr_h, 75 + hr_w, 75 + hr_h], fill=config["highlight"])
    
    hl_rotated = highlight_canvas.rotate(45, resample=Image.Resampling.BICUBIC)
    # Paste highlight, ensuring it uses its own alpha
    content.paste(hl_rotated, (int(hx - 75), int(hy - 75)), mask=hl_rotated.split()[3])
    
    # 4. Mask the content layer using the original shape mask
    img.paste(content, mask=mask)
    
    # 5. Draw the thick outer outline on top
    img_draw = ImageDraw.Draw(img)
    img_draw.polygon(points, outline=config["outline"], width=12)
    
    # 6. Resize to 256x256 for optimal resolution
    final_img = img.resize((256, 256), Image.Resampling.LANCZOS)
    return final_img

def main():
    os.makedirs(brain_dir, exist_ok=True)
    
    configs = {
        "dough_classic": {
            "outline": (78, 54, 41, 255),    # #4e3629 (Dark Brown)
            "main": (245, 235, 224, 255),    # #f5ebe0 (Classic Warm Cream-Beige)
            "shadow": (213, 189, 175, 255),  # #d5bdaf (Warm Shading Beige)
            "highlight": (255, 255, 255, 140), # Semi-transparent white
            "is_oat": False
        },
        "dough_chocolate": {
            "outline": (53, 47, 68, 255),    # #352f44 (Very Dark Brown/Purple Accent)
            "main": (79, 18, 0, 255),        # #4f1200 (Chocolate Brown)
            "shadow": (61, 12, 0, 255),      # #3d0c00 (Darker Chocolate Shadow)
            "highlight": (122, 42, 22, 255),  # #7a2a16 (Warm Reddish Brown Highlight)
            "is_oat": False
        },
        "dough_oat": {
            "outline": (78, 54, 41, 255),    # #4e3629 (Dark Brown)
            "main": (213, 189, 175, 255),    # #d5bdaf (Oat Tan-Brown)
            "shadow": (183, 154, 135, 255),  # #b79a87 (Oat Shadow Tan)
            "highlight": (237, 224, 212, 180), # #ede0d4 (Oat Light highlight)
            "is_oat": True
        }
    }
    
    # Seeds chosen to give nice slightly varied organic shapes
    seeds = {
        "dough_classic": 42,
        "dough_chocolate": 105,
        "dough_oat": 2026
    }
    
    print("=== Generating Programmatic Dough Balls ===")
    for name, config in configs.items():
        try:
            # Generate the transparent PNG
            img = create_dough_ball(name, config, seeds[name])
            
            # Save transparent version
            final_path = os.path.join(brain_dir, f"{name}.png")
            img.save(final_path, "PNG")
            print(f"Generated and saved transparent: {final_path}")
            
            # Save check version (on gray background for easy user preview)
            bg = Image.new("RGBA", img.size, (180, 180, 180, 255))
            bg.paste(img, mask=img.split()[3])
            check_path = os.path.join(brain_dir, f"{name}_check.png")
            bg.convert("RGB").save(check_path)
            print(f"Generated and saved check: {check_path}")
            
        except Exception as e:
            print(f"ERROR generating {name}: {e}")
            import traceback
            traceback.print_exc()

    print("\nAll dough assets generated successfully!")

if __name__ == "__main__":
    main()
