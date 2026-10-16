#!/usr/bin/env python3
"""
Clip Hello Kitty sticker from assets-src/Hello kitty.jpeg.
Pipeline:
1. Load image and identify outer background.
2. Segment Hello Kitty (outline, face, eyes, whiskers, pink bow, yellow nose).
3. Apply color bleeding on edges to eliminate JPEG fringing.
4. Smooth alpha channel with Gaussian blur for clean anti-aliased edge.
5. Crop tightly to bounding box.
6. Export as high-resolution PNG and WebP assets to public/images and public/stickers.
"""

import os
from collections import deque
from PIL import Image, ImageFilter
import numpy as np
import scipy.ndimage as ndi

SRC_PATHS = [
    os.path.join("assets-src", "Hello kitty.jpeg"),
    os.path.join("assets-src", "Hello ktty.jpeg"),
]

def find_source():
    for p in SRC_PATHS:
        if os.path.exists(p):
            return p
    raise FileNotFoundError("Could not find Hello kitty source image in assets-src/")

def clip_hello_kitty():
    src = find_source()
    print(f"Loading source: {src}")
    img = Image.open(src).convert("RGB")
    arr = np.array(img)
    h, w, _ = arr.shape

    is_pink = (arr[:, :, 0] > 120) & (arr[:, :, 1] < 100) & (arr[:, :, 2] > 60)
    is_dark = (arr[:, :, 0] < 80) & (arr[:, :, 1] < 80) & (arr[:, :, 2] < 80)

    is_traversable = ~is_dark & ~is_pink
    visited = np.zeros((h, w), bool)
    q = deque([(0, 0), (0, w - 1), (h - 1, 0), (h - 1, w - 1)])
    for pt in q:
        visited[pt] = True

    while q:
        y, x = q.popleft()
        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx]:
                if is_traversable[ny, nx]:
                    visited[ny, nx] = True
                    q.append((ny, nx))

    hk_mask = (~visited) | is_dark | is_pink

    # Tight crop
    crop_box = Image.fromarray(hk_mask).getbbox()
    crop_rgb = arr[crop_box[1]:crop_box[3], crop_box[0]:crop_box[2]].copy()
    crop_m = hk_mask[crop_box[1]:crop_box[3], crop_box[0]:crop_box[2]]

    # Color bleeding at boundary to eliminate JPEG edge fringe
    ind = ndi.distance_transform_edt(~crop_m, return_distances=False, return_indices=True)
    bled_rgb = crop_rgb[ind[0], ind[1]]

    # Smooth alpha for clean edges
    alpha = Image.fromarray((crop_m.astype(np.uint8) * 255)).filter(ImageFilter.GaussianBlur(radius=0.6))
    result = Image.fromarray(np.dstack([bled_rgb, np.array(alpha)]))

    os.makedirs(os.path.join("public", "images"), exist_ok=True)
    os.makedirs(os.path.join("public", "stickers"), exist_ok=True)

    targets = [
        os.path.join("public", "images", "hello-kitty-header.png"),
        os.path.join("public", "images", "hello-kitty-header.webp"),
        os.path.join("public", "images", "hello-kitty.png"),
        os.path.join("public", "images", "hello-kitty.webp"),
        os.path.join("public", "stickers", "hello-kitty-header.png"),
        os.path.join("public", "stickers", "hello-kitty.png"),
    ]

    for target in targets:
        result.save(target)
        print(f"Saved: {target} ({result.size[0]}x{result.size[1]})")

if __name__ == "__main__":
    clip_hello_kitty()
