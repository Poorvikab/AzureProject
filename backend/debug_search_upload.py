import sys, traceback

sys.path.insert(0, r'C:\Users\Ashish Singla\Desktop\Smart Media Management\backend')

from app.services import search_service

vectors = [[0.0] * 1536]
try:
    print(search_service.upload_chunks(['hello world'], vectors, 'x.txt', 'document'))
except Exception:
    traceback.print_exc()
