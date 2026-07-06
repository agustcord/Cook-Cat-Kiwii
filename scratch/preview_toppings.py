from PIL import Image
import os

brain = r'C:\Users\Jonatan Agustín\.gemini\antigravity\brain\fa180234-e6eb-4c98-97ce-4ce2d3743b2b'

toppings = ['topping_choco.png', 'topping_glazing.png', 'topping_sprinkles.png']
for fname in toppings:
    src = os.path.join(brain, fname)
    if os.path.exists(src):
        img = Image.open(src).convert('RGBA')
        bg = Image.new('RGBA', img.size, (180, 180, 180, 255))
        bg.paste(img, mask=img.split()[3])
        out = os.path.join(brain, fname.replace('.png', '_check.png'))
        bg.convert('RGB').save(out)
        print('OK: ' + fname)
    else:
        print('FALTA: ' + fname)
print('DONE')
