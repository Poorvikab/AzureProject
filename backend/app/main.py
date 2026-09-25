from app.services import ffmpeg_setup  # noqa: F401
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, vision, documents, chat, voice

app = FastAPI(title="Smart Media Analysis Agent - Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://black-beach-00a2ed100.6.azurestaticapps.net",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(vision.router)
app.include_router(documents.router)
app.include_router(chat.router)
app.include_router(voice.router)


@app.get("/")
def health_check():
    return {"status": "ok", "service": "smart-media-analysis-agent"}
