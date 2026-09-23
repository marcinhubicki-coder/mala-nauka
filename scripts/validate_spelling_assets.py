"""Decode every referenced scene; checking filenames or HTTP 200 is insufficient.

Run: python -m pip install 'Pillow>=11.3,<13'
     python scripts/validate_spelling_assets.py
"""
import json
import re
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
registry = (ROOT / 'spelling/scenes.mjs').read_text()
assets = sorted(set(re.findall(r"asset:\s*'([^']+)'", registry)))
failures = []
# An integrated review batch must be wired, byte-for-byte intact and available offline.
batch_dir = ROOT / 'temp/ortografia-assets'
batch = json.loads((batch_dir / 'generated-map.json').read_text())
words = {word['word'] for path in (ROOT / 'data').glob('words-*.json')
         for word in json.loads(path.read_text())}
worker = (ROOT / 'sw.js').read_text()
uploaded = json.loads((ROOT / 'assets/scenes/uploaded-batch-v25.json').read_text())
generated = json.loads((ROOT / 'assets/scenes/generated-batch-v26.json').read_text())
for entry in uploaded['images'] + generated['images']:
    asset = entry['asset']
    for word in entry['words']:
        mapping = rf"\['{re.escape(word)}',\s*\{{[^}}]*asset:\s*'{re.escape(asset)}'"
        if word not in words or not re.search(mapping, registry):
            failures.append(f'{word}: uploaded image is not wired to an existing word')
    if f"'./assets/scenes/{asset}'" not in worker:
        failures.append(f'{asset}: uploaded image missing from offline cache')
if batch['status'].startswith('integrated'):
    for source, word in batch['files'].items():
        asset = Path(source).name
        mapping = rf"\['{re.escape(word)}',\s*\{{[^}}]*asset:\s*'{re.escape(asset)}'"
        if word not in words or not re.search(mapping, registry):
            failures.append(f'{word}: missing runtime word/scene mapping for {asset}')
        target = ROOT / 'assets/scenes' / asset
        if not target.exists() or target.read_bytes() != (batch_dir / source).read_bytes():
            failures.append(f'{asset}: runtime image differs from the prepared original')
        if f"'./assets/scenes/{asset}'" not in worker:
            failures.append(f'{asset}: missing from offline cache')
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
