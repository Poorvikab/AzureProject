"""Azure AI Search: index management, chunk upload/delete, and vector query."""

from azure.search.documents import SearchClient
from azure.search.documents.indexes import SearchIndexClient
from azure.core.credentials import AzureKeyCredential
from azure.search.documents.models import VectorizedQuery
from app.config import settings

INDEX_NAME = "media-knowledge-index"


def _get_search_client() -> SearchClient:
    settings.require("AZURE_SEARCH_ENDPOINT", "AZURE_SEARCH_KEY")
    return SearchClient(
        endpoint=settings.AZURE_SEARCH_ENDPOINT,
        index_name=INDEX_NAME,
        credential=AzureKeyCredential(settings.AZURE_SEARCH_KEY),
    )


def _get_index_client() -> SearchIndexClient:
    settings.require("AZURE_SEARCH_ENDPOINT", "AZURE_SEARCH_KEY")
    return SearchIndexClient(
        endpoint=settings.AZURE_SEARCH_ENDPOINT,
        credential=AzureKeyCredential(settings.AZURE_SEARCH_KEY),
    )


def ensure_index_exists():
    """Index already exists in the portal — safe no-op."""
    pass


def delete_chunks_by_document_id(document_id: str):
    """Deletes all existing chunks for a given document_id before re-indexing."""
    client = _get_search_client()
    results = client.search(
        search_text="*",
        filter=f"document_id eq '{document_id}'",
        select=["id"],
    )
    ids_to_delete = [{"id": r["id"]} for r in results]
    if ids_to_delete:
        client.delete_documents(documents=ids_to_delete)


def upload_chunks(chunks: list[str], embeddings: list[list[float]], filename: str,
                   source_type: str, document_id: str) -> int:
    """Uploads chunks + their embeddings, tagged with document_id, into the index."""
    client = _get_search_client()

    docs = []
    for i, (chunk_text, embedding) in enumerate(zip(chunks, embeddings)):
        docs.append({
            "id": f"{document_id}-{i}",
            "content": chunk_text,
            "embedding": embedding,
            "filename": filename,
            "source_type": source_type,
            "document_id": document_id,
        })

    if not docs:
        return 0

    result = client.upload_documents(documents=docs)
    return sum(1 for r in result if r.succeeded)


def vector_search(query_embedding: list[float], top_k: int, document_id: str) -> list[dict]:
    """Vector search restricted to a single user's active document."""
    client = _get_search_client()

    vector_query = VectorizedQuery(
        vector=query_embedding,
        k_nearest_neighbors=top_k,
        fields="embedding",
    )

    results = client.search(
        search_text=None,
        vector_queries=[vector_query],
        filter=f"document_id eq '{document_id}'",
        select=["content", "filename", "document_id"],
    )
    return [dict(r) for r in results]