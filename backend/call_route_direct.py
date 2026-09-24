import asyncio
import sys
from fastapi import UploadFile

sys.path.insert(0, r'C:\Users\Ashish Singla\Desktop\Smart Media Management\backend')

from app.routers.documents import upload_document
from app.routers.vision import upload_image

async def test_doc():
    file = UploadFile(filename='tiny.txt', file=__import__('io').BytesIO(b'hello world from upload test'), headers={'content-type': 'text/plain'})
    return await upload_document(file)

async def test_img():
    import struct, zlib
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
    file = UploadFile(filename='red_square.png', file=__import__('io').BytesIO(png), headers={'content-type': 'image/png'})
    return await upload_image(file)

for name, fn in [('doc', test_doc), ('img', test_img)]:
    try:
        result = asyncio.run(fn())
        print(name, 'OK', result)
    except Exception as e:
        import traceback; traceback.print_exc()
        print(name, 'ERR', repr(e))
