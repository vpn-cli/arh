#!/usr/bin/env python3
"""
Build navigation icons from kitty-sheet.jpeg.
Pipeline:
1. Flood-fill background of the entire sheet to transparent (tolerance 100).
2. Cut into 12 equal cells (3 columns x 4 rows).
3. For the 7 specified icons:
   - Crop to bounding box of non-transparent pixels.
   - Pad to a square with ~6% margin.
   - Resize to 144x144 (LANCZOS).
   - Save to public/icons/nav/<name>.png.
4. Report bounding-box size, opaque pixel %, and edge-touch status.
5. Generate assets-src/nav-icons-preview.png on dark background and sidebar color.
"""

import os
import sys
from collections import deque
from PIL import Image, ImageDraw, ImageFont

SOURCE_IMAGE = os.path.join("assets-src", "kitty-sheet.jpeg")
OUTPUT_DIR = os.path.join("public", "icons", "nav")
PREVIEW_IMAGE = os.path.join("assets-src", "nav-icons-preview.png")

# Mapping (row, column, counting from 1):
NAV_ITEMS = [
    ("home", 2, 3, "mushroom"),
    ("playlists", 3, 2, "vinyl record"),
    ("mix", 4, 3, "cupcake"),
    ("vibes", 1, 3, "star"),
    ("library", 3, 1, "gift bag"),
    ("memories", 2, 2, "framed photo"),
    ("frequencies", 3, 3, "flip phone"),
]

def color_distance(c1, c2):
    return max(abs(c1[0] - c2[0]), abs(c1[1] - c2[1]), abs(c1[2] - c2[2]))

