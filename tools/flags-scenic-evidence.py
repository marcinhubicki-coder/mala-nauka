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
parser.add_argument('--engine', choices=['chromium', 'webkit'], default='webkit')
args = parser.parse_args()
engine = args.engine
report = json.loads((args.input / 'report.json').read_text())
if report['passed'] != report['total']:
    raise SystemExit('Review boards require a completely passing source run.')
args.output.mkdir(parents=True, exist_ok=True)
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 17)


def board(name, items, columns=3, width=300, crop=None):
    opened = []
    for frame, label in items:
        path = args.input / (frame + '.jpg')
        if engine == 'chromium' and not path.exists() and frame.startswith('chromium-'):
            path = args.input / (frame.removeprefix('chromium-') + '.jpg')
        im = Image.open(path).convert('RGB')
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
    (f'{engine}-01-belarus-question', 'Pytanie'),
    (f'{engine}-02-belarus-correct', 'Poprawna odpowiedź'),
    (f'{engine}-03-belarus-wrong', 'Błędna odpowiedź')], width=340)
board('pergamin-klatki.jpg', [
    (f'{engine}-{action}-{step}', f'{label} · {progress}%')
    for action, label in [('unroll', 'Otwieranie'), ('rollup', 'Składanie')]
    for step, progress in [('start', 6), ('middle', 47), ('end', 92)]], width=310)
board('atlas-atrament-klatki.jpg', [
    (f'{engine}-ink-pass-1', 'Rysowanie · 12%'),
    (f'{engine}-ink-pass-2', 'Rysowanie · 43%'),
    (f'{engine}-ink-pass-3', 'Rysowanie · 73%'),
    (f'{engine}-ink-pass-4', 'Rysowanie · 97%'),
    (f'{engine}-03-belarus-wrong', 'Gotowy atlas'),
    (f'{engine}-ink-erasing', 'Rozpuszczanie · 46%')], width=310, crop=(28, 300, 755, 1060))
board('piasek-klatki.jpg', [
    (f'{engine}-sand-falling', 'Rozsypanie'),
    (f'{engine}-sand-settled', 'Kopczyki'),
    (f'{engine}-sand-forming', 'Nowe litery'),
    (f'06-sand-next-{engine}', 'Nowe pytanie')], columns=4, width=260)
board('geografia-i-ekrany.jpg', [
    (f'{engine}-04-poland-short', 'Polska · niski ekran'),
    (f'{engine}-05-swiss-max', 'Szwajcaria · 430 × 932'),
    (f'{engine}-07-liechtenstein', 'Liechtenstein'),
    (f'{engine}-08-vatican', 'Watykan'),
    (f'{engine}-09-long-country', 'Długi kraj · WebKit'),
    (f'{engine}-10-pwa-safe-area', 'PWA · safe area'),
    (f'{engine}-13-two-word-title', 'Cała Wielka Brytania'),
    (f'{engine}-14-two-word-title-short', 'Macedonia · niski ekran'),
    (f'{engine}-11-poland-mockup-wrong', 'Polska · obszar pod tytułem'),
    (f'{engine}-16-finland-north', 'Finlandia · cały kraj'),
    (f'{engine}-17-norway-north', 'Norwegia · cały kraj'),
    (f'{engine}-18-russia-wide', 'Rosja · szeroki kadr Europy')], width=300)
print(f'{report["passed"]}/{report["total"]}: review boards in {args.output}')

board('typografia.jpg', [(f'{engine}-12-poland-mockup-correct', 'Polska · 36 px'), (f'{engine}-21-swiss-title', 'Szwajcaria · 34 px'), (f'{engine}-07-liechtenstein', 'Liechtenstein · 30 px'), (f'{engine}-19-bosnia-title', 'Bośnia · 30 px'), (f'{engine}-20-macedonia-title', 'Macedonia · 30 px')], columns=5, width=250)
board('dwa-kadry.jpg', [(f'{engine}-atlas-full-europe', 'Cała Europa'), (f'{engine}-atlas-near', 'Kraj i jego otoczenie'), (f'{engine}-19-bosnia-title', 'Nagłówek na dwa wiersze')], width=340)
