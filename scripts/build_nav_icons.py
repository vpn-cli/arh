#!/usr/bin/env python3
"""
Build navigation icons from kitty-sheet.jpeg.
Pipeline:
1. Flood-fill background of the entire sheet to transparent (tolerance 100).
2. Cut into 12 equal cells (3 columns x 4 rows).
3. For the 7 specified icons:
   - Crop to bounding box of non-transparent pixels.
   - Pad to a square with ~6% margin.
   - Resize to 96x96 (LANCZOS).
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

def process_icons(filled_sheet, tolerance=100):
    width, height = filled_sheet.size
    col_width = width / 3.0
    row_height = height / 4.0

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    results = []

    for name, row, col, desc in NAV_ITEMS:
        x1 = int(round((col - 1) * col_width))
        x2 = int(round(col * col_width))
        y1 = int(round((row - 1) * row_height))
        y2 = int(round(row * row_height))

        cell = filled_sheet.crop((x1, y1, x2, y2))
        cw, ch = cell.size
        bbox = cell.getbbox()

        if bbox is None:
            results.append({
                "name": name,
                "desc": desc,
                "row": row,
                "col": col,
                "bbox": None,
                "bbox_size": (0, 0),
                "cell_size": (cw, ch),
                "opaque_pct": 0.0,
                "touches_edge": False,
                "touch_details": "empty",
                "icon_img": None
            })
            continue

        bx1, by1, bx2, by2 = bbox
        bw = bx2 - bx1
        bh = by2 - by1

        touches = []
        if bx1 == 0:
            touches.append("left")
        if by1 == 0:
            touches.append("top")
        if bx2 == cw:
            touches.append("right")
        if by2 == ch:
            touches.append("bottom")

        touches_edge = len(touches) > 0
        touch_str = ", ".join(touches) if touches else "no"

        cropped = cell.crop(bbox)
        alpha = cropped.split()[-1]
        opaque_count = sum(1 for a in alpha.tobytes() if a > 0)
        total_pixels = bw * bh
        opaque_pct = (opaque_count / total_pixels) * 100.0

        # Pad to a square with about 6% margin
        max_dim = max(bw, bh)
        margin = int(round(max_dim * 0.06))
        square_size = max_dim + 2 * margin
        square_img = Image.new("RGBA", (square_size, square_size), (0, 0, 0, 0))
        paste_x = (square_size - bw) // 2
        paste_y = (square_size - bh) // 2
        square_img.paste(cropped, (paste_x, paste_y))

        # Resize to 96x96 (LANCZOS)
        icon_96 = square_img.resize((96, 96), resample=Image.Resampling.LANCZOS)
        out_path = os.path.join(OUTPUT_DIR, f"{name}.png")
        icon_96.save(out_path)

        results.append({
            "name": name,
            "desc": desc,
            "row": row,
            "col": col,
            "bbox": bbox,
            "bbox_size": (bw, bh),
            "cell_size": (cw, ch),
            "opaque_pct": opaque_pct,
            "touches_edge": touches_edge,
            "touch_details": touch_str,
            "icon_img": icon_96,
            "out_path": out_path,
        })

    return results

def generate_preview_image(results, output_path):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    # 7 icons side by side
    icon_size = 96
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
