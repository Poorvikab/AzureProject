import sys
import traceback

sys.path.insert(0, r'C:\Users\Ashish Singla\Desktop\Smart Media Management\backend')

from app.config import settings
from app.services import storage_service, document_service, openai_service, search_service

print('storage prefix', settings.AZURE_STORAGE_CONNECTION_STRING[:10])

for name, fn, arg in [
    ('blob', storage_service.upload_file, (b'hello', 'x.txt', 'text/plain')),
    ('doc', document_service.extract_text, (b'hello world',)),
    ('chunks', openai_service.chunk_text, ('hello world ' * 10,)),
    ('index', search_service.ensure_index_exists, ()),
]:
    try:
        result = fn(*arg)
        print(name, 'OK', result)
    except Exception:
        print('---', name, 'FAILED ---')
        traceback.print_exc()
