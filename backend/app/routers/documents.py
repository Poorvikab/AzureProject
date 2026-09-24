"""
Upload + ingest documents: Blob Storage -> Document Intelligence -> chunk ->
embed (Azure OpenAI) -> index (Azure AI Search).
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services import storage_service, document_service, openai_service, search_service

router = APIRouter(prefix="/api/documents", tags=["documents"])

ALLOWED_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
}


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")

    file_bytes = await file.read()

    # 1. Store the raw file
    blob_info = storage_service.upload_file(file_bytes, file.filename, file.content_type)

    # 2. Extract text
    extracted = document_service.extract_text(file_bytes, file.content_type)

    # 3. Chunk + embed
    chunks = openai_service.chunk_text(extracted["full_text"])
    embeddings = []
    indexing_error = None
    try:
        if chunks:
            embeddings = openai_service.embed_texts(chunks)
    except Exception as exc:  # pragma: no cover - defensive fallback for Azure model issues
        indexing_error = str(exc)
        embeddings = []

    # 4. Index into Azure AI Search if embeddings are available
    indexed_count = 0
    if embeddings:
        try:
            search_service.ensure_index_exists()
            indexed_count = search_service.upload_chunks(
                chunks=chunks, embeddings=embeddings, filename=file.filename, source_type="document"
            )
        except Exception as exc:  # pragma: no cover - defensive fallback for Azure Search issues
            indexing_error = str(exc)
            indexed_count = 0

    result = {
        "filename": file.filename,
        "blob_url": blob_info["url"],
        "page_count": extracted["page_count"],
        "chunks_indexed": indexed_count,
    }
    if indexing_error:
        result["indexing_warning"] = indexing_error
    return result
