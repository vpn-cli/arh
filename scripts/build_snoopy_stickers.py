#!/usr/bin/env python3
"""
Build Snoopy sticker icons from snoopy.jpeg.
Pipeline:
1. Flood-fill background of the entire sheet to transparent from the borders.
2. Label connected regions of opaque pixels across the whole sheet.
3. Assign each region to its corresponding sticker (4 rows of 4, then 1 row of 3).
4. For each sticker:
   - Crop to bounding box of sticker pixels.
   - Soften edge slightly to hide JPEG fringe and defringe white boundary.
   - Resize to 160px on the long side (LANCZOS).
   - Save to public/stickers/snoopy-v1/<position>.png (r1c1 to r5c3).
5. Report bounding-box size, resized size, opaque pixel %, and edge-touch status.
"""

import os
import sys
from collections import deque
from PIL import Image, ImageFilter
import numpy as np
import scipy.ndimage as ndi

SOURCE_IMAGE = os.path.join("assets-src", "snoopy.jpeg")
OUTPUT_DIR = os.path.join("public", "stickers", "snoopy-v1")

# Descriptions for the 19 stickers (rows 1-4: 4 cols each, row 5: 3 cols)
STICKER_DESCS = {
    "r1c1": "sitting happily",
    "r1c2": "with woodstock",
    "r1c3": "happy dance",
    "r1c4": "big bow",
    "r2c1": "chef / cooking",
    "r2c2": "reading book",
    "r2c3": "walking with bag",
    "r2c4": "flying ace helmet",
    "r3c1": "waving",
    "r3c2": "hugging heart",
    "r3c3": "drinking cup",
    "r3c4": "sunglasses cool joe",
    "r4c1": "eating donut",
    "r4c2": "detective magnifying glass",
    "r4c3": "sleeping on doghouse",
    "r4c4": "party hat and cake",
    "r5c1": "hugging pillow",
    "r5c2": "scooter",
    "r5c3": "asleep on the moon",
}


def color_distance(c1, c2):
    return max(abs(int(c1[0]) - int(c2[0])), abs(int(c1[1]) - int(c2[1])), abs(int(c1[2]) - int(c2[2])))


def flood_fill_background(raw_rgb, tolerance=45):
    """
    Flood-fill only from the sheet edges so outer white becomes transparent,
    while white inside stickers remains untouched.
    """
    data = np.array(raw_rgb)
    h, w = data.shape[:2]
    target = np.array([255, 255, 255], dtype=int)
    diff = np.max(np.abs(data.astype(int) - target), axis=-1)
    is_bg = diff <= tolerance

    visited = np.zeros((h, w), dtype=bool)
    q = deque()

    for x in range(w):
        if is_bg[0, x]:
            visited[0, x] = True
            q.append((0, x))
        if is_bg[h - 1, x]:
            visited[h - 1, x] = True
            q.append((h - 1, x))

    for y in range(h):
        if is_bg[y, 0] and not visited[y, 0]:
            visited[y, 0] = True
            q.append((y, 0))
        if is_bg[y, w - 1] and not visited[y, w - 1]:
            visited[y, w - 1] = True
            q.append((y, w - 1))

    while q:
        cy, cx = q.popleft()
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and is_bg[ny, nx]:
                visited[ny, nx] = True
                q.append((ny, nx))

    fg_mask = ~visited
    return data, fg_mask


def label_connected_regions(fg_mask):
    """Find all connected regions of non-background pixels."""
    h, w = fg_mask.shape
    visited_fg = np.zeros((h, w), dtype=bool)
    regions = []

    for y in range(h):
        for x in range(w):
            if fg_mask[y, x] and not visited_fg[y, x]:
                reg = []
                rq = deque([(y, x)])
                visited_fg[y, x] = True
                while rq:
                    cy, cx = rq.popleft()
                    reg.append((cx, cy))
                    for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                        ny, nx = cy + dy, cx + dx
                        if 0 <= ny < h and 0 <= nx < w and fg_mask[ny, nx] and not visited_fg[ny, nx]:
                            visited_fg[ny, nx] = True
                            rq.append((ny, nx))
                regions.append(reg)

    return regions


