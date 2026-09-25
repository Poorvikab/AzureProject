"""
Voice-to-voice: user uploads an audio recording of their question ->
speech-to-text -> RAG pipeline (same as /api/chat/query) -> text-to-speech ->
returns question text, answer text, and the spoken answer as base64 audio,
all in one JSON response.
"""

import base64
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from app.dependencies import get_current_user
from app.services import speech_service, openai_service, search_service, cosmos_service

router = APIRouter(prefix="/api/voice", tags=["voice"])


@router.post("/ask")
async def voice_ask(
    file: UploadFile = File(...),
    user_id: str | None = Form(None),
    conversation_id: str = Form("default"),
    current_user: dict = Depends(get_current_user),
):
    audio_bytes = await file.read()
    resolved_user_id = current_user["id"] if current_user else (user_id or "demo-user")

    # Step 1: speech -> text
    question_text = await speech_service.speech_to_text(
        audio_bytes, content_type=file.content_type
    )

    if not question_text or not question_text.strip():
        raise HTTPException(
            status_code=422,
            detail="Could not detect any speech in the recording. Please try again and speak clearly.",
        )

    # Step 2: text -> RAG answer (same pipeline as /api/chat/query)
    query_embedding = openai_service.embed_texts([question_text])[0]

    # Restricted to this user's own document, same as the chat route
    document_id = f"{resolved_user_id}-active-doc"
    matches = search_service.vector_search(
        query_embedding, top_k=5, document_id=document_id
    )
    context_chunks = [
        {"content": m["content"], "source": m["filename"]} for m in matches
    ]
    answer_text = openai_service.generate_answer(question_text, context_chunks)

    sources = list({m["filename"] for m in matches})
    cosmos_service.save_turn(resolved_user_id, conversation_id, question_text, answer_text, sources)

    # Step 3: text -> speech
    audio_answer = await speech_service.text_to_speech(answer_text)
    audio_b64 = base64.b64encode(audio_answer).decode("ascii")

    return {
        "question": question_text,
        "answer": answer_text,
        "audio_base64": audio_b64,
        "sources": sources,
    }