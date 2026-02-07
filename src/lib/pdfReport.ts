import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type RiskScore = "LOW" | "MEDIUM" | "HIGH";

export interface CaseReportData {
  generatedAtISO: string;
  analystName: string;
  caseId: string;
  domain: string;
  riskScore: RiskScore;
  domainDetails: Record<string, string | number | boolean | null>;
  hostingSecurity: Record<string, string | number | boolean | null>;
}

export async function generateCaseReportPdf(data: CaseReportData): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const marginX = 44;
  let y = 748;

  const heading = (text: string) => {
    page.drawText(text, {
      x: marginX,
      y,
      size: 16,
      font: fontBold,
      color: rgb(0.1, 0.12, 0.16),
    });
    y -= 22;
  };

  const line = (label: string, value: string) => {
    page.drawText(label, {
      x: marginX,
      y,
      size: 10,
      font: fontBold,
      color: rgb(0.16, 0.18, 0.22),
    });
    page.drawText(value, {
      x: marginX + 120,
      y,
      size: 10,
      font,
      color: rgb(0.16, 0.18, 0.22),
    });
    y -= 14;
  };

  const kvBlock = (title: string, record: Record<string, unknown>) => {
    heading(title);
    const entries = Object.entries(record);
    for (const [k, v] of entries) {
      if (y < 72) break;
      line(k, v === null || v === undefined ? "—" : String(v));
    }
    y -= 8;
  };

  heading("Cyber Investigation Report");
  page.drawLine({
    start: { x: marginX, y: y + 6 },
    end: { x: 612 - marginX, y: y + 6 },
    thickness: 1,
    color: rgb(0.82, 0.84, 0.88),
  });
  y -= 10;

  line("Generated", new Date(data.generatedAtISO).toLocaleString());
  line("Analyst", data.analystName || "—");
  line("Case ID", data.caseId || "—");
  line("Domain", data.domain);
  line("Risk Score", data.riskScore);
  y -= 10;

  kvBlock("Domain Details", data.domainDetails);
  kvBlock("Hosting & Security", data.hostingSecurity);

  const bytes = await pdfDoc.save();
  // Ensure an ArrayBuffer-backed view for DOM Blob typing (avoid ArrayBufferLike/SharedArrayBuffer incompatibility).
  const safeBytes = new Uint8Array(bytes);
  return new Blob([safeBytes], { type: "application/pdf" });
}
