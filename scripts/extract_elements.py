import os
import json
import numpy as np
from PIL import Image
from scipy.ndimage import binary_fill_holes, binary_opening, binary_closing, label, gaussian_filter

os.makedirs('public/images/elements', exist_ok=True)
img = Image.open('assets-src/elements.jpeg')
arr = np.array(img)
h_img, w_img, _ = arr.shape

elements = [
    {'id': 'bouquet_wrap', 'title': 'Tulip Bouquet Wrap', 'box': (5, 5, 235, 300), 'center': (105, 145)},
    {'id': 'bow_top_center', 'title': 'Pink Ribbon Bow', 'box': (220, 0, 460, 205), 'center': (340, 95)},
    {'id': 'bow_top_right', 'title': 'Pale Pink Bow', 'box': (460, 0, 720, 200), 'center': (590, 90)},
    {'id': 'envelope', 'title': 'Love Letter', 'box': (120, 90, 260, 285), 'center': (190, 190)},
    {'id': 'star_top_left', 'title': 'Pink Star (Top Left)', 'box': (230, 180, 330, 280), 'center': (275, 230)},
    {'id': 'star_top_right', 'title': 'Pink Star (Top Right)', 'box': (410, 120, 500, 215), 'center': (455, 165)},
    {
        'id': 'hearts_trio', 
        'title': 'Hearts Trio', 
        'box': (505, 205, 600, 385), 
        'center': (555, 290),
        'method': 'closing',
        'clear_rects': [((75, 95), (0, 35))]
    },
    {'id': 'bouquet_tulips', 'title': 'Tulip Bouquet Stems', 'box': (600, 150, 735, 390), 'center': (670, 260)},
    {'id': 'flower_blossom', 'title': 'Blossom Flower', 'box': (265, 200, 500, 440), 'center': (385, 315)},
    {'id': 'bow_thin', 'title': 'Dainty Pink Bow', 'box': (0, 280, 235, 520), 'center': (115, 380)},
    {'id': 'cherries', 'title': 'Sweet Cherries', 'box': (180, 350, 320, 505), 'center': (250, 425)},
    {
        'id': 'books_girly', 
        'title': 'Book Girly Stack', 
        'box': (335, 435, 500, 578), 
        'center': (415, 500),
        'method': 'closing'
    },
    {'id': 'lily', 'title': 'Pink Lily', 'box': (500, 395, 736, 595), 'center': (620, 490)},
    {'id': 'butterfly', 'title': 'Pink Butterfly', 'box': (0, 490, 265, 690), 'center': (125, 585)},
    {'id': 'star_mid_left', 'title': 'Pink Star (Mid Left)', 'box': (235, 510, 330, 605), 'center': (280, 555)},
    {'id': 'star_mid_lower', 'title': 'Pink Star (Mid Lower)', 'box': (225, 600, 330, 700), 'center': (275, 650)},
    {'id': 'flower_mid_1', 'title': 'Pink Watercolor Flower', 'box': (305, 580, 500, 775), 'center': (400, 675)},
    {'id': 'flower_mid_2', 'title': 'Pink Rose Blossom', 'box': (515, 580, 730, 800), 'center': (620, 685)},
    {'id': 'bow_satin', 'title': 'Large Satin Ribbon', 'box': (0, 680, 280, 940), 'center': (135, 795)},
    {'id': 'star_lower_right', 'title': 'Pink Star (Lower Right)', 'box': (450, 740, 560, 840), 'center': (505, 790)},
    {'id': 'star_bottom_left', 'title': 'Pink Star (Bottom Left)', 'box': (0, 915, 120, 1055), 'center': (55, 980)},
    {'id': 'book_rose', 'title': 'Vintage Book with Rose', 'box': (165, 900, 345, 1050), 'center': (255, 970)},
    {'id': 'camera', 'title': 'Instant Camera', 'box': (365, 870, 525, 1020), 'center': (445, 940)},
    {'id': 'daisy', 'title': 'Pink Daisy', 'box': (520, 820, 730, 1015), 'center': (625, 915)},
    {'id': 'seashell', 'title': 'Pearl Seashell with Bow', 'box': (15, 1030, 270, 1280), 'center': (140, 1150)},
    {'id': 'books_stack', 'title': 'Striped Ribbon Book Stack', 'box': (265, 1040, 475, 1240), 'center': (370, 1135)},
    {'id': 'moon', 'title': 'Pink Full Moon', 'box': (495, 1040, 730, 1275), 'center': (610, 1155)},
]

