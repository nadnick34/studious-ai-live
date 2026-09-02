import type { AssignmentFeedback } from "@/lib/types";

type Line = { text: string; bold?: boolean; indent?: boolean; gapAfter?: number };

function ascii(s: string) {
  return s
    .replace(/[•●▪]/g, "-")
    .replace(/[–—]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function sectionLines(report: AssignmentFeedback): { heading: string; lines: Line[] }[] {
  const review: Line[] = [];
  if (report.reviewOfAssignment) review.push({ text: ascii(report.reviewOfAssignment), gapAfter: 8 });
  for (const s of report.reviewSteps || []) review.push({ text: "- " + ascii(s), indent: true });
  (report.problemGuides || []).forEach((pg, i) => {
    if (review.length) review.push({ text: "", gapAfter: 10 });
    review.push({ text: `Problem ${i + 1}`, bold: true, gapAfter: 2 });
    review.push({ text: ascii(pg.problem), gapAfter: 4 });
    if (pg.howTo) review.push({ text: "How to: " + ascii(pg.howTo), indent: true });
    if (pg.example) review.push({ text: "Example: " + ascii(pg.example), indent: true, gapAfter: 8 });
  });

  const assess: Line[] = [];
  if (report.assignmentAssessment) assess.push({ text: ascii(report.assignmentAssessment), gapAfter: 10 });
  if (report.strengths?.length) {
    assess.push({ text: "What looks good", bold: true, gapAfter: 4 });
    for (const s of report.strengths) assess.push({ text: "- " + ascii(s), indent: true });
  }
  if (report.issues?.length) {
    assess.push({ text: "", gapAfter: 12 });
    assess.push({ text: "What to fix", bold: true, gapAfter: 4 });
    for (const s of report.issues) assess.push({ text: "- " + ascii(s), indent: true });
  }

  const extra: Line[] = [];
  if (report.extraMile) extra.push({ text: ascii(report.extraMile), gapAfter: 6 });
  for (const s of report.extraMileTips || []) extra.push({ text: "- " + ascii(s), indent: true });

  return [
    { heading: "1. Review of Assignment", lines: review.length ? review : [{ text: "TBD" }] },
    { heading: "2. Completed Work Assessment", lines: assess.length ? assess : [{ text: "TBD" }] },
    { heading: "3. The Extra Mile", lines: extra.length ? extra : [{ text: "N/A" }] },
  ];
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] || c);
}

export function printFeedback(title: string, report: AssignmentFeedback) {
  const sections = sectionLines(report)
    .map((b) => {
      const body = b.lines
        .map((ln) => {
          if (!ln.text) return `<div class="gap"></div>`;
          const cls = [ln.bold ? "bold" : "", ln.indent ? "indent" : ""].filter(Boolean).join(" ");
          return `<p class="${cls}">${escapeHtml(ln.text)}</p>`;
        })
        .join("");
      return `<section class="box"><h2>${escapeHtml(b.heading)}</h2>${body}</section>`;
    })
    .join("");
  const html = `<!doctype html><html><head><title>${escapeHtml(title)}</title>
<style>
  @page { margin: 0.4in; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: ui-sans-serif, system-ui, Segoe UI, Helvetica, Arial, sans-serif; color: #111; font-size: 11px; line-height: 1.35; }
  header { margin-bottom: 10px; }
  h1 { margin: 0; font-size: 15px; font-weight: 700; text-align: left; }
  .sub { margin-top: 2px; font-size: 9px; letter-spacing: .08em; text-transform: uppercase; color: #6b7280; }
  .box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 10px 6px; margin: 0 0 8px; }
  h2 { margin: 0 0 6px; font-size: 10px; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; color: #0f766e; }
  p { margin: 0 0 4px; }
  p.bold { font-weight: 700; margin-top: 2px; }
  p.indent { padding-left: 14px; }
  .gap { height: 8px; }
</style></head><body>
<header><h1>${escapeHtml(title)}</h1><div class="sub">Studious AI · Assignment feedback</div></header>
${sections}
</body></html>`;
  const iframe = document.createElement("iframe");
  Object.assign(iframe.style, { position: "fixed", right: "0", bottom: "0", width: "0", height: "0", border: "0" });
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument;
  if (!doc) return;
  doc.open();
  doc.write(html);
  doc.close();
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => iframe.remove(), 1500);
  }, 250);
}

