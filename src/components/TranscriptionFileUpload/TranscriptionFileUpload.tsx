// components/TranscriptionFileUpload/TranscriptionFileUpload.tsx
import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import Button from "../Button/Button";
import "./TranscriptionFileUpload.scss";

type Props = {
  loading: boolean;
  onSubmit: (file: File) => void;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function TranscriptionFileUpload({ loading, onSubmit }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
  };

  const handleSelectFile = () => {
    inputRef.current?.click();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleSelectFile();
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0] ?? null;
    if (file) setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleSubmit = () => {
    if (!selectedFile) return;
    onSubmit(selectedFile);
  };

  return (
    <div className="transcriptionFileUpload">
      <input
        ref={inputRef}
        className="transcriptionFileUpload__input"
        type="file"
        accept=".mp3,.wav,.m4a,.mp4,.webm,.mpeg,.mpga,audio/*,video/*"
        onChange={handleFileChange}
      />

      <div
        className={`transcriptionFileUpload__dropzone ${
          isDragging ? "transcriptionFileUpload__dropzone--active" : ""
        }`}
        onClick={handleSelectFile}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
      >
        <svg
          className="transcriptionFileUpload__icon"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 4C14.7614 4 17 6.23858 17 9V10C19.2091 10 21 11.7909 21 14C21 15.4806 20.1956 16.8084 19 17.5M7 10V9C7 7.87439 7.37194 6.83566 7.99963 6M7 10C4.79086 10 3 11.7909 3 14C3 15.4806 3.8044 16.8084 5 17.5M7 10C7.43285 10 7.84965 10.0688 8.24006 10.1959M12 12V21M12 12L15 15M12 12L9 15"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <p className="transcriptionFileUpload__dropzoneText">
          Arrastra tu audio o video, o haz click para buscarlo
        </p>
      </div>

      {selectedFile && (
        <div className="transcriptionFileUpload__fileRow">
          <svg
            className="transcriptionFileUpload__fileIcon"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7 3.5h6.5L18 8v9.5a2.5 2.5 0 0 1-2.5 2.5h-8A2.5 2.5 0 0 1 5 17.5v-12A2.5 2.5 0 0 1 7 3.5Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path d="M13 3.5V8h5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>

          <div className="transcriptionFileUpload__fileInfo">
            <p className="transcriptionFileUpload__fileName">{selectedFile.name}</p>
            <p className="transcriptionFileUpload__fileSize">
              {formatFileSize(selectedFile.size)}
            </p>
          </div>

          <button
            type="button"
            className="transcriptionFileUpload__fileRemove"
            onClick={handleRemoveFile}
            aria-label="Quitar archivo"
          >
            ×
          </button>
        </div>
      )}

      <Button loading={loading} disabled={!selectedFile} onClick={handleSubmit}>
        Transcribir archivo
      </Button>
    </div>
  );
}