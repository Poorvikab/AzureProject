import io
import requests

payload = {'file': ('tiny.txt', b'hello world from upload test', 'text/plain')}
resp = requests.post('http://127.0.0.1:8000/api/documents/upload', files=payload, timeout=120)
print('DOC_STATUS', resp.status_code)
print(resp.text)

img = io.BytesIO()
from PIL import Image
img_obj = Image.new('RGB', (200, 200), color='red')
img_obj.save(img, format='PNG')
vision_payload = {'file': ('red_square.png', img.getvalue(), 'image/png')}
resp2 = requests.post('http://127.0.0.1:8000/api/vision/upload', files=vision_payload, timeout=120)
print('VISION_UPLOAD_STATUS', resp2.status_code)
print(resp2.text)
