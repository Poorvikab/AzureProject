from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, vision, documents, chat, voice

app = FastAPI(title="Smart Media Analysis Agent - Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this to your actual frontend URL later
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