def group_regions_into_stickers(regions, width, height):
    """
    Separate into 19 primary sticker regions and attach nearby accessory/accent
    regions (<25px distance). Map each to its grid cell (r1c1 to r5c3).
    """
    regions.sort(key=len, reverse=True)
    large_19 = regions[:19]
    small_regs = regions[19:]

    stickers = {}
    row_height = height / 5.0

    for reg in large_19:
        min_x = min(p[0] for p in reg)
        max_x = max(p[0] for p in reg)
        min_y = min(p[1] for p in reg)
        max_y = max(p[1] for p in reg)
        cx = (min_x + max_x) / 2.0
        cy = (min_y + max_y) / 2.0

        r = min(5, max(1, int(cy // row_height) + 1))
        num_cols = 3 if r == 5 else 4
        col_width = width / float(num_cols)
        c = min(num_cols, max(1, int(cx // col_width) + 1))

        pos = f"r{r}c{c}"

        m = np.zeros((height, width), dtype=bool)
        for p in reg:
            m[p[1], p[0]] = True
        dmap = ndi.distance_transform_edt(~m)

        stickers[pos] = {
            "pos": pos,
            "row": r,
            "col": c,
            "pts": list(reg),
            "dmap": dmap,
            "desc": STICKER_DESCS.get(pos, ""),
        }

    # Attach small components to nearest sticker if within 25px
    for s_reg in small_regs:
        best_dist = 999999
        best_pos = None
        for pos, s_data in stickers.items():
            dmap = s_data["dmap"]
            min_d = min(dmap[p[1], p[0]] for p in s_reg)
            if min_d < best_dist:
                best_dist = min_d
                best_pos = pos

        if best_dist < 25.0 and best_pos:
            stickers[best_pos]["pts"].extend(s_reg)

    return stickers


def process_sticker(pos_data, rgb_data, width, height, target_long_side=160):
    """
    Crop sticker to bounding box, soften edge to remove JPEG fringe,
    and resize to target_long_side on the long side.
    """
    all_pts = pos_data["pts"]
    min_x = min(p[0] for p in all_pts)
    max_x = max(p[0] for p in all_pts) + 1
    min_y = min(p[1] for p in all_pts)
    max_y = max(p[1] for p in all_pts) + 1

    touches_sheet = (min_x == 0 or min_y == 0 or max_x == width or max_y == height)
    bw = max_x - min_x
    bh = max_y - min_y

    # Add 2px margin around bounding box for edge softening falloff
    pad = 2
    crop_x0 = max(0, min_x - pad)
    crop_y0 = max(0, min_y - pad)
    crop_x1 = min(width, max_x + pad)
    crop_y1 = min(height, max_y + pad)

    crop_h = crop_y1 - crop_y0
    crop_w = crop_x1 - crop_x0

    crop_rgb = rgb_data[crop_y0:crop_y1, crop_x0:crop_x1].copy()
    crop_mask = np.zeros((crop_h, crop_w), dtype=bool)
    for (px, py) in all_pts:
        crop_mask[py - crop_y0, px - crop_x0] = True

    # Color bleeding: propagate sticker edge color into 1-2 border background pixels
    # so feathered alpha never blends with white JPEG artifacts
    ind = ndi.distance_transform_edt(~crop_mask, return_distances=False, return_indices=True)
    bled_rgb = crop_rgb[ind[0], ind[1]]

    # Edge softening: Gaussian blur on alpha channel
    alpha_img = Image.fromarray((crop_mask.astype(np.uint8) * 255)).filter(ImageFilter.GaussianBlur(radius=0.75))
    alpha_arr = np.array(alpha_img)

    rgba_img = Image.fromarray(np.dstack([bled_rgb, alpha_arr]))

    # Crop tightly to non-zero alpha pixels
    alpha_box = rgba_img.getbbox()
    if alpha_box:
        rgba_img = rgba_img.crop(alpha_box)

    orig_w, orig_h = rgba_img.size
    long_side = max(orig_w, orig_h)
    scale = float(target_long_side) / float(long_side)
    new_w = int(round(orig_w * scale))
    new_h = int(round(orig_h * scale))

    resized = rgba_img.resize((new_w, new_h), resample=Image.Resampling.LANCZOS)

    opaque_count = len(all_pts)
    total_pixels = bw * bh
    opaque_pct = (opaque_count / total_pixels) * 100.0

    return {
        "pos": pos_data["pos"],
        "desc": pos_data["desc"],
        "row": pos_data["row"],
        "col": pos_data["col"],
        "bbox": (min_x, min_y, max_x, max_y),
        "bbox_size": (bw, bh),
        "resized_size": (new_w, new_h),
        "opaque_pct": opaque_pct,
        "touches_edge": touches_sheet,
        "touch_details": "yes" if touches_sheet else "no",
        "image": resized,
    }


def main():
    if not os.path.exists(SOURCE_IMAGE):
        print(f"Error: Source image not found at {SOURCE_IMAGE}")
        sys.exit(1)

    print(f"Loading source sheet: {SOURCE_IMAGE}")
    raw_img = Image.open(SOURCE_IMAGE).convert("RGB")
    width, height = raw_img.size
    print(f"Sheet dimensions: {width}x{height}")

    tolerance = 45
    print(f"Running outer background flood fill at tolerance {tolerance}...")
    rgb_data, fg_mask = flood_fill_background(raw_img, tolerance=tolerance)

    print("Labeling connected regions...")
    regions = label_connected_regions(fg_mask)
    print(f"Found {len(regions)} regions. Grouping into 19 stickers...")
    stickers = group_regions_into_stickers(regions, width, height)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    results = []

    # Process all 19 stickers in row/col order
    expected_order = [
        f"r{r}c{c}" for r in range(1, 6) for c in range(1, 4 if r == 5 else 5)
    ]

    for pos in expected_order:
        s_data = stickers.get(pos)
        if not s_data:
            print(f"Warning: Sticker {pos} not found!")
            continue

        res = process_sticker(s_data, rgb_data, width, height, target_long_side=160)
        out_path = os.path.join(OUTPUT_DIR, f"{pos}.png")
        res["image"].save(out_path)
        res["out_path"] = out_path
        results.append(res)

    print("\n" + "=" * 80)
    print(f"SNOOPY STICKERS EXTRACTION REPORT (Tolerance: {tolerance})")
    print("=" * 80)
    for r in results:
        bw, bh = r["bbox_size"]
        rw, rh = r["resized_size"]
        pct = r["opaque_pct"]
        touches = r["touch_details"]
        print(f"Sticker: {r['pos']:<6} ({r['desc']})")
        print(f"  Grid Cell:      Row {r['row']}, Col {r['col']}")
        print(f"  Pre-resize BBox: {bw}x{bh} px (coords: {r['bbox']})")
        print(f"  Resized Size:   {rw}x{rh} px (long side: {max(rw, rh)}px)")
        print(f"  Opaque Pixels:  {pct:.1f}%")
        print(f"  Touches Edge:   {touches}")
        print(f"  Output:         {r['out_path']}")
        print("-" * 80)

    print(f"\nAll 19 stickers extracted to {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
