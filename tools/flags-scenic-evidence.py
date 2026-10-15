#!/usr/bin/env python3
"""Build review boards from one clean, successful scenic QA run.
Usage: python tools/flags-scenic-evidence.py INPUT OUTPUT
The source frames are left untouched; never mix frames from different runs.
"""
import argparse
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('input', type=Path)
parser.add_argument('output', type=Path)
args = parser.parse_args()
report = json.loads((args.input / 'report.json').read_text())
if report['passed'] != report['total']:
    raise SystemExit('Review boards require a completely passing source run.')
args.output.mkdir(parents=True, exist_ok=True)
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 17)


def board(name, items, columns=3, width=300, crop=None):
    opened = []
    for frame, label in items:
        im = Image.open(args.input / (frame + '.jpg')).convert('RGB')
        if crop:
            im = im.crop(tuple(round(v * im.width / 780) for v in crop))
        height = round(im.height * width / im.width)
        opened.append((im.resize((width, height), Image.Resampling.LANCZOS), label))
    height = max(im.height for im, _ in opened)
    gap, label_h = 14, 35
    rows = (len(items) + columns - 1) // columns
    out = Image.new('RGB', (columns * width + (columns + 1) * gap,
                            rows * (height + label_h) + (rows + 1) * gap), '#f3ecdd')
    draw = ImageDraw.Draw(out)
    for i, (im, label) in enumerate(opened):
        x = gap + (i % columns) * (width + gap)
        y = gap + (i // columns) * (height + label_h + gap)
        draw.text((x, y + 3), label, font=font, fill='#493a25')
        out.paste(im, (x, y + label_h))
    out.save(args.output / name, quality=91, optimize=True)


board('trzy-stany.jpg', [
    ('webkit-01-belarus-question', 'Pytanie'),
    ('webkit-02-belarus-correct', 'Poprawna odpowiedź'),
    ('webkit-03-belarus-wrong', 'Błędna odpowiedź')], width=340)
board('pergamin-klatki.jpg', [
    (f'webkit-{action}-{step}', f'{label} · {progress}%')
    for action, label in [('unroll', 'Otwieranie'), ('rollup', 'Składanie')]
    for step, progress in [('start', 6), ('middle', 47), ('end', 92)]], width=310)
board('atlas-atrament-klatki.jpg', [
    ('webkit-ink-pass-1', 'Rysowanie · 12%'),
    ('webkit-ink-pass-2', 'Rysowanie · 43%'),
    ('webkit-ink-pass-3', 'Rysowanie · 73%'),
    ('webkit-ink-pass-4', 'Rysowanie · 97%'),
    ('webkit-03-belarus-wrong', 'Gotowy atlas'),
    ('webkit-ink-erasing', 'Rozpuszczanie · 46%')], width=310, crop=(28, 285, 755, 995))
board('piasek-klatki.jpg', [
    ('webkit-sand-falling', 'Rozsypanie'),
    ('webkit-sand-settled', 'Kopczyki'),
    ('webkit-sand-forming', 'Nowe litery'),
    ('06-sand-next-webkit', 'Nowe pytanie')], columns=4, width=260)
board('geografia-i-ekrany.jpg', [
    ('webkit-04-poland-short', 'Polska · niski ekran'),
    ('webkit-05-swiss-max', 'Szwajcaria · 430 × 932'),
    ('webkit-07-liechtenstein', 'Liechtenstein'),
    ('webkit-08-vatican', 'Watykan'),
    ('webkit-09-long-country', 'Długi kraj · WebKit'),
    ('webkit-10-pwa-safe-area', 'PWA · safe area'),
    ('webkit-13-two-word-title', 'Cała Wielka Brytania'),
    ('webkit-14-two-word-title-short', 'Macedonia · niski ekran'),
    ('webkit-11-poland-mockup-wrong', 'Polska · obszar pod tytułem'),
    ('webkit-16-finland-north', 'Finlandia · cały kraj'),
    ('webkit-17-norway-north', 'Norwegia · cały kraj'),
    ('webkit-18-russia-wide', 'Rosja · szeroki kadr Europy')], width=300)
print(f'{report["passed"]}/{report["total"]}: review boards in {args.output}')
