import os
import re
import tempfile
from urllib.parse import urlparse

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from youtube_transcript_api import (
    YouTubeTranscriptApi,
    TranscriptsDisabled,
    NoTranscriptFound,
    VideoUnavailable,
)

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY no está configurada.")

client = OpenAI(api_key=OPENAI_API_KEY)


class TranscribeRequest(BaseModel):
    url: str
    language: str = ""


def is_youtube_url(url: str) -> bool:
    parsed = urlparse(url.strip())

    if parsed.scheme not in ("http", "https"):
        return False

    valid_domains = (
        "youtube.com",
        "www.youtube.com",
        "m.youtube.com",
        "youtu.be",
    )

    return parsed.netloc.lower() in valid_domains


def extract_video_id(url: str) -> str | None:
    pattern = r"(?:v=|youtu\.be/|/embed/|/shorts/|/v/)([0-9A-Za-z_-]{11})"
    match = re.search(pattern, url)
    return match.group(1) if match else None


def try_get_youtube_captions(video_id: str, language: str = ""):
    """Intenta traer la transcripción oficial de YouTube. Devuelve None si no existe."""
    ytt_api = YouTubeTranscriptApi()
    languages = [language] if language else ["es", "en"]

    try:
        fetched = ytt_api.fetch(video_id, languages=languages)
    except (TranscriptsDisabled, NoTranscriptFound, VideoUnavailable):
        return None
    except Exception as exc:
        print(f"No se pudo obtener subtítulos de YouTube: {exc}")
        return None

    segments = []
    text_parts = []

    for snippet in fetched.snippets:
        text = snippet.text.strip()
        if not text:
            continue

        segments.append(
            {
                "start": round(snippet.start, 2),
                "end": round(snippet.start + snippet.duration, 2),
                "text": text,
            }
        )
        text_parts.append(text)

    if not segments:
        return None

    return {
        "text": " ".join(text_parts),
        "language": fetched.language_code,
        "segments": segments,
    }


def build_transcription_response(transcription):
    return {
        "text": transcription.text,
        "language": transcription.language,
        "segments": [
            {
                "start": round(segment.start, 2),
                "end": round(segment.end, 2),
                "text": segment.text.strip(),
            }
            for segment in transcription.segments
        ],
    }


def transcribe_audio_file(file_path: str, language: str = ""):
    with open(file_path, "rb") as audio_file:
        kwargs = {
            "model": "whisper-1",
            "file": audio_file,
            "response_format": "verbose_json",
        }

        if language:
            kwargs["language"] = language

        transcription = client.audio.transcriptions.create(**kwargs)

    return build_transcription_response(transcription)


@app.post("/transcribe")
async def transcribe(req: TranscribeRequest):
    url = req.url.strip()

    if not url:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "EMPTY_URL",
                "message": "Pega una URL de YouTube para continuar.",
                "hint": "El campo no puede estar vacío.",
            },
        )

    if not is_youtube_url(url):
        raise HTTPException(
            status_code=400,
            detail={
                "code": "INVALID_URL",
                "message": "Ingresa una URL válida de YouTube.",
                "hint": "Ejemplo: https://www.youtube.com/watch?v=...",
            },
        )

    video_id = extract_video_id(url)

    if not video_id:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "INVALID_URL",
                "message": "No pudimos identificar el video en esa URL.",
                "hint": "Asegurate de pegar el link directo a un video de YouTube.",
            },
        )

    captions_result = try_get_youtube_captions(video_id, req.language)

    if not captions_result:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "NO_CAPTIONS_AVAILABLE",
                "message": "Este video no tiene subtítulos disponibles para transcribir.",
                "hint": "Subí el audio o video directamente para transcribirlo.",
            },
        )

    return captions_result


@app.post("/transcribe-file")
async def transcribe_file(file: UploadFile = File(...), language: str = ""):
    allowed_extensions = (".mp3", ".wav", ".m4a", ".mp4", ".webm", ".mpeg", ".mpga")

    filename = file.filename or ""

    if not filename.lower().endswith(allowed_extensions):
        raise HTTPException(
            status_code=400,
            detail={
                "code": "INVALID_FILE_TYPE",
                "message": "Sube un archivo de audio o video válido.",
                "hint": "Formatos recomendados: MP3, WAV, M4A, MP4 o WEBM.",
            },
        )

    safe_filename = os.path.basename(filename)

    with tempfile.TemporaryDirectory() as tmpdir:
        file_path = os.path.join(tmpdir, safe_filename)

        with open(file_path, "wb") as buffer:
            while chunk := await file.read(1024 * 1024):
                buffer.write(chunk)

        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=500,
                detail={
                    "code": "UPLOAD_FAILED",
                    "message": "No pudimos recibir el archivo.",
                    "hint": "Intenta subirlo nuevamente.",
                },
            )

        return transcribe_audio_file(file_path, language)


@app.get("/health")
def health():
    return {"status": "ok"}