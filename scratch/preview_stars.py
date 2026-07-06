from PIL import Image
import os

assets = r'src\assets\cookies'
brain = r'C:\Users\Jonatan Agustín\.gemini\antigravity\brain\fa180234-e6eb-4c98-97ce-4ce2d3743b2b'

stars = ['cookie_star_classic_baked.png', 'cookie_star_chocolate_baked.png', 'cookie_star_oat_baked.png']
for fname in stars:
    src = os.path.join(assets, fname)
    img = Image.open(src).convert('RGBA')
    bg = Image.new('RGBA', img.size, (180, 180, 180, 255))
    bg.paste(img, mask=img.split()[3])
    out = os.path.join(brain, fname.replace('.png', '_check.png'))
    bg.convert('RGB').save(out)
    print('OK: ' + fname)
print('DONE')
