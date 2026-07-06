from PIL import Image
import os

assets = r'src\assets\cookies'
brain = r'C:\Users\Jonatan Agustín\.gemini\antigravity\brain\fa180234-e6eb-4c98-97ce-4ce2d3743b2b\preview'
os.makedirs(brain, exist_ok=True)

files = [f for f in os.listdir(assets) if 'baked' in f and f.endswith('.png')]
for fname in sorted(files):
    img = Image.open(os.path.join(assets, fname)).convert('RGBA')
    bg = Image.new('RGBA', img.size, (255, 255, 255, 255))
    bg.paste(img, mask=img.split()[3])
    out = os.path.join(brain, fname.replace('.png', '_preview.png'))
    bg.convert('RGB').save(out)
    print('OK: ' + fname)
print('DONE')
