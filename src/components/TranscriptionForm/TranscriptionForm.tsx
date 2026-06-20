import { useRef } from "react";
import TextInput from "../TextInput/TextInput";
import Button from "../Button/Button";
import "./TranscriptionForm.scss";

type Props = {
  url: string;
  loading: boolean;
  onUrlChange: (value: string) => void;
  onSubmit: () => void;
};

export default function TranscriptionForm({
  url,
  loading,
  onUrlChange,
  onSubmit,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <section className="transcriptionForm">
      <div className="transcriptionForm__field">
        <TextInput
          ref={inputRef}
          id="video-url"
          label=""
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
          placeholder="Pega tu url aquí..."
        />
      </div>

      <Button
        loading={loading}
        disabled={!url.trim()}
        onClick={onSubmit}
      >
        Transcribir video
      </Button>
    </section>
  );
}