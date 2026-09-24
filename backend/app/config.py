import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # Azure Vision
    AZURE_VISION_ENDPOINT: str = os.getenv("AZURE_VISION_ENDPOINT", "")
    AZURE_VISION_KEY: str = os.getenv("AZURE_VISION_KEY", "")

    # Azure Document Intelligence
    AZURE_DOC_INTEL_ENDPOINT: str = os.getenv("AZURE_DOC_INTEL_ENDPOINT", "")
    AZURE_DOC_INTEL_KEY: str = os.getenv("AZURE_DOC_INTEL_KEY", "")

    # Azure OpenAI
    AZURE_OPENAI_ENDPOINT: str = os.getenv("AZURE_OPENAI_ENDPOINT", "")
    AZURE_OPENAI_KEY: str = os.getenv("AZURE_OPENAI_KEY", "")
    AZURE_OPENAI_API_VERSION: str = os.getenv("AZURE_OPENAI_API_VERSION", "2024-06-01")
    AZURE_OPENAI_CHAT_DEPLOYMENT: str = os.getenv("AZURE_OPENAI_CHAT_DEPLOYMENT", "chat-model")
    AZURE_OPENAI_EMBEDDING_DEPLOYMENT: str = os.getenv("AZURE_OPENAI_EMBEDDING_DEPLOYMENT", "embedding-model")

    # Azure AI Search
    AZURE_SEARCH_ENDPOINT: str = os.getenv("AZURE_SEARCH_ENDPOINT", "")
    AZURE_SEARCH_KEY: str = os.getenv("AZURE_SEARCH_KEY", "")
    AZURE_SEARCH_INDEX_NAME: str = os.getenv("AZURE_SEARCH_INDEX_NAME", "media-knowledge-index")

    # Azure Blob Storage
    AZURE_STORAGE_CONNECTION_STRING: str = os.getenv("AZURE_STORAGE_CONNECTION_STRING", "")
    AZURE_STORAGE_CONTAINER: str = os.getenv("AZURE_STORAGE_CONTAINER", "uploads")

    # Azure AI Speech
    AZURE_SPEECH_KEY: str = os.getenv("AZURE_SPEECH_KEY", "")
    AZURE_SPEECH_REGION: str = os.getenv("AZURE_SPEECH_REGION", "koreacentral")

    # Azure Cosmos DB
    AZURE_COSMOS_URI: str = os.getenv("AZURE_COSMOS_URI", "")
    AZURE_COSMOS_KEY: str = os.getenv("AZURE_COSMOS_KEY", "")
    AZURE_COSMOS_DATABASE: str = os.getenv("AZURE_COSMOS_DATABASE", "smart-media-agent")
    AZURE_COSMOS_CONTAINER: str = os.getenv("AZURE_COSMOS_CONTAINER", "conversations")
    AZURE_COSMOS_USERS_CONTAINER: str = os.getenv("AZURE_COSMOS_USERS_CONTAINER", "users")

    # Auth (JWT)
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))

    def require(self, *names: str):
        missing = [n for n in names if not getattr(self, n, None)]
        if missing:
            raise RuntimeError(f"Missing required environment variables: {', '.join(missing)}")

    def validate(self, *names: str):
        """Backward-compatible alias used by services that expect a validate() method."""
        if names:
            self.require(*names)
        else:
            self.require(
                "AZURE_VISION_ENDPOINT",
                "AZURE_VISION_KEY",
                "AZURE_DOC_INTEL_ENDPOINT",
                "AZURE_DOC_INTEL_KEY",
                "AZURE_OPENAI_ENDPOINT",
                "AZURE_OPENAI_KEY",
                "AZURE_SEARCH_ENDPOINT",
                "AZURE_SEARCH_KEY",
                "AZURE_STORAGE_CONNECTION_STRING",
                "AZURE_SPEECH_KEY",
                "AZURE_SPEECH_REGION",
                "AZURE_COSMOS_URI",
                "AZURE_COSMOS_KEY",
                "JWT_SECRET_KEY",
            )


settings = Settings()
