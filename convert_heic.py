import os
import sys
import subprocess

try:
    from PIL import Image
    import pillow_heif
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow", "pillow-heif"])
    from PIL import Image
    import pillow_heif

def convert_heic_to_jpg(directory):
    for root, _, files in os.walk(directory):
        for file in files:
            if file.lower().endswith('.heic'):
                heic_path = os.path.join(root, file)
                jpg_path = os.path.splitext(heic_path)[0] + '.jpg'
                
                print(f"Converting: {heic_path} -> {jpg_path}")
                
                # Register HEIF opener
                pillow_heif.register_heif_opener()
                
                try:
                    img = Image.open(heic_path)
                    img.save(jpg_path, "JPEG")
                    print(f"Success: {jpg_path}")
                except Exception as e:
                    print(f"Failed to convert {heic_path}: {e}")

if __name__ == "__main__":
    public_arh = os.path.join(os.path.dirname(__file__), "public", "arh")
    convert_heic_to_jpg(public_arh)
    print("Done!")
