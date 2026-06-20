export type Segment = {
  start: number;
  end: number;
  text: string;
};

export type TranscriptionResult = {
  text: string;
  language: string;
  segments: Segment[];
};