import Badge from "../Badge/Badge";
import Card from "../Card/Card";
import FeedbackMessage from "../FeedbackMessage/FeedbackMessage";
import TranscriptionMethodTabs from "../TranscriptionMethodTabs/TranscriptionMethodTabs";
import "./TranscriptionHero.scss";

type Props = {
  url: string;
  loading: boolean;
  error?: string | null;
  onUrlChange: (value: string) => void;
  onSubmit: () => void;
  onFileSubmit: (file: File) => void;
};

export default function TranscriptionHero({
  url,
  loading,
  error,
  onUrlChange,
  onSubmit,
  onFileSubmit,
}: Props) {
  return (
    <section className="transcriptionHero" aria-labelledby="transcription-title">
      <div className="transcriptionHero__content">
        <div className="transcriptionHero__info">
          <Badge
            variant="ai"
            text="Transcripciones para ti"
            icon={
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 3L13.4302 8.31181C13.6047 8.96 13.692 9.28409 13.8642 9.54905C14.0166 9.78349 14.2165 9.98336 14.451 10.1358C14.7159 10.308 15.04 10.3953 15.6882 10.5698L21 12L15.6882 13.4302C15.04 13.6047 14.7159 13.692 14.451 13.8642C14.2165 14.0166 14.0166 14.2165 13.8642 14.451C13.692 14.7159 13.6047 15.04 13.4302 15.6882L12 21L10.5698 15.6882C10.3953 15.04 10.308 14.7159 10.1358 14.451C9.98336 14.2165 9.78349 14.0166 9.54905 13.8642C9.28409 13.692 8.96 13.6047 8.31181 13.4302L3 12L8.31181 10.5698C8.96 10.3953 9.28409 10.308 9.54905 10.1358C9.78349 9.98336 9.98336 9.78349 10.1358 9.54905C10.308 9.28409 10.3953 8.96 10.5698 8.31181L12 3Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
          />

          <h1 id="transcription-title" className="transcriptionHero__title">
            Transcribe videos de
            <span>YouTube en segundos</span>
          </h1>

          <p className="transcriptionHero__description">
            Pega cualquier URL de YouTube y obtén una transcripción precisa con
            marcas de tiempo al instante.
          </p>

          <ul className="transcriptionHero__benefits" aria-label="Benefits">
            <li>⊙ No requiere registro</li>
            <li>◷ Resultados en menos de 30 segundos</li>
            <li>⇩ Exportar TXT o PDF</li>
          </ul>

          <TranscriptionMethodTabs
  url={url}
  loading={loading}
  onUrlChange={onUrlChange}
  onSubmit={onSubmit}
  onFileSubmit={onFileSubmit}
/>

          <div className="transcriptionHero__feedback">
            {loading && (
              <FeedbackMessage type="warning">
                ⏱ Esto puede tardar entre 30 segundos y 2 minutos dependiendo de
                la duración del video.
              </FeedbackMessage>
            )}

            {error && (
              <FeedbackMessage type="error">
                {error}
              </FeedbackMessage>
            )}
          </div>
        </div>

        <Card className="transcriptionHero__videoCard">
          <div className="transcriptionHero__videoWrapper">
            <iframe
              className="transcriptionHero__video"
              src="https://www.youtube.com/embed/LnTQWygIjXk?start=1"
              title="YouTube video preview"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </Card>
      </div>
    </section>
  );
}