def flood_fill_sheet(img_rgba, tolerance=100):
    img = img_rgba.copy()
    data = img.load()
    width, height = img.size
    target = data[0, 0]

    # Seed fill from every border pixel
    border = []
    for x in range(width):
        border.append((x, 0))
        border.append((x, height - 1))
    for y in range(height):
        border.append((0, y))
        border.append((width - 1, y))

    visited = set()
    queue = deque()
    for pt in border:
        if pt not in visited and color_distance(data[pt[0], pt[1]], target) <= tolerance:
            visited.add(pt)
            queue.append(pt)

    while queue:
        x, y = queue.popleft()
        data[x, y] = (255, 255, 255, 0)

        for dx, dy in ((0, 1), (1, 0), (0, -1), (-1, 0)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < width and 0 <= ny < height:
                if (nx, ny) not in visited:
                    visited.add((nx, ny))
                    if color_distance(data[nx, ny], target) <= tolerance:
                        queue.append((nx, ny))

    return img

def label_connected_regions(filled_sheet):
    width, height = filled_sheet.size
    data = filled_sheet.load()
    visited = set()
    regions = []

    for y in range(height):
        for x in range(width):
            if (x, y) not in visited and data[x, y][3] > 0:
                region_pts = []
                queue = deque([(x, y)])
                visited.add((x, y))
                while queue:
                    cx, cy = queue.popleft()
                    region_pts.append((cx, cy))
                    for dx, dy in ((0, 1), (1, 0), (0, -1), (-1, 0)):
                        nx, ny = cx + dx, cy + dy
                        if 0 <= nx < width and 0 <= ny < height:
                            if (nx, ny) not in visited and data[nx, ny][3] > 0:
                                visited.add((nx, ny))
                                queue.append((nx, ny))
                regions.append(region_pts)

    return regions

def process_icons(filled_sheet, tolerance=100):
    width, height = filled_sheet.size
    col_width = width / 3.0
    row_height = height / 4.0
    data = filled_sheet.load()

    # 1. Label connected regions of opaque pixels across the WHOLE sheet
    regions = label_connected_regions(filled_sheet)

    # 2. Assign each region to the grid cell that contains its centre point
    cell_regions = {(r, c): [] for r in range(1, 5) for c in range(1, 4)}
    for reg in regions:
        min_rx = min(p[0] for p in reg)
        max_rx = max(p[0] for p in reg)
        min_ry = min(p[1] for p in reg)
        max_ry = max(p[1] for p in reg)

        center_x = (min_rx + max_rx) / 2.0
        center_y = (min_ry + max_ry) / 2.0

        cell_col = min(3, max(1, int(center_x // col_width) + 1))
        cell_row = min(4, max(1, int(center_y // row_height) + 1))

        cell_regions[(cell_row, cell_col)].append(reg)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    results = []

    # 3. For each of the 7 icons, crop to the combined bounding box of assigned regions
    for name, row, col, desc in NAV_ITEMS:
        regs = cell_regions.get((row, col), [])
        if not regs:
            results.append({
                "name": name,
                "desc": desc,
                "row": row,
                "col": col,
                "bbox": None,
                "bbox_size": (0, 0),
                "opaque_pct": 0.0,
                "touches_edge": False,
                "touch_details": "empty",
                "icon_img": None
            })
            continue

        all_pts = [p for reg in regs for p in reg]
        min_x = min(p[0] for p in all_pts)
        max_x = max(p[0] for p in all_pts) + 1
        min_y = min(p[1] for p in all_pts)
        max_y = max(p[1] for p in all_pts) + 1

        bw = max_x - min_x
        bh = max_y - min_y

        # Crop to combined bounding box, keeping only pixels belonging to assigned regions
        cropped = Image.new("RGBA", (bw, bh), (0, 0, 0, 0))
        crop_data = cropped.load()
        for (px, py) in all_pts:
            crop_data[px - min_x, py - min_y] = data[px, py]

        # Check if the combined bounding box touches sheet or cell boundaries
        touches_sheet = (min_x == 0 or min_y == 0 or max_x == width or max_y == height)
        touch_str = "yes" if touches_sheet else "no"

        opaque_count = len(all_pts)
        total_pixels = bw * bh
        opaque_pct = (opaque_count / total_pixels) * 100.0

        # 4. Pad to a square with about 6% margin
        max_dim = max(bw, bh)
        margin = int(round(max_dim * 0.06))
        square_size = max_dim + 2 * margin
        square_img = Image.new("RGBA", (square_size, square_size), (0, 0, 0, 0))
        paste_x = (square_size - bw) // 2
        paste_y = (square_size - bh) // 2
        square_img.paste(cropped, (paste_x, paste_y))

        # Resize to 144x144 (LANCZOS)
        icon_144 = square_img.resize((144, 144), resample=Image.Resampling.LANCZOS)
        out_path = os.path.join(OUTPUT_DIR, f"{name}.png")
        icon_144.save(out_path)

        results.append({
            "name": name,
            "desc": desc,
            "row": row,
            "col": col,
            "bbox": (min_x, min_y, max_x, max_y),
            "bbox_size": (bw, bh),
            "opaque_pct": opaque_pct,
            "touches_edge": touches_sheet,
            "touch_details": touch_str,
            "icon_img": icon_144,
            "out_path": out_path,
        })

    return results

def generate_preview_image(results, output_path):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    # 7 icons side by side
    icon_size = 144
    num_icons = len(results)
    padding = 24
    header_height = 36
    panel_content_height = icon_size + 30
    panel_height = header_height + panel_content_height

    total_width = padding * 2 + num_icons * icon_size + (num_icons - 1) * padding
    total_height = padding + panel_height + padding + panel_height + padding

    # Color definitions
    # Dark background: #20233F (project's --color-dark)
    color_dark_bg = (32, 35, 63)
    # Sidebar color: color-mix(in srgb, #FFF3D8 8%, white) ~ #FFFEFC / soft warm cream #FAF7F4
    color_sidebar_bg = (250, 247, 244)
    canvas_bg = (22, 24, 40)

    preview = Image.new("RGBA", (total_width, total_height), canvas_bg)
    draw = ImageDraw.Draw(preview)

    font = ImageFont.load_default()

    panels = [
        ("Dark Background (#20233F) - Checks for white fringes / edges", color_dark_bg, (255, 255, 255), padding),
        ("Sidebar Background (#FAF7F4) - Checks for transparent holes", color_sidebar_bg, (32, 35, 63), padding + panel_height + padding),
    ]

    for title, panel_bg, text_color, panel_y in panels:
        # Draw panel background
        panel_rect = [padding // 2, panel_y, total_width - padding // 2, panel_y + panel_height]
        draw.rounded_rectangle(panel_rect, radius=12, fill=panel_bg)

        # Draw panel title
        draw.text((padding, panel_y + 10), title, fill=text_color, font=font)

        # Place icons
        for idx, item in enumerate(results):
            ix = padding + idx * (icon_size + padding)
            iy = panel_y + header_height + 4
            icon_img = item["icon_img"]
            if icon_img:
                preview.paste(icon_img, (ix, iy), icon_img)

            # Draw icon name below
            name_text = item["name"]
            bbox_t = draw.textbbox((0, 0), name_text, font=font)
            tw = bbox_t[2] - bbox_t[0]
            tx = ix + (icon_size - tw) // 2
            ty = iy + icon_size + 4
            draw.text((tx, ty), name_text, fill=text_color, font=font)

    preview.save(output_path)
    print(f"Preview saved to {output_path}")

def main():
    if not os.path.exists(SOURCE_IMAGE):
        print(f"Error: Source image not found at {SOURCE_IMAGE}")
        sys.exit(1)

    print(f"Loading source sheet: {SOURCE_IMAGE}")
    raw_sheet = Image.open(SOURCE_IMAGE).convert("RGBA")
    print(f"Sheet dimensions: {raw_sheet.size}")

    tolerance = 100
    print(f"Running flood fill at tolerance {tolerance}...")
    filled_sheet = flood_fill_sheet(raw_sheet, tolerance=tolerance)

    print("Processing 7 navigation icons...")
    results = process_icons(filled_sheet, tolerance=tolerance)

    # Check if any icon is under 45% opaque
    under_45 = [item for item in results if item["opaque_pct"] < 45.0]
    if under_45:
        names = ", ".join(item["name"] for item in under_45)
        print(f"Warning: Icons under 45% opaque detected at tolerance {tolerance}: {names}")
        print("Rerunning at tolerance 60...")
        tolerance = 60
        filled_sheet = flood_fill_sheet(raw_sheet, tolerance=tolerance)
        results = process_icons(filled_sheet, tolerance=tolerance)
    else:
        print(f"All icons >= 45% opaque at tolerance {tolerance}.")

    # Generate preview
    generate_preview_image(results, PREVIEW_IMAGE)

    # Print report
    print("\n" + "=" * 80)
    print(f"NAV ICONS EXTRACTION REPORT (Tolerance: {tolerance})")
    print("=" * 80)
    for r in results:
        bw, bh = r["bbox_size"]
        pct = r["opaque_pct"]
        touches = r["touch_details"]
        print(f"Icon: {r['name']:<12} ({r['desc']})")
        print(f"  Grid Cell:      Row {r['row']}, Col {r['col']}")
        print(f"  Pre-resize BBox: {bw}x{bh} px (coords: {r['bbox']})")
        print(f"  Opaque Pixels:  {pct:.1f}%")
        print(f"  Touches Edge:   {touches}")
        print("-" * 80)

if __name__ == "__main__":
    main()
