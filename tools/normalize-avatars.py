#!/usr/bin/env python3
"""Build twelve consistent, circular 384x384 WebP avatars from approved atlases.
Requires Pillow. Do not change artwork: crop, center and resample only.
"""
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'assets' / 'brand'
OUTPUT = SOURCE / 'avatars'

def build():
    OUTPUT.mkdir(exist_ok=True)
    first = Image.open(SOURCE / 'player-avatars-3d.webp').convert('RGBA')
    extra = Image.open(SOURCE / 'player-avatars-extra-v1.webp').convert('RGBA')
    assert first.size == extra.size == (1254, 1254), "Unexpected avatar sprite size"
    for n, letter in enumerate('abcdefghijkl'):
        if n < 4:
            col, row = n % 2, n // 2
            image = first.crop((col*627, row*627, col*627+627, row*627+627))
            image = image.resize((384, 384), Image.Resampling.LANCZOS)
        else:
            j = n - 4
            col, row = j % 4, j // 4
            cx, cy, size = 157 + 313.5 * col, 474 + 337 * row, 336
            image = extra.crop((round(cx-size/2), round(cy-size/2),
                                round(cx+size/2), round(cy+size/2)))
            image = image.resize((384, 384), Image.Resampling.LANCZOS)
            mask = Image.new('L', (384, 384), 0)
            draw = ImageDraw.Draw(mask)
            radius = 164 / 336 * 384
            draw.ellipse((192-radius, 192-radius, 192+radius, 192+radius), fill=255)
            mask = mask.filter(ImageFilter.GaussianBlur(0.8))
            image.putalpha(ImageChops.multiply(image.getchannel('A'), mask))
        # Matches the original two-step production pipeline: re-encode, then
        # recenter on the visible circular border without stretching faces.
        intermediary = OUTPUT / (letter + '.webp')
        image.save(intermediary, 'WEBP', quality=91, method=6, exact=True)
        image = Image.open(intermediary).convert('RGBA')
        bbox = image.getchannel('A').point(lambda value: 255 if value > 40 else 0).getbbox()
        if not bbox:
            raise ValueError('Empty avatar ' + letter)
        left, top, right, bottom = bbox
        scale = 352 / max(right-left, bottom-top)
        image = image.resize((round(384*scale), round(384*scale)), Image.Resampling.LANCZOS)
        output = Image.new('RGBA', (384, 384), (0, 0, 0, 0))
        shift_x = round(192 - (left+right)/2 * scale)
        shift_y = round(192 - (top+bottom)/2 * scale)
        output.alpha_composite(image, (shift_x, shift_y))
        output.save(intermediary, 'WEBP', quality=91, method=6, exact=True)
        # Final high-quality, web-efficient delivery.
        output = Image.open(intermediary).convert('RGBA')
        output.save(intermediary, 'WEBP', quality=83, method=6)
        assert Image.open(intermediary).size == (384, 384)
        print(letter, intermediary.stat().st_size)

if __name__ == '__main__':
    build()
