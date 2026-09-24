"""
Wrapper around Azure Vision's Image Analysis REST API (v4.0).
Docs: https://learn.microsoft.com/azure/ai-services/computer-vision/how-to/call-analyze-image-40
"""

import httpx
from fastapi import HTTPException
from app.config import settings

ANALYZE_URL_TEMPLATE = (
    "{endpoint}/computervision/imageanalysis:analyze"
    "?api-version=2024-02-01&features=caption,read,tags,denseCaptions"
)


async def analyze_image(image_bytes: bytes) -> dict:
    """
    Sends raw image bytes to Azure Vision and returns a normalized dict with:
      - caption: short natural-language description
      - tags: list of detected tags
      - ocr_text: all text extracted from the image (for RAG indexing)
    """
    settings.require("AZURE_VISION_ENDPOINT", "AZURE_VISION_KEY")

    url = ANALYZE_URL_TEMPLATE.format(endpoint=settings.AZURE_VISION_ENDPOINT.rstrip("/"))
    headers = {
        "Content-Type": "application/octet-stream",
        "Ocp-Apim-Subscription-Key": settings.AZURE_VISION_KEY,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, headers=headers, content=image_bytes)

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Azure Vision error: {response.text}",
        )

    data = response.json()

    caption = ""
    if "captionResult" in data and data["captionResult"]:
        caption = data["captionResult"].get("text", "")

    tags = []
    if "tagsResult" in data and data["tagsResult"]:
        tags = [t["name"] for t in data["tagsResult"].get("values", [])]

    ocr_text = ""
    if "readResult" in data and data["readResult"]:
        lines = []
        for block in data["readResult"].get("blocks", []):
            for line in block.get("lines", []):
                lines.append(line.get("text", ""))
        ocr_text = "\n".join(lines)

    return {
        "caption": caption,
        "tags": tags,
        "ocr_text": ocr_text,
        "raw": data,  # keep raw response too, useful while debugging/indexing later
    }