manifest = []

for el in elements:
    x1, y1, x2, y2 = el['box']
    crop = arr[y1:y2, x1:x2].copy()
    cx_rel = el['center'][0] - x1
    cy_rel = el['center'][1] - y1
    
    # Custom clear rects in local crop space
    for (rx1, rx2), (ry1, ry2) in el.get('clear_rects', []):
        crop[ry1:ry2, rx1:rx2] = [255, 255, 255]
    
    diff = np.max(np.abs(crop.astype(int) - 255), axis=2)
    
    if el.get('method') == 'closing':
        fg = diff > 4
        fg_processed = binary_closing(fg, iterations=3)
        fg_filled = binary_fill_holes(fg_processed)
        labeled, num_features = label(fg_filled)
        areas = [np.sum(labeled == i) for i in range(1, num_features+1)]
        largest_idx = np.argmax(areas) + 1
        mask = (labeled == largest_idx)
    else:
        fg = diff > 8
        fg_opened = binary_opening(fg, iterations=2)
        fg_filled = binary_fill_holes(fg_opened)
        labeled, num_features = label(fg_filled)
        if num_features == 0:
            print(f"No features for {el['id']}")
            continue
            
        best_label = 0
        min_dist = 99999999
        for l in range(1, num_features + 1):
            ys, xs = np.where(labeled == l)
            if len(ys) > 30:
                dist = np.min((ys - cy_rel)**2 + (xs - cx_rel)**2)
                if dist < min_dist:
                    min_dist = dist
                    best_label = l
                    
        mask = (labeled == best_label)
        mask = binary_closing(mask, iterations=2)
        mask = binary_fill_holes(mask)

    mask = mask.astype(float)
    mask_smooth = gaussian_filter(mask, sigma=0.8)
    mask_smooth = np.clip((mask_smooth - 0.2) / 0.6, 0.0, 1.0)
    alpha = (mask_smooth * 255).astype(np.uint8)
    
    vis_y, vis_x = np.where(alpha > 10)
    if len(vis_y) == 0:
        continue
    min_y = max(0, vis_y.min() - 2)
    max_y = min(crop.shape[0], vis_y.max() + 3)
    min_x = max(0, vis_x.min() - 2)
    max_x = min(crop.shape[1], vis_x.max() + 3)
    
    crop_trimmed = crop[min_y:max_y, min_x:max_x]
    alpha_trimmed = alpha[min_y:max_y, min_x:max_x]
    
    rgba = np.dstack([crop_trimmed, alpha_trimmed])
    out_img = Image.fromarray(rgba)
    filename = f"{el['id']}.png"
    out_path = os.path.join('public/images/elements', filename)
    out_img.save(out_path, format='PNG')
    
    w_out, h_out = out_img.size
    manifest.append({
        'id': el['id'],
        'title': el['title'],
        'src': f"/images/elements/{filename}",
        'width': w_out,
        'height': h_out,
        'aspectRatio': round(w_out / h_out, 3)
    })
    print(f"Processed {el['id']}: {w_out}x{h_out}")

# Create preview contact sheet
cols = 6
rows = (len(manifest) + cols - 1) // cols
cell_w, cell_h = 160, 160
canvas = Image.new('RGBA', (cols * cell_w, rows * cell_h), (12, 10, 21, 255))
for idx, item in enumerate(manifest):
    r = idx // cols
    c = idx % cols
    img_path = os.path.join('public', item['src'].lstrip('/'))
    el_img = Image.open(img_path).convert('RGBA')
    el_img.thumbnail((cell_w - 24, cell_h - 24), Image.Resampling.LANCZOS)
    x = c * cell_w + (cell_w - el_img.width) // 2
    y = r * cell_h + (cell_h - el_img.height) // 2
    canvas.alpha_composite(el_img, (x, y))

canvas.save('assets-src/extracted_preview.png')
with open('public/images/elements/manifest.json', 'w') as f:
    json.dump(manifest, f, indent=2)

print('Finished successfully! All 27 elements extracted.')
