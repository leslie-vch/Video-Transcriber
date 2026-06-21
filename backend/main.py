import os
import tempfile
import subprocess
from urllib.parse import urlparse, parse_qs

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from youtube_transcript_api import YouTubeTranscriptApi

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
    domain = parsed.netloc.lower()

    if parsed.scheme not in ("http", "https"):
        return False

    valid_domains = (
        "youtube.com",
        "www.youtube.com",
        "m.youtube.com",
        "youtu.be",
        "www.youtu.be",
    )

    return domain in valid_domains


def extract_video_id(url: str) -> str | None:
    parsed = urlparse(url.strip())
    domain = parsed.netloc.lower()

    if domain in ("youtu.be", "www.youtu.be"):
        video_id = parsed.path.strip("/")
        return video_id[:11] if len(video_id) >= 11 else None

    if domain in ("youtube.com", "www.youtube.com", "m.youtube.com"):
        query = parse_qs(parsed.query)

        if "v" in query:
            return query["v"][0]

        path_parts = parsed.path.strip("/").split("/")

        if len(path_parts) >= 2 and path_parts[0] in ("embed", "shorts", "v"):
            return path_parts[1]

    return None


def get_friendly_download_error(stderr: str) -> dict:
    error = stderr.lower()

    if "is not a valid url" in error or "unsupported url" in error:
        return {
            "code": "INVALID_URL",
            "message": "Ingresa una URL válida de YouTube.",
            "hint": "Ejemplo: https://www.youtube.com/watch?v=...",
        }

    if "private video" in error:
        return {
            "code": "PRIVATE_VIDEO",
            "message": "No podemos transcribir videos privados.",
            "hint": "Prueba con un video público de YouTube.",
        }

    if "video unavailable" in error or "this video is unavailable" in error:
        return {
            "code": "VIDEO_UNAVAILABLE",
            "message": "No pudimos acceder a ese video.",
            "hint": "Verifica que el enlace funcione y que el video esté disponible.",
        }

    if (
        "sign in to confirm" in error
        or "age-restricted" in error
        or "confirm you're not a bot" in error
        or "confirm you’re not a bot" in error
    ):
        return {
            "code": "YOUTUBE_BLOCKED",
            "message": "YouTube bloqueó el acceso desde el servidor.",
            "hint": "Puedes subir el audio o video directamente para transcribirlo.",
        }

    if "ffmpeg" in error:
        return {
            "code": "FFMPEG_ERROR",
            "message": "No pudimos preparar el audio del video.",
            "hint": "El servidor necesita FFmpeg para procesar el audio.",
        }

    return {
        "code": "DOWNLOAD_FAILED",
        "message": "No pudimos descargar el audio del video.",
        "hint": "Revisa el enlace o intenta con otro video público.",
    }


def normalize_caption_snippets(fetched_transcript):
    if hasattr(fetched_transcript, "to_raw_data"):
        return fetched_transcript.to_raw_data()

    if hasattr(fetched_transcript, "snippets"):
        return [
            {
                "text": snippet.text,
                "start": snippet.start,
                "duration": snippet.duration,
            }
            for snippet in fetched_transcript.snippets
        ]

    return fetched_transcript


def build_captions_response(fetched_transcript, language_code: str = "captions"):
    raw_snippets = normalize_caption_snippets(fetched_transcript)

    segments = []
    text_parts = []

    for item in raw_snippets:
        text = item.get("text", "").strip()

        if not text:
            continue

        start = float(item.get("start", 0))
        duration = float(item.get("duration", 0))

        segments.append(
            {
                "start": round(start, 2),
                "end": round(start + duration, 2),
                "text": text,
            }
        )

        text_parts.append(text)

    if not segments:
        return None

    return {
        "text": " ".join(text_parts),
        "language": language_code,
        "segments": segments,
        "source": "youtube_captions",
    }


def try_get_youtube_captions(video_id: str, language: str = ""):
    try:
        ytt_api = YouTubeTranscriptApi()
        transcript_list = ytt_api.list(video_id)

        available = [
            {
                "language": transcript.language,
                "language_code": transcript.language_code,
                "is_generated": transcript.is_generated,
                "is_translatable": transcript.is_translatable,
            }
            for transcript in transcript_list
        ]

        print("Subtítulos disponibles:")
        print(available)

        preferred_languages = (
            [language]
            if language
            else [
                "es",
                "es-419",
                "es-MX",
                "es-US",
                "es-ES",
                "en",
                "en-US",
                "en-GB",
            ]
        )

        try:
            transcript = transcript_list.find_transcript(preferred_languages)
            fetched = transcript.fetch()
            return build_captions_response(fetched, transcript.language_code)
        except Exception:
            pass

        for transcript in transcript_list:
            if transcript.language_code.startswith("es"):
                fetched = transcript.fetch()
                return build_captions_response(fetched, transcript.language_code)

        for transcript in transcript_list:
            if transcript.language_code.startswith("en"):
                if transcript.is_translatable:
                    try:
                        translated = transcript.translate("es")
                        fetched = translated.fetch()
                        return build_captions_response(fetched, "es")
                    except Exception:
                        pass

                fetched = transcript.fetch()
                return build_captions_response(fetched, transcript.language_code)

        for transcript in transcript_list:
            if transcript.is_translatable:
                try:
                    translated = transcript.translate("es")
                    fetched = translated.fetch()
                    return build_captions_response(fetched, "es")
                except Exception:
                    pass

            fetched = transcript.fetch()
            return build_captions_response(fetched, transcript.language_code)

        return None

    except Exception as exc:
        print("No se pudo obtener subtítulos de YouTube:")
        print(exc)
        return None


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
        "source": "whisper",
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


def download_youtube_audio(url: str, audio_path: str):
    return subprocess.run(
        [
            "yt-dlp",
            "--extract-audio",
            "--audio-format",
            "mp3",
            "--audio-quality",
            "0",
            "--output",
            audio_path,
            "--no-playlist",
            url,
        ],
        capture_output=True,
        text=True,
    )


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
                "hint": "Asegúrate de pegar el link directo a un video de YouTube.",
            },
        )

    captions_result = try_get_youtube_captions(video_id, req.language)

    if captions_result:
        return captions_result

    with tempfile.TemporaryDirectory() as tmpdir:
        audio_path = os.path.join(tmpdir, "audio.mp3")

        result = download_youtube_audio(url, audio_path)

        if result.returncode != 0:
            print("yt-dlp error completo:")
            print(result.stderr)

            raise HTTPException(
                status_code=400,
                detail=get_friendly_download_error(result.stderr),
            )

        if not os.path.exists(audio_path):
            raise HTTPException(
                status_code=500,
                detail={
                    "code": "AUDIO_NOT_GENERATED",
                    "message": "No pudimos preparar el audio del video.",
                    "hint": "Intenta nuevamente en unos minutos.",
                },
            )

        return transcribe_audio_file(audio_path, req.language)


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