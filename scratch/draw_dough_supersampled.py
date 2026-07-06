import os
import math
import random
from PIL import Image, ImageDraw

brain_dir = r"C:\Users\Jonatan Agustín\.gemini\antigravity\brain\ab05ab45-a515-4bb6-bd98-976a4c3a6829"

def get_organic_points(center_x, center_y, base_radius, seed):
    # Fixed formula for a cute organic dough ball shape
    # We want it slightly squashed and organic
    random.seed(seed)
    num_points = 128
    points = []
    
    # Hand-tuned harmonics for a cute, slightly squashed dough ball
    # math.sin(3 * theta) * 35 -> soft 3-point bumps
    # math.cos(4 * theta) * 20 -> minor ripples
    # squashing: multiply Y-radius slightly to make it wider than tall, or vice versa
    for i in range(num_points):
        theta = 2 * math.pi * i / num_points
        r = base_radius + math.sin(3 * theta) * 35 + math.cos(4 * theta) * 20
        # Add a tiny bit of random variation
        r += random.uniform(-4, 4)
        
        # 1.05 horizontal stretch for a cute plump look
        x = center_x + (r * 1.05) * math.cos(theta)
        y = center_y * 0.98 + r * math.sin(theta)
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

def create_dough_ball_supersampled(name, config, seed):
    # Draw at 2048x2048 for supersampled antialiasing
    canvas_size = 2048
    img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    
    center = canvas_size / 2
    # Base radius 760 (out of 1024)
    points = get_organic_points(center, center, 740, seed)
    
    # Mask
    mask = Image.new("L", (canvas_size, canvas_size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.polygon(points, fill=255)
    
    # Content Layer
    content = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    content_draw = ImageDraw.Draw(content)
    
    # A. Draw the shadow color
    content_draw.polygon(points, fill=config["shadow"])
    
    # B. Draw the main color shifted up-left by 80px to leave a bottom-right crescent shadow
    shift = 80
    shifted_points = [(x - shift, y - shift) for (x, y) in points]
    content_draw.polygon(shifted_points, fill=config["main"])
    
    # C. Draw oat flecks if oat
    if config.get("is_oat", False):
        random.seed(seed + 10)
        bbox_min = int(center - 550)
        bbox_max = int(center + 550)
        
        fleck_colors = [
            config["shadow"],
            (253, 251, 247, 255),
        ]
        
        for _ in range(40):
            fx = random.randint(bbox_min, bbox_max)
            fy = random.randint(bbox_min, bbox_max)
            if is_point_in_poly(fx, fy, shifted_points):
                fw = random.randint(28, 48)
                fh = random.randint(12, 24)
                angle = random.uniform(0, 360)
                
                # Temporary canvas for single fleck
                flake_canvas = Image.new("RGBA", (120, 120), (0,0,0,0))
                flake_draw = ImageDraw.Draw(flake_canvas)
                f_color = random.choice(fleck_colors)
                flake_draw.ellipse([60 - fw//2, 60 - fh//2, 60 + fw//2, 60 + fh//2], fill=f_color)
                
                rotated = flake_canvas.rotate(angle, resample=Image.Resampling.BICUBIC)
                content.paste(rotated, (fx - 60, fy - 60), mask=rotated.split()[3])
    
    # D. Draw highlight oval
    hx = center - 320
    hy = center - 320
    hr_w = 180
    hr_h = 100
    
    highlight_canvas = Image.new("RGBA", (600, 600), (0,0,0,0))
    hl_draw = ImageDraw.Draw(highlight_canvas)
    hl_draw.ellipse([300 - hr_w, 300 - hr_h, 300 + hr_w, 300 + hr_h], fill=config["highlight"])
    
    hl_rotated = highlight_canvas.rotate(40, resample=Image.Resampling.BICUBIC)
    content.paste(hl_rotated, (int(hx - 300), int(hy - 300)), mask=hl_rotated.split()[3])
    
    # Paste content onto main image with mask
    img.paste(content, mask=mask)
    
    # E. Draw outline (width=48 downscales to 6px outline at 256x256)
    img_draw = ImageDraw.Draw(img)
    img_draw.polygon(points, outline=config["outline"], width=44)
    
    # Resize to 256x256 using Lanczos for perfect anti-aliasing
    final_img = img.resize((256, 256), Image.Resampling.LANCZOS)
    return final_img

def main():
    os.makedirs(brain_dir, exist_ok=True)
    
    configs = {
        "dough_classic": {
            "outline": (78, 54, 41, 255),    # #4e3629
            "main": (245, 235, 224, 255),    # #f5ebe0
            "shadow": (213, 189, 175, 255),  # #d5bdaf
            "highlight": (255, 255, 255, 140),
            "is_oat": False
        },
        "dough_chocolate": {
            "outline": (53, 47, 68, 255),    # #352f44
            "main": (79, 18, 0, 255),        # #4f1200
            "shadow": (61, 12, 0, 255),      # #3d0c00
            "highlight": (122, 42, 22, 255),  # #7a2a16
            "is_oat": False
        },
        "dough_oat": {
            "outline": (78, 54, 41, 255),    # #4e3629
            "main": (213, 189, 175, 255),    # #d5bdaf
            "shadow": (183, 154, 135, 255),  # #b79a87
            "highlight": (237, 224, 212, 180), # #ede0d4
            "is_oat": True
        }
    }
    
    # Slightly offset seeds
    seeds = {
        "dough_classic": 55,
        "dough_chocolate": 120,
        "dough_oat": 2030
    }
    
    print("=== Generating Supersampled Dough Balls ===")
    for name, config in configs.items():
        try:
            img = create_dough_ball_supersampled(name, config, seeds[name])
            
            # Save transparent version
            final_path = os.path.join(brain_dir, f"{name}.png")
            img.save(final_path, "PNG")
            print(f"Generated and saved transparent: {final_path}")
            
            # Save check version
            bg = Image.new("RGBA", img.size, (180, 180, 180, 255))
            bg.paste(img, mask=img.split()[3])
            check_path = os.path.join(brain_dir, f"{name}_check.png")
            bg.convert("RGB").save(check_path)
            print(f"Generated and saved check: {check_path}")
            
        except Exception as e:
            print(f"ERROR generating {name}: {e}")

    print("\nAll supersampled dough assets generated successfully!")

if __name__ == "__main__":
    main()
