# Smart Media Analysis Agent — Backend

## Setup
```bash
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # then fill in every key from the Azure Portal (see below)
uvicorn app.main:app --reload
```

Server: http://localhost:8000
Swagger docs: http://localhost:8000/docs

## Where to find each key in the Azure Portal

| Service | Resource | Where |
|---|---|---|
| Vision | sma-vision-service | Resource > Keys and Endpoint |
| Document Intelligence | sma-doc-intelligence | Resource > Keys and Endpoint |
| Azure OpenAI | smaopenai | Resource > Keys and Endpoint. Deployment names come from Azure AI Foundry > Deployments |
| Azure AI Search | sma-search-service | Resource > Keys (use "Primary admin key") |
| Blob Storage | smamediastorage | Resource > Access keys > Connection string |
| Speech | sma-speech-service | Resource > Keys and Endpoint (region is the region code, e.g. koreacentral, not a URL) |
| Cosmos DB | sma-cosmos-db | Resource > Keys > URI + Primary Key |

## Endpoints

- `POST /api/documents/upload` — upload PDF/DOCX/TXT, extracts text, chunks, embeds, indexes
- `POST /api/vision/upload` — upload image, analyzes + chunks + embeds + indexes (full RAG pipeline)
- `POST /api/vision/analyze` — upload image, just returns caption/tags/OCR (no storage/indexing — for quick testing)
- `POST /api/chat/query` — ask a text question, get a grounded RAG answer with sources
- `GET /api/chat/history/{user_id}/{conversation_id}` — full conversation history
- `GET /api/chat/history/recent/{user_id}` — recent Q&A across all conversations
- `POST /api/voice/ask` — upload a voice recording (WAV), get back a spoken audio answer (STT -> RAG -> TTS)

## Test it

```bash
# Upload a document
curl -X POST http://localhost:8000/api/documents/upload -F "file=@test.pdf"

# Upload an image
curl -X POST http://localhost:8000/api/vision/upload -F "file=@photo.jpg"

# Ask a question
curl -X POST http://localhost:8000/api/chat/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What does the report say about Q3 revenue?"}'

# Voice question (needs a 16kHz mono WAV file)
curl -X POST http://localhost:8000/api/voice/ask \
  -F "file=@question.wav" \
  --output answer.mp3
```

## Notes
- `EMBEDDING_DIMENSIONS` in `app/services/search_service.py` is set to 3072 for
  `text-embedding-3-large`. If you deployed `text-embedding-3-small` instead,
  change it to 1536.
- The search index is auto-created on first document/image upload — no manual
  index setup needed in the portal.
- `user_id` is currently a placeholder string (`"demo-user"`) passed from the
  frontend. Wire this up to real auth once you build the Auth page.
