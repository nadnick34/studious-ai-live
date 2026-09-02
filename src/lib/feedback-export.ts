import type { AssignmentFeedback } from "@/lib/types";

type Block = { heading: string; paragraphs: string[] };

function blocks(report: AssignmentFeedback): Block[] {
  const review: string[] = [];
  if (report.reviewOfAssignment) review.push(report.reviewOfAssignment);
  for (const s of report.reviewSteps || []) review.push("• " + s);
  for (const pg of report.problemGuides || []) {
    review.push(pg.problem);
    if (pg.howTo) review.push("How to: " + pg.howTo);
    if (pg.example) review.push("Example: " + pg.example);
  }
  const assess: string[] = [];
  if (report.assignmentAssessment) assess.push(report.assignmentAssessment);
  if (report.strengths?.length) {
    assess.push("What looks good");
    for (const s of report.strengths) assess.push("• " + s);
  }
  if (report.issues?.length) {
    assess.push("What to fix");
    for (const s of report.issues) assess.push("• " + s);
  }
  const extra: string[] = [];
  if (report.extraMile) extra.push(report.extraMile);
  for (const s of report.extraMileTips || []) extra.push("• " + s);
  return [
    { heading: "1. Review of Assignment", paragraphs: review.length ? review : ["TBD"] },
    { heading: "2. Completed Work Assessment", paragraphs: assess.length ? assess : ["TBD"] },
    { heading: "3. The Extra Mile", paragraphs: extra.length ? extra : ["N/A"] },
  ];
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] || c);
}

export function printFeedback(title: string, report: AssignmentFeedback) {
  const sections = blocks(report)
    .map(
      (b) => `<section class="box">
        <h2>${escapeHtml(b.heading)}</h2>
        ${b.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("")}
      </section>`,
    )
    .join("");
  const html = `<!doctype html><html><head><title>${escapeHtml(title)}</title>
<style>
  @page { margin: 0.5in; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: ui-sans-serif, system-ui, Segoe UI, Helvetica, Arial, sans-serif; color: #111827; }
  header { margin-bottom: 18px; }
  h1 { margin: 0; font-size: 20px; font-weight: 700; text-align: left; }
  .sub { margin-top: 4px; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: #6b7280; }
  .box { border: 1px solid #d1d5db; border-radius: 12px; padding: 14px 16px; margin: 0 0 14px; }
  h2 { margin: 0 0 8px; font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #0f766e; }
  p { margin: 0 0 8px; font-size: 13px; line-height: 1.5; }
  p:last-child { margin-bottom: 0; }
</style></head><body>
<header>
  <h1>${escapeHtml(title)}</h1>
  <div class="sub">Studious AI · Assignment feedback</div>
</header>
${sections}
</body></html>`;
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
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
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrap(text: string, width = 86): string[] {
  const out: string[] = [];
  for (const raw of text.split(/\n/)) {
    const words = raw.split(/\s+/);
    let line = "";
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
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
  const pageW = 612;
  const pageH = 792;
  const margin = 40;
  const boxPad = 12;
  const innerW = pageW - margin * 2;
  const lineH = 14;
  const titleSize = 16;
  const headSize = 11;
  const bodySize = 11;

  type Draw = string;
  const pages: Draw[][] = [[]];
  let y = pageH - margin;
  let page = 0;

  function ensure(space: number) {
    if (y - space < margin) {
      page += 1;
      pages[page] = [];
      y = pageH - margin;
    }
  }

  function text(font: "F1" | "F2", size: number, x: number, ty: number, s: string) {
    pages[page].push(`BT /${font} ${size} Tf ${x.toFixed(1)} ${ty.toFixed(1)} Td (${pdfEscape(s)}) Tj ET`);
  }

  function rect(x: number, by: number, w: number, h: number) {
    pages[page].push("0.72 0.76 0.78 RG 0.8 w");
    pages[page].push(`${x.toFixed(1)} ${by.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)} re S`);
  }

  text("F2", titleSize, margin, y - titleSize, title);
  y -= titleSize + 6;
  text("F1", 9, margin, y - 9, "STUDIOUS AI  ·  ASSIGNMENT FEEDBACK");
  y -= 22;

  for (const block of blocks(report)) {
    const wrapped = block.paragraphs.flatMap((p) => wrap(p));
    const headH = 16;
    const bodyH = wrapped.length * lineH;
    const boxH = boxPad * 2 + headH + bodyH + 4;
    ensure(boxH + 10);
    const top = y;
    const bottom = y - boxH;
    rect(margin, bottom, innerW, boxH);
    text("F2", headSize, margin + boxPad, top - boxPad - headSize + 2, block.heading.toUpperCase());
    let ty = top - boxPad - headH - 4;
    for (const line of wrapped) {
      text("F1", bodySize, margin + boxPad, ty - bodySize, line);
      ty -= lineH;
    }
    y = bottom - 12;
  }

  const objs: string[] = [];
  objs.push("<< /Type /Catalog /Pages 2 0 R >>");
  const kids = pages.map((_, i) => `${3 + i * 2} 0 R`).join(" ");
  objs.push(`<< /Type /Pages /Count ${pages.length} /Kids [${kids}] >>`);
  pages.forEach((ops, i) => {
    const pageId = 3 + i * 2;
    const contentId = pageId + 1;
    objs.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> >> >> /Contents ${contentId} 0 R >>`,
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
