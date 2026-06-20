import { jsPDF } from "jspdf";
import type { TranscriptionResult } from "../types/transcription.types";

function addTextWithPagination(
  doc: jsPDF,
  lines: string[],
  options: {
    x: number;
    y: number;
    lineHeight: number;
    pageHeight: number;
    bottomMargin: number;
  }
) {
  let currentY = options.y;

  lines.forEach((line) => {
    if (currentY > options.pageHeight - options.bottomMargin) {
      doc.addPage();
      currentY = 20;
    }

    doc.text(line, options.x, currentY);
    currentY += options.lineHeight;
  });
}

export function exportTranscriptionToPdf(result: TranscriptionResult) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const marginX = 18;
  const contentWidth = pageWidth - marginX * 2;

  const date = new Date().toLocaleDateString("es-EC");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Transcripción generada", marginX, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Fecha: ${date}`, marginX, 30);

  if (result.language) {
    doc.text(`Idioma detectado: ${result.language}`, marginX, 37);
  }

  doc.setDrawColor(230, 224, 245);
  doc.line(marginX, 45, pageWidth - marginX, 45);

  doc.setFontSize(12);

  const textLines = doc.splitTextToSize(result.text, contentWidth) as string[];

  addTextWithPagination(doc, textLines, {
    x: marginX,
    y: 56,
    lineHeight: 7,
    pageHeight,
    bottomMargin: 20,
  });

  doc.save("transcripcion-youtube.pdf");
}