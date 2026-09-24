from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.vision_service import analyze_image
from app.services import storage_service, openai_service, search_service

router = APIRouter(prefix="/api/vision", tags=["vision"])

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/gif", "image/bmp"}
MAX_FILE_SIZE_MB = 4


@router.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    """Analyze only — does not store or index. Useful for quick testing."""
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file.content_type}'. "
            f"Allowed: {', '.join(ALLOWED_CONTENT_TYPES)}",
        )

    image_bytes = await file.read()

    size_mb = len(image_bytes) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({size_mb:.1f} MB). Max is {MAX_FILE_SIZE_MB} MB.",
        )

    result = await analyze_image(image_bytes)

    return {
        "filename": file.filename,
        "caption": result["caption"],
        "tags": result["tags"],
        "ocr_text": result["ocr_text"],
    }


@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")

    image_bytes = await file.read()
    size_mb = len(image_bytes) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(status_code=400, detail=f"File too large ({size_mb:.1f} MB). Max is {MAX_FILE_SIZE_MB} MB.")

    try:
        blob_info = storage_service.upload_file(image_bytes, file.filename, file.content_type)
    except Exception as exc:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Blob upload failed: {type(exc).__name__}: {exc}")

    try:
        analysis = await analyze_image(image_bytes)
    except HTTPException:
        raise
    except Exception as exc:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Vision analysis failed: {type(exc).__name__}: {exc}")

    searchable_text = (
        f"Image caption: {analysis['caption']}\n"
        f"Tags: {', '.join(analysis['tags'])}\n"
        f"Text found in image: {analysis['ocr_text']}"
    ).strip()

    chunks = openai_service.chunk_text(searchable_text) or [searchable_text]
    embeddings = []
    indexing_error = None
    try:
        if chunks:
            embeddings = openai_service.embed_texts(chunks)
    except Exception as exc:
        indexing_error = str(exc)
        embeddings = []

    indexed_count = 0
    if embeddings:
        try:
            search_service.ensure_index_exists()
            indexed_count = search_service.upload_chunks(
                chunks=chunks, embeddings=embeddings, filename=file.filename, source_type="image"
            )
        except Exception as exc:
            indexing_error = str(exc)
            indexed_count = 0

    result = {
        "filename": file.filename,
        "blob_url": blob_info["url"],
        "caption": analysis["caption"],
        "tags": analysis["tags"],
        "chunks_indexed": indexed_count,
    }
    if indexing_error:
        result["indexing_warning"] = indexing_error
    return result
