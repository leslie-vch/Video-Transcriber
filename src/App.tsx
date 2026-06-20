import { useState } from "react";
import { useTranscription } from "./hooks/useTranscription";
import { useClipboard } from "./hooks/useClipboard";
import TranscriptionHero from "./components/TranscriptionHero/TranscriptionHero";
import TranscriptionResult from "./components/TranscriptionResult/TranscriptionResult";
import StatsSection from "./components/StatsSection/StatsSection";
import { exportTranscriptionToPdf } from "./services/exportPdf.service";
import "./App.scss";

export default function App() {
  const [url, setUrl] = useState("");
  const { loading, error, result, transcribe } = useTranscription();
  const { copied, copy } = useClipboard();

  const handleTranscribe = () => {
    transcribe(url);
  };

  const handleCopy = () => {
    if (!result) return;

    copy(result.text);
  };

  const handleExportPdf = () => {
    if (!result) return;

    exportTranscriptionToPdf(result);
  };

  return (
    <main className="app">
      <TranscriptionHero
        url={url}
        loading={loading}
        error={error}
        onUrlChange={setUrl}
        onSubmit={handleTranscribe}
      />

      {result && (
        <section className="app__result">
          <TranscriptionResult
            result={result}
            copied={copied}
            onCopy={handleCopy}
            onExportPdf={handleExportPdf}
          />
        </section>
      )}

      <StatsSection />
    </main>
  );
}