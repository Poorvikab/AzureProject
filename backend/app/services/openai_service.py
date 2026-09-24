"""Azure OpenAI wrapper: embeddings (for indexing) + chat completion (for RAG answers)."""

from openai import AzureOpenAI
from app.config import settings


def _get_client() -> AzureOpenAI:
    settings.require("AZURE_OPENAI_ENDPOINT", "AZURE_OPENAI_KEY")
    return AzureOpenAI(
        api_key=settings.AZURE_OPENAI_KEY,
        api_version=settings.AZURE_OPENAI_API_VERSION,
        azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
    )


def chunk_text(text: str, max_words: int = 300, overlap_words: int = 50) -> list[str]:
    """Simple word-based chunking with overlap, good enough for a first RAG pass."""
    words = text.split()
    if not words:
        return []

    chunks = []
    start = 0
    while start < len(words):
        end = start + max_words
        chunks.append(" ".join(words[start:end]))
        start = end - overlap_words if end - overlap_words > start else end
    return chunks


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Returns one embedding vector per input text."""
    if not texts:
        return []
    client = _get_client()
    print(f">>> DEBUG endpoint: {settings.AZURE_OPENAI_ENDPOINT}")
    print(f">>> DEBUG api_version: {settings.AZURE_OPENAI_API_VERSION}")
    print(f">>> DEBUG deployment: {settings.AZURE_OPENAI_EMBEDDING_DEPLOYMENT}")
    try:
        response = client.embeddings.create(
            model=settings.AZURE_OPENAI_EMBEDDING_DEPLOYMENT,
            input=texts,
        )
        return [item.embedding for item in response.data]
    except Exception as e:
        print(f">>> DEBUG embed_texts FAILED: {type(e).__name__}: {e}")
        raise


def generate_answer(question: str, context_chunks: list[dict]) -> str:
    """
    context_chunks: list of {"content": str, "source": str}
    Builds a grounded prompt and asks the chat model to answer using ONLY the
    provided context, citing sources, and saying so if it can't find an answer.
    """
    client = _get_client()

    context_block = "\n\n".join(
        f"[Source: {c['source']}]\n{c['content']}" for c in context_chunks
    )

    system_prompt = (
        "You are a helpful assistant that answers questions ONLY using the "
        "provided context from the user's uploaded documents and images. "
        "If the context does not contain the answer, say you couldn't find "
        "that information in the uploaded content instead of guessing. "
        "Always mention which source(s) you used."
    )

    user_prompt = f"Context:\n{context_block}\n\nQuestion: {question}"

    response = client.chat.completions.create(
        model=settings.AZURE_OPENAI_CHAT_DEPLOYMENT,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.2,
    )

    return response.choices[0].message.content
