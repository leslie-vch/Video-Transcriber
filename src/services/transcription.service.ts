import { BACKEND_URL } from "../constants/api";
import type { TranscriptionResult } from "../types/transcription.types";

type ApiErrorDetail =
  | string
  | {
      code?: string;
      message?: string;
      hint?: string;
    };

type ApiErrorResponse = {
  detail?: ApiErrorDetail;
};

function getErrorMessage(data: ApiErrorResponse): string {
  const detail = data.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (detail?.message) {
    return detail.message;
  }

  return "No pudimos transcribir el archivo. Intenta nuevamente.";
}

async function getResponseData(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export async function transcribeVideo(
  url: string
): Promise<TranscriptionResult> {
  const response = await fetch(`${BACKEND_URL}/transcribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url }),
  });

  const data = await getResponseData(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data));
  }

  return data;
}

export async function transcribeUploadedFile(
  file: File
): Promise<TranscriptionResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${BACKEND_URL}/transcribe-file`, {
    method: "POST",
    body: formData,
  });

  const data = await getResponseData(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data));
  }

  return data;
}