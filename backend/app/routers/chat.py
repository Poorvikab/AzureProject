"""RAG chat: embed question -> vector search -> grounded answer -> save to Cosmos DB."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.dependencies import get_current_user
from app.services import openai_service, search_service, cosmos_service

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatRequest(BaseModel):
    question: str
    user_id: str = "demo-user"          # swap for real auth'd user id once auth is wired up
    conversation_id: str = "default"
    top_k: int = 5


@router.post("/query")
async def query(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"] if current_user else request.user_id
    if request.user_id and request.user_id != "demo-user" and request.user_id != user_id:
        user_id = request.user_id

    # 1. Embed the question
    query_embedding = openai_service.embed_texts([request.question])[0]

    # 2. Retrieve relevant chunks — restricted to this user's own document
    document_id = f"{user_id}-active-doc"
    matches = search_service.vector_search(
        query_embedding, top_k=request.top_k, document_id=document_id
    )

    # 3. Generate a grounded answer
    context_chunks = [{"content": m["content"], "source": m["filename"]} for m in matches]
    answer = openai_service.generate_answer(request.question, context_chunks)

    sources = list({m["filename"] for m in matches})

    # 4. Save the turn to Cosmos DB
    cosmos_service.save_turn(
        user_id=user_id,
        conversation_id=request.conversation_id,
        question=request.question,
        answer=answer,
        sources=sources,
    )

    return {
        "answer": answer,
        "sources": sources,
        "matches": matches,
    }


@router.get("/history/{user_id}/{conversation_id}")
async def get_history(user_id: str, conversation_id: str):
    return cosmos_service.get_conversation(user_id, conversation_id)


@router.get("/history/recent/{user_id}")
async def get_recent(user_id: str, limit: int = 10):
    return cosmos_service.list_recent(user_id, limit)