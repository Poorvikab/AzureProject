"""
Azure AI Speech via REST (no SDK needed, works cleanly in a stateless backend):
- speech_to_text: converts uploaded audio (any common format) into text
- text_to_speech: converts text into spoken audio (mp3 bytes)
"""

import io
import os
import tempfile
import httpx
import imageio_ffmpeg
from pydub import AudioSegment
from fastapi import HTTPException
from app.config import settings

# Point pydub's ffmpeg (encode/decode) binary at the one bundled inside
# imageio-ffmpeg, so no system-level ffmpeg install is required.
_FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()
AudioSegment.converter = _FFMPEG_EXE
AudioSegment.ffmpeg = _FFMPEG_EXE
# NOTE: imageio-ffmpeg only bundles `ffmpeg`, not a real `ffprobe` binary,
# so we deliberately don't point AudioSegment.ffprobe at it (ffmpeg doesn't
# understand ffprobe's flags, so that would just fail a different way).
# Instead, _convert_to_wav always gives pydub a real file on disk rather
# than an in-memory BytesIO object -- pydub only shells out to ffprobe
# when it's handed an in-memory stream, so writing to a temp file first
# avoids the ffprobe call entirely.


def _stt_url() -> str:
    return (
        f"https://{settings.AZURE_SPEECH_REGION}.stt.speech.microsoft.com"
        f"/speech/recognition/conversation/cognitiveservices/v1?language=en-US"
    )


def _tts_url() -> str:
    return f"https://{settings.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1"


def _convert_to_wav(audio_bytes: bytes, content_type: str | None = None) -> bytes:
    """
    Converts any browser/mobile-recorded audio (webm, ogg, mp4, m4a, mp3, etc.)
    into 16kHz mono PCM WAV, which Azure's STT REST endpoint handles most reliably.

    We write the incoming bytes to a temp file (rather than passing a BytesIO
    object directly) and pass an explicit format hint, so pydub decodes
    straight through ffmpeg without ever needing ffprobe.
    """
    format_hint = "webm"  # sensible default for browser MediaRecorder output
    if content_type:
        ct = content_type.split(";")[0].strip().lower()
        if "mp4" in ct or "m4a" in ct:
            format_hint = "mp4"
        elif "ogg" in ct:
            format_hint = "ogg"
        elif "wav" in ct:
            format_hint = "wav"
        elif "mpeg" in ct or "mp3" in ct:
            format_hint = "mp3"
        elif "webm" in ct:
            format_hint = "webm"

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=f".{format_hint}", delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        audio = AudioSegment.from_file(tmp_path, format=format_hint)
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Could not read the uploaded audio file. It may be corrupted or in an unsupported format: {exc}",
        )
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)

    audio = audio.set_frame_rate(16000).set_channels(1).set_sample_width(2)  # 16-bit PCM

    out_buffer = io.BytesIO()
    audio.export(out_buffer, format="wav")
    return out_buffer.getvalue()


async def speech_to_text(audio_bytes: bytes, content_type: str | None = None) -> str:
    """
    Converts incoming audio (any common browser/mobile format) to standard WAV,
    then sends it to Azure Speech-to-Text for transcription.
    """
    settings.require("AZURE_SPEECH_KEY", "AZURE_SPEECH_REGION")

    wav_bytes = _convert_to_wav(audio_bytes, content_type=content_type)

    headers = {
        "Ocp-Apim-Subscription-Key": settings.AZURE_SPEECH_KEY,
        "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000",
        "Accept": "application/json",
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(_stt_url(), headers=headers, content=wav_bytes)

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Speech-to-text error: {response.text}",
        )

    data = response.json()
    status = data.get("RecognitionStatus")

    if status != "Success":
        raise HTTPException(
            status_code=422,
            detail=f"Could not recognize speech (status: {status}). Please try again and speak clearly.",
        )

    text = data.get("DisplayText", "")
    if not text.strip():
        raise HTTPException(
            status_code=422,
            detail="No speech was detected in the recording. Please try again.",
        )

    return text


async def text_to_speech(text: str, voice_name: str = "en-US-JennyNeural") -> bytes:
    settings.require("AZURE_SPEECH_KEY", "AZURE_SPEECH_REGION")

    ssml = f"""
    <speak version="1.0" xml:lang="en-US">
        <voice name="{voice_name}">{text}</voice>
    </speak>
    """.strip()

    headers = {
        "Ocp-Apim-Subscription-Key": settings.AZURE_SPEECH_KEY,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(_tts_url(), headers=headers, content=ssml.encode("utf-8"))

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Text-to-speech error: {response.text}",
        )

    return response.content