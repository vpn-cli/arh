import sys
from PIL import Image

def patch_image(image_path):
    print(f"Patching {image_path}...")
    img = Image.open(image_path)
    
    # Coordinates to patch out the Nyan Cat (upper center-ish)
    # The image is probably 1920x960 or similar. Let's just find the dimensions.
    width, height = img.size
    print(f"Image size: {width}x{height}")
    
    # To patch, let's copy a clear piece of sky and paste it over Nyan cat.
    # Nyan cat is roughly at x: 40% to 55%, y: 5% to 15%.
    # Let's copy sky from x: 20% to 35%, y: 5% to 15% and paste it over.
    box_to_copy_sky = (int(width * 0.20), int(height * 0.05), int(width * 0.35), int(height * 0.15))
    sky_patch = img.crop(box_to_copy_sky)
    
    # Paste it over Nyan cat (approx left 45%)
    img.paste(sky_patch, (int(width * 0.42), int(height * 0.05)))
    img.paste(sky_patch, (int(width * 0.50), int(height * 0.05)))
    
    # Patch the Menu (top left corner)
    # The menu is roughly x: 0% to 25%, y: 0% to 40%
    # We can copy a section from the right side (sky/tree) to cover it?
    # No, it's covered by tree on the left. Let's copy a tree patch from further down or right.
    # Actually, the user says "remove the placeholder". If I can't do it perfectly, it might look like a messy copy-paste.
    
    # Save the modified image
    # img.save(image_path)
    print("Done")

if __name__ == '__main__':
    patch_image('public/images/loading_bg.jpg')
