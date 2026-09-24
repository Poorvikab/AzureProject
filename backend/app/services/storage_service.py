"""Blob storage upload/download/list for raw uploaded files."""

from azure.storage.blob import BlobServiceClient
from app.config import settings
import uuid


def _get_container_client():
    settings.require("AZURE_STORAGE_CONNECTION_STRING")
    blob_service_client = BlobServiceClient.from_connection_string(
        settings.AZURE_STORAGE_CONNECTION_STRING
    )
    return blob_service_client.get_container_client(settings.AZURE_STORAGE_CONTAINER)


def upload_file(file_bytes: bytes, original_filename: str, content_type: str) -> dict:
    """Uploads a file to blob storage and returns its blob name + URL."""
    container_client = _get_container_client()

    ext = original_filename.rsplit(".", 1)[-1] if "." in original_filename else "bin"
    blob_name = f"{uuid.uuid4()}.{ext}"

    container_client.upload_blob(
        name=blob_name,
        data=file_bytes,
        overwrite=True,
        content_settings=None,
    )

    blob_client = container_client.get_blob_client(blob_name)

    return {
        "blob_name": blob_name,
        "original_filename": original_filename,
        "url": blob_client.url,
        "content_type": content_type,
    }


def delete_file(blob_name: str):
    container_client = _get_container_client()
    container_client.delete_blob(blob_name)
