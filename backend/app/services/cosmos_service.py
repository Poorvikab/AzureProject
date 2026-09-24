"""Cosmos DB: stores conversation history (questions, answers, sources, timestamps)."""

import uuid
import datetime
from azure.cosmos import CosmosClient
from app.config import settings


def _get_container():
    settings.require("AZURE_COSMOS_URI", "AZURE_COSMOS_KEY")
    client = CosmosClient(settings.AZURE_COSMOS_URI, credential=settings.AZURE_COSMOS_KEY)
    database = client.get_database_client(settings.AZURE_COSMOS_DATABASE)
    return database.get_container_client(settings.AZURE_COSMOS_CONTAINER)


def save_turn(user_id: str, conversation_id: str, question: str, answer: str, sources: list[str]):
    container = _get_container()
    item = {
        "id": str(uuid.uuid4()),
        "userId": user_id,
        "conversationId": conversation_id,
        "question": question,
        "answer": answer,
        "sources": sources,
        "timestamp": datetime.datetime.utcnow().isoformat(),
    }
    container.upsert_item(item)
    return item


def get_conversation(user_id: str, conversation_id: str) -> list[dict]:
    container = _get_container()
    query = (
        "SELECT * FROM c WHERE c.userId = @userId AND c.conversationId = @conversationId "
        "ORDER BY c.timestamp ASC"
    )
    params = [
        {"name": "@userId", "value": user_id},
        {"name": "@conversationId", "value": conversation_id},
    ]
    items = list(container.query_items(query=query, parameters=params, partition_key=user_id))
    return items


def list_recent(user_id: str, limit: int = 10) -> list[dict]:
    container = _get_container()
    query = "SELECT TOP @limit * FROM c WHERE c.userId = @userId ORDER BY c.timestamp DESC"
    params = [
        {"name": "@userId", "value": user_id},
        {"name": "@limit", "value": limit},
    ]
    items = list(container.query_items(query=query, parameters=params, partition_key=user_id))
    return items
