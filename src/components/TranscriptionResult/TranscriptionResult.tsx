import Button from "../Button/Button";
import Card from "../Card/Card";
import type { TranscriptionResult as TranscriptionResultData } from "../../types/transcription.types";
import "./TranscriptionResult.scss";

type Props = {
  result: TranscriptionResultData;
  copied: boolean;
  onCopy: () => void;
  onExportPdf: () => void;
};

export default function TranscriptionResult({
  result,
  copied,
  onCopy,
  onExportPdf,
}: Props) {
  return (
    <Card className="transcriptionResultCard">
      <article className="transcriptionResult" aria-live="polite">
        <header className="transcriptionResult__header">
          <div>
            <h2 className="transcriptionResult__title">
              Transcripción generada
            </h2>
          </div>

          <div className="transcriptionResult__actions">
            <Button variant="secondary" onClick={onCopy}>
              {copied ? "Copiado" : "Copiar texto"}
            </Button>

            <Button variant="primary" onClick={onExportPdf}>
              Exportar PDF
            </Button>
          </div>
        </header>

        {result.language && (
          <p className="transcriptionResult__language">
            Idioma detectado: <strong>{result.language}</strong>
          </p>
        )}

        <div className="transcriptionResult__text">
          <p>{result.text}</p>
        </div>
      </article>
    </Card>
  );
}