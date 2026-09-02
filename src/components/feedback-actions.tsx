import { useState } from "react";
import { Button } from "@/components/ui/button";
import { feedbackPdfBlob, printFeedback } from "@/lib/feedback-export";
import type { AssignmentFeedback } from "@/lib/types";

function safeName(title: string) {
  return title.replace(/[^\w]+/g, "-").replace(/^-|-$/g, "") || "assignment-feedback";
}

function downloadPdf(title: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeName(title)}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export function FeedbackActions({ title, report }: { title: string; report: AssignmentFeedback }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function systemShare() {
    const blob = feedbackPdfBlob(title, report);
    const file = new File([blob], `${safeName(title)}.pdf`, { type: "application/pdf" });
    try {
      await navigator.share({ title, files: [file] });
      setOpen(false);
      return;
    } catch (err) {
      if ((err as Error)?.name === "AbortError") {
        setOpen(false);
        return;
      }
    }
    try {
      await navigator.share({ title, text: `${title} — Studious AI assignment feedback` });
      setOpen(false);
      return;
    } catch {
      setNote("This browser has no share sheet. Use Email or Download.");
    }
  }

  function emailPdf() {
    const blob = feedbackPdfBlob(title, report);
    downloadPdf(title, blob);
    const body = `Attached is the Studious AI feedback PDF for: ${title}\n\n(If the PDF did not attach automatically, it was downloaded — attach that file to this email.)`;
    window.location.href = `mailto:?subject=${encodeURIComponent(title + " feedback")}&body=${encodeURIComponent(body)}`;
    setOpen(false);
  }

  return (
    <div className="relative flex gap-2">
      <Button variant="secondary" className="text-xs" onClick={() => printFeedback(title || "Assignment", report)}>
        Print
      </Button>
      <Button variant="secondary" className="text-xs" onClick={() => setOpen((v) => !v)}>
        Share
      </Button>
      {open && (
        <div className="absolute right-0 top-11 z-20 w-56 rounded-xl border border-border bg-card p-2 shadow-lg">
          <button type="button" className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-bg" onClick={() => void systemShare()}>
            Device share sheet
          </button>
          <button type="button" className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-bg" onClick={emailPdf}>
            Email PDF
          </button>
          <button
            type="button"
            className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-bg"
            onClick={() => {
              downloadPdf(title, feedbackPdfBlob(title, report));
              setOpen(false);
            }}
          >
            Download PDF
          </button>
          {note && <p className="px-3 py-1 text-[11px] text-muted">{note}</p>}
        </div>
      )}
    </div>
  );
}
