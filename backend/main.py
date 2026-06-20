import os
import tempfile
import subprocess
from dotenv import load_dotenv


from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from urllib.parse import urlparse

load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))


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


def get_friendly_download_error(stderr: str) -> dict:
    error = stderr.lower()

    if "is not a valid url" in error or "unsupported url" in error:
        return {
            "code": "INVALID_URL",
            "message": "Ingresa una URL válida de YouTube.",
            "hint": "Ejemplo: https://www.youtube.com/watch?v=..."
        }

    if "private video" in error:
        return {
            "code": "PRIVATE_VIDEO",
            "message": "No podemos transcribir videos privados.",
            "hint": "Prueba con un video público de YouTube."
        }

    if "video unavailable" in error or "this video is unavailable" in error:
        return {
            "code": "VIDEO_UNAVAILABLE",
            "message": "No pudimos acceder a ese video.",
            "hint": "Verifica que el enlace funcione y que el video esté disponible."
        }

    if "sign in to confirm" in error or "age-restricted" in error:
        return {
            "code": "RESTRICTED_VIDEO",
            "message": "Este video tiene restricciones y no se puede transcribir.",
            "hint": "Prueba con otro video público."
        }

    return {
        "code": "DOWNLOAD_FAILED",
        "message": "No pudimos descargar el audio del video.",
        "hint": "Revisa el enlace o intenta con otro video."
    }

@app.post("/transcribe")
async def transcribe(req: TranscribeRequest):
    url = req.url.strip()

    if not url:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "EMPTY_URL",
                "message": "Pega una URL de YouTube para continuar.",
                "hint": "El campo no puede estar vacío."
            },
        )

    if not is_youtube_url(url):
        raise HTTPException(
            status_code=400,
            detail={
                "code": "INVALID_URL",
                "message": "Ingresa una URL válida de YouTube.",
                "hint": "Ejemplo: https://www.youtube.com/watch?v=..."
            },
        )

    with tempfile.TemporaryDirectory() as tmpdir:
        audio_path = os.path.join(tmpdir, "audio.mp3")

        result = subprocess.run(
    [
        "yt-dlp",
        "--extract-audio",
        "--audio-format", "mp3",
        "--audio-quality", "0",
        "--output", audio_path,
        "--no-playlist",
        url,
    ],
    capture_output=True,
    text=True,
)

        if result.returncode != 0:
            print("yt-dlp error:", result.stderr)

            friendly_error = get_friendly_download_error(result.stderr)

            raise HTTPException(
                status_code=400,
                detail=friendly_error,
            )

        if not os.path.exists(audio_path):
            raise HTTPException(
                status_code=500,
                detail={
                    "code": "AUDIO_NOT_GENERATED",
                    "message": "No pudimos preparar el audio del video.",
                    "hint": "Intenta nuevamente en unos minutos."
                },
            )

        with open(audio_path, "rb") as audio_file:
            kwargs = dict(
                model="whisper-1",
                file=audio_file,
                response_format="verbose_json",
            )

            if req.language:
                kwargs["language"] = req.language

            transcription = client.audio.transcriptions.create(**kwargs)

        return {
            "text": transcription.text,
            "language": transcription.language,
            "segments": [
                {
                    "start": round(s.start, 2),
                    "end": round(s.end, 2),
                    "text": s.text.strip(),
                }
                for s in transcription.segments
            ],
        }
@app.get("/health")
def health():
    return {"status": "ok"}