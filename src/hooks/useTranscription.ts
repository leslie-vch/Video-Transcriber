import { useState } from "react";
import { transcribeVideo } from "../services/transcription.service";
import type { TranscriptionResult } from "../types/transcription.types";

export function useTranscription() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<TranscriptionResult | null>(null);

  const transcribe = async (url: string) => {
    if (!url.trim()) {
      setError("Pega una URL de YouTube para continuar.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await transcribeVideo(url);
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos transcribir el video. Intenta nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    result,
    transcribe,
  };
}