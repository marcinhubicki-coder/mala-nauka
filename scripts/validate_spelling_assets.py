"""Decode every referenced scene; checking filenames or HTTP 200 is insufficient.

Run: python -m pip install 'Pillow>=11.3,<13'
     python scripts/validate_spelling_assets.py
"""
import re
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
registry = (ROOT / 'spelling/scenes.mjs').read_text()
assets = sorted(set(re.findall(r"asset:\s*'([^']+)'", registry)))
failures = []
for asset in assets:
    path = ROOT / 'assets/scenes' / asset
    try:
        with Image.open(path) as image:
            image.load()  # Detect truncated pixel data, not just a readable header.
            assert min(image.size) >= 720, f'image too small: {image.size}'
    except Exception as error:
        failures.append(f'{asset}: {error}')
if failures:
    raise SystemExit('\n'.join(failures))
print(f'OK: {len(assets)} scene images fully decoded.')
