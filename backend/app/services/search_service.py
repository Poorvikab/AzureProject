"""Azure AI Search: index creation, uploading chunks with vectors, and hybrid search."""

import uuid
from azure.core.credentials import AzureKeyCredential
from azure.search.documents import SearchClient
from azure.search.documents.indexes import SearchIndexClient
from azure.search.documents.indexes.models import (
    SearchIndex,
    SimpleField,
    SearchableField,
    SearchFieldDataType,
    VectorSearch,
    VectorSearchProfile,
    HnswAlgorithmConfiguration,
    SearchField,
)
from azure.search.documents.models import VectorizedQuery
from app.config import settings

EMBEDDING_DIMENSIONS = 1536  # text-embedding-3-large; use 1536 if you deployed text-embedding-3-small


def _get_index_client() -> SearchIndexClient:
    settings.require("AZURE_SEARCH_ENDPOINT", "AZURE_SEARCH_KEY")
    return SearchIndexClient(
        endpoint=settings.AZURE_SEARCH_ENDPOINT,
        credential=AzureKeyCredential(settings.AZURE_SEARCH_KEY),
    )


def _get_search_client() -> SearchClient:
    settings.require("AZURE_SEARCH_ENDPOINT", "AZURE_SEARCH_KEY")
    return SearchClient(
        endpoint=settings.AZURE_SEARCH_ENDPOINT,
        index_name=settings.AZURE_SEARCH_INDEX_NAME,
        credential=AzureKeyCredential(settings.AZURE_SEARCH_KEY),
    )


def ensure_index_exists():
    """Creates the vector index if it doesn't already exist. Call once at startup."""
    index_client = _get_index_client()

    existing = [idx.name for idx in index_client.list_indexes()]
    if settings.AZURE_SEARCH_INDEX_NAME in existing:
        return

    fields = [
        SimpleField(name="id", type=SearchFieldDataType.String, key=True),
        SearchableField(name="content", type=SearchFieldDataType.String),
        SimpleField(name="filename", type=SearchFieldDataType.String, filterable=True),
        SimpleField(name="source_type", type=SearchFieldDataType.String, filterable=True),  # "document" | "image"
        SearchField(
            name="embedding",
            type=SearchFieldDataType.Collection(SearchFieldDataType.Single),
            searchable=True,
            vector_search_dimensions=EMBEDDING_DIMENSIONS,
            vector_search_profile_name="default-profile",
        ),
    ]

    vector_search = VectorSearch(
        algorithms=[HnswAlgorithmConfiguration(name="default-hnsw")],
        profiles=[
            VectorSearchProfile(name="default-profile", algorithm_configuration_name="default-hnsw")
        ],
    )

    index = SearchIndex(name=settings.AZURE_SEARCH_INDEX_NAME, fields=fields, vector_search=vector_search)
    index_client.create_index(index)


def upload_chunks(chunks: list[str], embeddings: list[list[float]], filename: str, source_type: str):
    """Pushes chunked+embedded content into the search index."""
    search_client = _get_search_client()

    documents = [
        {
            "id": str(uuid.uuid4()),
            "content": chunk,
            "filename": filename,
            "source_type": source_type,
            "embedding": vector,
        }
        for chunk, vector in zip(chunks, embeddings)
    ]

    if documents:
        search_client.upload_documents(documents=documents)

    return len(documents)


def vector_search(query_embedding: list[float], top_k: int = 5) -> list[dict]:
    """Runs a pure vector similarity search and returns matched chunks."""
    search_client = _get_search_client()

    vector_query = VectorizedQuery(vector=query_embedding, k_nearest_neighbors=top_k, fields="embedding")

    results = search_client.search(
        search_text=None,
        vector_queries=[vector_query],
        select=["id", "content", "filename", "source_type"],
    )

    return [
        {
            "id": r["id"],
            "content": r["content"],
            "filename": r["filename"],
            "source_type": r["source_type"],
            "score": r["@search.score"],
        }
        for r in results
    ]
