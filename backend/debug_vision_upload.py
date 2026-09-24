import sys, traceback, base64

sys.path.insert(0, r'C:\Users\Ashish Singla\Desktop\Smart Media Management\backend')

from app.services.vision_service import analyze_image
from app.services import openai_service, search_service

# 200x200 red PNG generated earlier in browser; base64 avoids a Pillow dependency.
png_b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAFcA6QAAAAAXNSR0IArs4c6AAAAAElFTkSuQmCC'
image_bytes = base64.b64decode(png_b64)

for name, fn, arg in [
    ('analyze', analyze_image, (image_bytes,)),
    ('embed', openai_service.embed_texts, (['hello world from image upload test'],)),
    ('index_check', search_service.ensure_index_exists, ()),
]:
    try:
        result = fn(*arg)
        print(name, 'OK', result if isinstance(result, (list, dict, str)) else type(result))
    except Exception:
        print('---', name, 'FAILED ---')
        traceback.print_exc()
