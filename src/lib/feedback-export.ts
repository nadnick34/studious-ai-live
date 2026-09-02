import type { AssignmentFeedback } from "@/lib/types";

export function feedbackLines(title: string, report: AssignmentFeedback): string[] {
  const lines: string[] = [title, ""];
  lines.push("1. Review of Assignment");
  if (report.reviewOfAssignment) lines.push(report.reviewOfAssignment);
  for (const s of report.reviewSteps || []) lines.push("• " + s);
  for (const pg of report.problemGuides || []) {
    lines.push(`${pg.problem}`);
    if (pg.howTo) lines.push("How to: " + pg.howTo);
    if (pg.example) lines.push("Example: " + pg.example);
  }
  lines.push("", "2. Completed Work Assessment");
  if (report.assignmentAssessment) lines.push(report.assignmentAssessment);
  if (report.strengths?.length) {
    lines.push("What looks good");
    for (const s of report.strengths) lines.push("• " + s);
  }
  if (report.issues?.length) {
    lines.push("What to fix");
    for (const s of report.issues) lines.push("• " + s);
  }
  lines.push("", "3. The Extra Mile");
  if (report.extraMile) lines.push(report.extraMile);
  for (const s of report.extraMileTips || []) lines.push("• " + s);
  return lines;
}

function pdfEscape(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrap(text: string, width = 92): string[] {
  const out: string[] = [];
  for (const raw of text.split(/\n/)) {
    const words = raw.split(/\s+/);
    let line = "";
    for (const w of words) {
      const next = line ? line + " " + w : w;
      if (next.length > width) {
        if (line) out.push(line);
        line = w;
      } else line = next;
    }
    out.push(line);
  }
  return out.length ? out : [""];
}

export function feedbackPdfBlob(title: string, report: AssignmentFeedback): Blob {
  const wrapped = feedbackLines(title, report).flatMap((l) => wrap(l));
  const perPage = 48;
  const pages: string[][] = [];
  for (let i = 0; i < wrapped.length; i += perPage) pages.push(wrapped.slice(i, i + perPage));
  if (!pages.length) pages.push([title]);

  const objs: string[] = [];
  objs.push("<< /Type /Catalog /Pages 2 0 R >>");
  const kids = pages.map((_, i) => `${3 + i * 2} 0 R`).join(" ");
  objs.push(`<< /Type /Pages /Count ${pages.length} /Kids [${kids}] >>`);
  pages.forEach((pageLines, i) => {
    const pageId = 3 + i * 2;
    const contentId = pageId + 1;
    objs.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /Contents ${contentId} 0 R >>`);
    const stream = [
      "BT",
      "/F1 14 Tf",
      "50 748 Td",
      `(${pdfEscape(i === 0 ? title : title + " (cont.)")}) Tj`,
      "/F1 11 Tf",
      "0 -22 Td",
      ...pageLines.slice(i === 0 ? 1 : 0).map((line) => `(${pdfEscape(line)}) Tj 0 -14 Td`),
      "ET",
    ].join("\n");
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
  for (let i = 1; i <= objs.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

export function printFeedback(title: string, report: AssignmentFeedback) {
  const html = `<!doctype html><html><head><title>${escapeHtml(title)}</title>
<style>
  @page { margin: 0.6in; }
  body { font-family: Georgia, serif; color: #111; }
  h1 { font-size: 16px; margin: 0 0 16px; text-align: left; }
  h2 { font-size: 12px; letter-spacing: .06em; text-transform: uppercase; margin: 18px 0 6px; }
  p, li { font-size: 13px; line-height: 1.45; }
</style></head><body>
<h1>${escapeHtml(title)}</h1>
${section("1. Review of Assignment", report.reviewOfAssignment, report.reviewSteps)}
${guides(report)}
${section("2. Completed Work Assessment", report.assignmentAssessment)}
${list("What looks good", report.strengths)}
${list("What to fix", report.issues)}
${section("3. The Extra Mile", report.extraMile, report.extraMileTips)}
</body></html>`;
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument;
  if (!doc) return;
  doc.open();
  doc.write(html);
  doc.close();
  iframe.contentWindow?.focus();
  iframe.contentWindow?.print();
  setTimeout(() => iframe.remove(), 1000);
}

export async function shareFeedbackPdf(title: string, report: AssignmentFeedback) {
  const blob = feedbackPdfBlob(title, report);
  const safe = title.replace(/[^\w]+/g, "-").replace(/^-|-$/g, "") || "assignment-feedback";
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

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] || c);
}

function section(h: string, body?: string, bullets?: string[]) {
  return `<h2>${escapeHtml(h)}</h2><p>${escapeHtml(body || "")}</p>${list("", bullets)}`;
}

function list(h: string, items?: string[]) {
  if (!items?.length) return "";
  return `${h ? `<p><strong>${escapeHtml(h)}</strong></p>` : ""}<ul>${items.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>`;
}

function guides(report: AssignmentFeedback) {
  if (!report.problemGuides?.length) return "";
  return report.problemGuides
    .map(
      (pg) =>
        `<p><strong>${escapeHtml(pg.problem)}</strong><br/>How to: ${escapeHtml(pg.howTo || "")}<br/>Example: ${escapeHtml(pg.example || "")}</p>`,
    )
    .join("");
}
