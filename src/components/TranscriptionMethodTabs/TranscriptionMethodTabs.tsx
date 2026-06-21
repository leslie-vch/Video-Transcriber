import { useState } from "react";
import TranscriptionForm from "../TranscriptionForm/TranscriptionForm";
import TranscriptionFileUpload from "../TranscriptionFileUpload/TranscriptionFileUpload";
import "./TranscriptionMethodTabs.scss";

type Method = "youtube" | "file";

type Props = {
  url: string;
  loading: boolean;
  onUrlChange: (value: string) => void;
  onSubmit: () => void;
  onFileSubmit: (file: File) => void;
};

export default function TranscriptionMethodTabs({
  url,
  loading,
  onUrlChange,
  onSubmit,
  onFileSubmit,
}: Props) {
  const [method, setMethod] = useState<Method>("youtube");

  return (
    <div className="transcriptionMethodTabs">
      <div className="transcriptionMethodTabs__tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={method === "youtube"}
          className={`transcriptionMethodTabs__tab ${
            method === "youtube" ? "transcriptionMethodTabs__tab--active" : ""
          }`}
          onClick={() => setMethod("youtube")}
        >
          Desde YouTube
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={method === "file"}
          className={`transcriptionMethodTabs__tab ${
            method === "file" ? "transcriptionMethodTabs__tab--active" : ""
          }`}
          onClick={() => setMethod("file")}
        >
          Subir archivo
        </button>
      </div>

      <div className="transcriptionMethodTabs__panel" role="tabpanel">
        {method === "youtube" ? (
          <>
            <TranscriptionForm
              url={url}
              loading={loading}
              onUrlChange={onUrlChange}
              onSubmit={onSubmit}
            />
            <p className="transcriptionMethodTabs__hint">
              ¿El link no carga?{" "}
              <button
                type="button"
                className="transcriptionMethodTabs__hintAction"
                onClick={() => setMethod("file")}
              >
                Sube el archivo directamente
              </button>
            </p>
          </>
        ) : (
          <TranscriptionFileUpload loading={loading} onSubmit={onFileSubmit} />
        )}
      </div>
    </div>
  );
}