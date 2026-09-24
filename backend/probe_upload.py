import requests

# document upload
files = {'file': ('tiny.txt', b'hello world from upload test', 'text/plain')}
r = requests.post('http://127.0.0.1:8000/api/documents/upload', files=files, timeout=120)
print('DOC', r.status_code)
print(r.text)

# image upload
canvas = b'\x89PNG\r\n\x1a\n' + b'\x00'  # placeholder to force server-side validation, not used
# Build a valid 200x200 red PNG in pure python and post it.
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

files2 = {'file': ('red_square.png', png, 'image/png')}
r2 = requests.post('http://127.0.0.1:8000/api/vision/upload', files=files2, timeout=120)
print('IMG', r2.status_code)
print(r2.text)
