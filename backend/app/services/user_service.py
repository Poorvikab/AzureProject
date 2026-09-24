"""Cosmos DB operations for user accounts (separate container from conversations)."""

import uuid
import datetime
from azure.cosmos import CosmosClient
from app.config import settings


def _get_container():
    settings.require("AZURE_COSMOS_URI", "AZURE_COSMOS_KEY")
    client = CosmosClient(settings.AZURE_COSMOS_URI, credential=settings.AZURE_COSMOS_KEY)
    database = client.get_database_client(settings.AZURE_COSMOS_DATABASE)
    return database.get_container_client(settings.AZURE_COSMOS_USERS_CONTAINER)


def get_user_by_email(email: str) -> dict | None:
    container = _get_container()
    query = "SELECT * FROM c WHERE c.email = @email"
    params = [{"name": "@email", "value": email}]
    items = list(container.query_items(
        query=query,
        parameters=params,
        enable_cross_partition_query=True
    ))
    return items[0] if items else None


def create_user(username: str, email: str, hashed_password: str) -> dict:
    container = _get_container()

    if get_user_by_email(email) is not None:
        raise ValueError("A user with this email already exists")

    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "userId": user_id,
        "email": email,
        "username": username,
        "hashed_password": hashed_password,
        "created_at": datetime.datetime.utcnow().isoformat(),
    }
    container.create_item(user)
    return user