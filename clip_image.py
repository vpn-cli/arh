from PIL import Image

def remove_background(input_path, output_path, tolerance=100):
    img = Image.open(input_path).convert("RGBA")
    data = img.load()
    width, height = img.size
    
    target = data[0, 0]
    
    queue = [(0, 0), (width-1, 0), (0, height-1), (width-1, height-1)]
    visited = set(queue)
    
    def color_distance(c1, c2):
        return max(abs(c1[0]-c2[0]), abs(c1[1]-c2[1]), abs(c1[2]-c2[2]))
    
    while queue:
        x, y = queue.pop(0)
        
        data[x, y] = (255, 255, 255, 0)
        
        for dx, dy in [(0, 1), (1, 0), (0, -1), (-1, 0)]:
            nx, ny = x + dx, y + dy
            if 0 <= nx < width and 0 <= ny < height:
                if (nx, ny) not in visited:
                    visited.add((nx, ny))
                    if color_distance(data[nx, ny], target) <= tolerance:
                        queue.append((nx, ny))
                        
    img.save(output_path)

remove_background("public/hampter/hello Kitty.jpeg", "public/hampter/hello_kitty_pin.png")
