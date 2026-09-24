import sys, traceback, struct, zlib

sys.path.insert(0, r'C:\Users\Ashish Singla\Desktop\Smart Media Management\backend')

from app.services.vision_service import analyze_image
from app.services import openai_service

# Create a 200x200 solid red PNG entirely in pure Python to avoid Pillow.
width, height = 200, 200
raw = b''
for _ in range(height):
    row = b'\x00' + b'\xff\x00\x00' * width
    raw += row

def chunk(tag, data):
    return struct.pack('!I', len(data)) + tag + data + struct.pack('!I', zlib.crc32(tag + data) & 0xffffffff)

png = b'\x89PNG\r\n\x1a\n'
png += chunk(b'IHDR', struct.pack('!IIBBBBB', width, height, 8, 2, 0, 0, 0))
png += chunk(b'IDAT', zlib.compress(raw, 9))
png += chunk(b'IEND', b'')
image_bytes = png

for name, fn, arg in [
    ('analyze', analyze_image, (image_bytes,)),
    ('embed', openai_service.embed_texts, (['hello world from image upload test'],)),
]:
    try:
        result = fn(*arg)
        print(name, 'OK', result if isinstance(result, (list, dict, str)) else type(result))
    except Exception:
        print('---', name, 'FAILED ---')
        traceback.print_exc()