function pdfEscape(s: string) {
  return ascii(s).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrap(text: string, width: number): string[] {
  if (!text) return [""];
  const words = text.split(/\s+/);
  const out: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? line + " " + w : w;
    if (next.length > width) {
      if (line) out.push(line);
      line = w;
    } else line = next;
  }
  if (line) out.push(line);
  return out;
}

export function feedbackPdfBlob(title: string, report: AssignmentFeedback): Blob {
  const pageW = 612;
  const pageH = 792;
  const margin = 36;
  const pad = 10;
  const inner = pageW - margin * 2;
  const bodySize = 10;
  const lineH = 13;

  type Op = string;
  const pages: Op[][] = [[]];
  let y = pageH - margin;
  let pi = 0;

  const push = (op: string) => pages[pi].push(op);
  const newPage = () => {
    pi += 1;
    pages[pi] = [];
    y = pageH - margin;
  };
  const need = (h: number) => {
    if (y - h < margin) newPage();
  };
  const text = (bold: boolean, size: number, x: number, ty: number, s: string) => {
    push(`BT /${bold ? "F2" : "F1"} ${size} Tf ${x.toFixed(1)} ${ty.toFixed(1)} Td (${pdfEscape(s)}) Tj ET`);
  };
  const box = (x: number, b: number, w: number, h: number) => {
    push("0.7 0.75 0.78 RG 0.8 w");
    push(`${x.toFixed(1)} ${b.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)} re S`);
  };

  need(28);
  text(true, 15, margin, y - 14, ascii(title));
  y -= 18;
  text(false, 8, margin, y - 8, "STUDIOUS AI  -  ASSIGNMENT FEEDBACK");
  y -= 16;

  for (const sec of sectionLines(report)) {
    const prepared: { text: string; bold?: boolean; indent?: boolean; gapAfter: number }[] = [];
    for (const ln of sec.lines) {
      const width = ln.indent ? 86 : 90;
      const wrapped = ln.text === "" ? [""] : wrap(ln.text, width);
      wrapped.forEach((w, i) => {
        prepared.push({
          text: w,
          bold: ln.bold && i === 0,
          indent: ln.indent,
          gapAfter: i === wrapped.length - 1 ? ln.gapAfter || 0 : 0,
        });
      });
    }
    const contentH = prepared.reduce((h, ln) => h + (ln.text ? lineH : 0) + ln.gapAfter, 0);
    const boxH = pad * 2 + 16 + contentH;
    need(Math.min(boxH, pageH - margin * 2));
    let top = y;
    let avail = y - margin - 8;
    // If box taller than rest of page, split by drawing open box pieces
    const drawHeader = () => {
      text(true, 10, margin + pad, y - pad - 10, sec.heading.toUpperCase());
      y -= pad + 16;
    };
    drawHeader();
    for (const ln of prepared) {
      if (y - lineH - 8 < margin) {
        box(margin, margin, inner, top - margin);
        newPage();
        top = y;
        drawHeader();
      }
      if (ln.text) {
        text(!!ln.bold, bodySize, margin + pad + (ln.indent ? 12 : 0), y - bodySize, ln.text);
        y -= lineH;
      }
      y -= ln.gapAfter;
    }
    y -= pad;
    box(margin, y, inner, top - y);
    y -= 10;
  }

  const objs: string[] = [];
  objs.push("<< /Type /Catalog /Pages 2 0 R >>");
  objs.push(`<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_, i) => `${3 + i * 2} 0 R`).join(" ")}] >>`);
  pages.forEach((ops, i) => {
    const pageId = 3 + i * 2;
    objs.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> >> >> /Contents ${pageId + 1} 0 R >>`,
    );
    const stream = ops.join("\n");
    objs.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objs.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objs.length; i++) pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer << /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

export async function shareFeedbackPdf(title: string, report: AssignmentFeedback) {
  const blob = feedbackPdfBlob(title, report);
  const safe = ascii(title).replace(/[^\w]+/g, "-").replace(/^-|-$/g, "") || "assignment-feedback";
  const file = new File([blob], `${safe}.pdf`, { type: "application/pdf" });
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title, files: [file] });
      return;
    }
  } catch {
    /* download */
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safe}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
