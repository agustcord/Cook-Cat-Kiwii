from PIL import Image
import os

assets = r'src\assets\cookies'
brain = r'C:\Users\Jonatan Agustín\.gemini\antigravity\brain\fa180234-e6eb-4c98-97ce-4ce2d3743b2b'

# Solo las que el usuario generó (heart, cat, fish baked)
targets = [
    'cookie_heart_classic_baked.png',
    'cookie_heart_chocolate_baked.png',
    'cookie_heart_oat_baked.png',
    'cookie_cat_classic_baked.png',
    'cookie_cat_chocolate_baked.png',
    'cookie_cat_oat_baked.png',
    'cookie_fish_classic_baked.png',
    'cookie_fish_chocolate_baked.png',
    'cookie_fish_oat_baked.png',
]

# Fondo gris claro para ver la transparencia
BG_COLOR = (200, 200, 200, 255)

for fname in targets:
    src = os.path.join(assets, fname)
    if not os.path.exists(src):
        print(f'FALTA: {fname}')
        continue
    img = Image.open(src).convert('RGBA')
    bg = Image.new('RGBA', img.size, BG_COLOR)
    bg.paste(img, mask=img.split()[3])
    out_name = fname.replace('.png', '_check.png')
    out_path = os.path.join(brain, out_name)
    bg.convert('RGB').save(out_path)
    # Chequear transparencia: contar pixeles transparentes
    arr = list(img.getdata())
    transparent = sum(1 for p in arr if p[3] < 10)
    total = len(arr)
    print(f'OK: {fname} — {transparent}/{total} px transparentes ({100*transparent//total}%)')

print('DONE')
