from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.services import storage_service, document_service, openai_service, search_service

router = APIRouter(prefix="/api/documents", tags=["documents"])

ALLOWED_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
}


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    user_id: str = Form("demo-user"),   # same default/pattern as ChatRequest.user_id
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")

    file_bytes = await file.read()

    # 1. Store the raw file, tied to this user
    blob_info = storage_service.upload_file(file_bytes, file.filename, file.content_type, user_id=user_id)
    document_id = blob_info["document_id"]

    # 2. Extract text
    extracted = document_service.extract_text(file_bytes, file.content_type)

    # 3. Chunk + embed
    chunks = openai_service.chunk_text(extracted["full_text"])
    embeddings = []
    indexing_error = None
    try:
        if chunks:
            embeddings = openai_service.embed_texts(chunks)
    except Exception as exc:
        indexing_error = str(exc)
        embeddings = []

    # 4. Remove old chunks for this document, then index the new ones
    indexed_count = 0
    if embeddings:
        try:
            search_service.ensure_index_exists()
            search_service.delete_chunks_by_document_id(document_id)
            indexed_count = search_service.upload_chunks(
                chunks=chunks,
                embeddings=embeddings,
                filename=file.filename,
                source_type="document",
                document_id=document_id,
            )
        except Exception as exc:
            indexing_error = str(exc)
            indexed_count = 0

    result = {
        "filename": file.filename,
        "blob_url": blob_info["url"],
        "document_id": document_id,
        "page_count": extracted["page_count"],
        "chunks_indexed": indexed_count,
    }
    if indexing_error:
        result["indexing_warning"] = indexing_error
    return result