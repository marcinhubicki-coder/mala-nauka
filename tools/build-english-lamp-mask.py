"""Trace a UI clipping mask from the unchanged London source pixels.

The SVG is mask geometry, not replacement artwork. Its coordinate system must
remain identical to the 1170 x 2532 background. Requires Pillow, NumPy, SciPy.
"""
from collections import defaultdict
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

root = Path(__file__).resolve().parents[1]
source = root / 'assets/angielski/wizard-london-retina-v2.webp'
rgb = np.asarray(Image.open(source).convert('RGB'))
height, width = rgb.shape[:2]
assert (width, height) == (1170, 2532)
top, bottom, right = 1200, 1600, 112
red, green, blue = np.moveaxis(rgb[top:bottom, :right].astype(float), -1, 0)
metal = (np.maximum.reduce([red, green, blue]) < 180) & ~((green > red + 10) & (green > blue + 20))
glass = (red > blue + 20) & (red > green + 6) & (blue > 130)
highlights = (red > 220) & (green > 220) & (blue > 180) & (red > blue)
sky = (blue > red + 30) & (green > red + 15) & (blue > 155)
candidate = (metal | glass | highlights) & ~sky
labels, _ = ndimage.label(candidate)
component = labels[1520 - top, 35]
assert component != 0
mask = labels == component
# Fill tiny threshold pinholes while preserving real openings in the metalwork.
holes = ndimage.binary_fill_holes(mask) & ~mask
hole_labels, count = ndimage.label(holes)
for index in range(1, count + 1):
    hole = hole_labels == index
    if hole.sum() <= 12 and not np.any(hole & sky):
        mask |= hole

edges = defaultdict(list)
for y, x in zip(*np.where(mask)):
    sy = y + top
    if y == 0 or not mask[y - 1, x]: edges[(x, sy)].append((x + 1, sy))
    if x == right - 1 or not mask[y, x + 1]: edges[(x + 1, sy)].append((x + 1, sy + 1))
    if y == bottom - top - 1 or not mask[y + 1, x]: edges[(x + 1, sy + 1)].append((x, sy + 1))
    if x == 0 or not mask[y, x - 1]: edges[(x, sy + 1)].append((x, sy))

paths = []
while edges:
    start = next(iter(edges))
    point = start
    contour = [start]
    while True:
        following = edges[point].pop()
        if not edges[point]: del edges[point]
        contour.append(following)
        point = following
        if point == start: break
    simplified = []
    for index, point in enumerate(contour[:-1]):
        previous, following = contour[index - 1], contour[(index + 1) % (len(contour) - 1)]
        if index == 0 or not (previous[0] == point[0] == following[0] or previous[1] == point[1] == following[1]):
            simplified.append(point)
    paths.append('M' + 'L'.join(f'{x},{y}' for x, y in simplified) + 'Z')

destination = root / 'assets/angielski/wizard-lamp-mask-v3.svg'
destination.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" preserveAspectRatio="none"><path fill="white" fill-rule="evenodd" d="{"".join(paths)}"/></svg>\n')
print(f'{destination.name}: {mask.sum()} source pixels, {len(paths)} contours, {destination.stat().st_size} bytes')
assert not np.any(mask & sky)
