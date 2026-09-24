"""Document Intelligence: extracts text/tables/layout from PDFs and office docs."""

from azure.ai.documentintelligence import DocumentIntelligenceClient
from azure.ai.documentintelligence.models import AnalyzeDocumentRequest
from azure.core.credentials import AzureKeyCredential
from azure.core.exceptions import HttpResponseError
from app.config import settings


def _get_client() -> DocumentIntelligenceClient:
    settings.require("AZURE_DOC_INTEL_ENDPOINT", "AZURE_DOC_INTEL_KEY")
    return DocumentIntelligenceClient(
        endpoint=settings.AZURE_DOC_INTEL_ENDPOINT,
        credential=AzureKeyCredential(settings.AZURE_DOC_INTEL_KEY),
    )


def extract_text(file_bytes: bytes, content_type: str = "application/octet-stream") -> dict:
    """
    Runs the prebuilt-layout model over supported document types and falls back to
    plain-text extraction for .txt and other simple text content.
    """
    if content_type == "text/plain":
        text = file_bytes.decode("utf-8", errors="ignore").strip()
        return {
            "full_text": text,
            "page_count": 1,
            "pages": [{"page_number": 1, "line_count": len(text.splitlines()) or 1}],
            "table_count": 0,
        }

    try:
        client = _get_client()
        poller = client.begin_analyze_document(
            "prebuilt-layout",
            AnalyzeDocumentRequest(bytes_source=file_bytes),
        )
        result = poller.result()
    except (HttpResponseError, ValueError, TypeError):
        text = file_bytes.decode("utf-8", errors="ignore").strip()
        return {
            "full_text": text,
            "page_count": 1,
            "pages": [{"page_number": 1, "line_count": len(text.splitlines()) or 1}],
            "table_count": 0,
        }

    full_text = result.content or ""

    pages_info = []
    for page in result.pages or []:
        pages_info.append({
            "page_number": page.page_number,
            "line_count": len(page.lines or []),
        })

    tables = []
    for table in result.tables or []:
        tables.append({
            "row_count": table.row_count,
            "column_count": table.column_count,
        })

    return {
        "full_text": full_text,
        "page_count": len(pages_info),
        "pages": pages_info,
        "table_count": len(tables),
    }
