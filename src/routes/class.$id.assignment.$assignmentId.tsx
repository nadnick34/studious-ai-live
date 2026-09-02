import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { CaptureBar, capturedToPayloads, type CapturedFile } from "@/components/capture-bar";
import { KidsOwlBanner, useKidsMascot } from "@/components/kids-mascot";
import { Button } from "@/components/ui/button";
import { analyzeAssignment, extractMaterials } from "@/lib/ai";
import { getAssignmentById, getClassById, getProfile, updateAssignment } from "@/lib/data";
import { printFeedback, shareFeedbackPdf } from "@/lib/feedback-export";
import { uid } from "@/lib/utils";
import type { AssignmentFeedback, AssignmentRecord, AssignmentSubmission, ClassRecord } from "@/lib/types";

export const Route = createFileRoute("/class/$id/assignment/$assignmentId")({
  component: AssignmentDetailPage,
});

async function extractFromCapture(items: CapturedFile[]): Promise<{ text: string; names: string[] }> {
  if (!items.length) return { text: "", names: [] };
  const payloads = await capturedToPayloads(items);
  const extracted = await extractMaterials({ data: { files: payloads } });
  const names = extracted.attachments.map((a) => a.name);
  const text = (extracted.text || "").trim();
  return { text, names };
}

function AssignmentDetailPage() {
  const { id: classId, assignmentId } = Route.useParams();
  const [cls, setCls] = useState<ClassRecord | null>(null);
  const [asg, setAsg] = useState<AssignmentRecord | null>(null);
  const [instructionPaste, setInstructionPaste] = useState("");
  const [instructionFiles, setInstructionFiles] = useState<CapturedFile[]>([]);
  const [workPaste, setWorkPaste] = useState("");
  const [workFiles, setWorkFiles] = useState<CapturedFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<AssignmentFeedback | null>(null);
  const { kidsMode, name: mascotName } = useKidsMascot();

  useEffect(() => {
    void Promise.all([getClassById({ data: classId }), getAssignmentById({ data: assignmentId })]).then(
      ([c, a]) => {
        setCls(c);
        setAsg(a);
        if (a?.submissions?.[0]?.feedback) setReport(a.submissions[0].feedback);
      },
    );
  }, [classId, assignmentId]);

  async function runAnalysis(mode: "instructions" | "work" | "both") {
    if (!cls || !asg) return;
    setBusy(true);
    setError(null);
    setStatus("Reading uploads…");
    try {
      let instructionsText = asg.instructionsText || "";
      let workText = "";
      const sourceFiles = [...(asg.sourceFiles || [])];

      if (mode === "instructions" || mode === "both") {
        const fromFiles = await extractFromCapture(instructionFiles);
        const combined = [instructionPaste.trim(), fromFiles.text].filter(Boolean).join("\n\n");
        if (combined) {
          instructionsText = [instructionsText, combined].filter(Boolean).join("\n\n").slice(0, 60000);
          sourceFiles.push(...fromFiles.names);
        }
      }

      if (mode === "work" || mode === "both") {
        const fromFiles = await extractFromCapture(workFiles);
        workText = [workPaste.trim(), fromFiles.text].filter(Boolean).join("\n\n").slice(0, 60000);
        if (!workText && mode === "work") {
          setError("Could not read your completed work. Upload a clearer PDF, photo, or scan, or paste the text.");
          return;
        }
      }

      if (mode === "instructions" && !instructionsText.trim()) {
        setError("Could not read assignment instructions. Try a text PDF, photo, or scan of the sheet.");
        return;
      }

      if (!instructionsText.trim() && !workText.trim()) {
        setError("Add instructions and/or completed work (PDF, photo, scan, or paste).");
        return;
      }

      setStatus("Analyzing…");
      const profile = await getProfile();
      const feedback = await analyzeAssignment({
        data: {
          className: cls.name,
          classCode: cls.code,
          subject: cls.subject,
          title: asg.title,
          instructionsText: instructionsText.trim() || undefined,
          workText: workText.trim() || undefined,
          kidsMode: Boolean(profile.kidsMode),
          childAge: profile.childAge,
        },
      });

      const submission: AssignmentSubmission | null = workText.trim()
        ? {
            id: uid("sub"),
            submittedAt: new Date().toISOString(),
            fileNames: workFiles.map((f) => f.file.name),
            workText: workText.trim().slice(0, 20000),
            feedback,
          }
        : null;

      const guidance =
        feedback.reviewOfAssignment && feedback.reviewOfAssignment !== "TBD"
          ? {
              summary: feedback.reviewOfAssignment,
              steps: feedback.reviewSteps || [],
              ideas: [] as string[],
              tips: [] as string[],
              checklist: [] as string[],
              warnings: [] as string[],
              problemGuides: feedback.problemGuides || [],
            }
          : asg.guidance;

      const submissions = submission ? [submission, ...(asg.submissions || [])] : asg.submissions || [];

      await updateAssignment({
        data: {
          id: asg.id,
          patch: {
            instructionsText,
            sourceFiles: Array.from(new Set(sourceFiles)),
            guidance: guidance || null,
            submissions,
          },
        },
      });

      setAsg({
        ...asg,
        instructionsText,
        sourceFiles: Array.from(new Set(sourceFiles)),
        guidance: guidance || null,
        submissions,
      });
      setReport(feedback);
      setInstructionPaste("");
      setInstructionFiles([]);
      setWorkPaste("");
      setWorkFiles([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setBusy(false);
      setStatus(null);
    }
  }

  if (!cls || !asg) {
    return (
      <AppShell title="Assignment">
        <p className="text-sm text-muted">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell title={asg.title}>
      <div className="mb-4 flex items-center justify-between">
        <Link to="/class/$id/assignments" params={{ id: classId }} className="text-sm text-teal hover:underline">
          ← All assignments
        </Link>
        <span className="text-xs text-muted">{cls.code}</span>
      </div>

      <KidsOwlBanner
        message={
          kidsMode
            ? `${mascotName} can review the sheet and your finished work — together or one at a time.`
            : "Upload instructions, completed work, or both — anytime for this assignment."
        }
      />

      <div className="mx-auto max-w-2xl space-y-5">
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-1 text-lg font-semibold text-fg">{asg.title}</h2>
          {asg.sourceFiles?.length > 0 && (
            <p className="mb-2 text-xs text-muted">Files: {asg.sourceFiles.join(", ")}</p>
          )}
          {asg.instructionsText ? (
            <details className="text-sm">
              <summary className="cursor-pointer text-teal">View saved instructions / sheet text</summary>
              <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-bg p-3 text-xs">{asg.instructionsText}</pre>
            </details>
          ) : (
            <p className="text-sm text-muted">No instructions saved yet — upload the sheet below.</p>
          )}
        </section>

        <section className="space-y-3 rounded-xl border border-border bg-card p-4">
          <h3 className="font-semibold text-fg">1. Assignment instructions / problems</h3>
          <p className="text-xs text-muted">PDF, photo, or scan of the directions and/or problem set.</p>
          <CaptureBar items={instructionFiles} onChange={setInstructionFiles} disabled={busy} />
          <textarea
            className="min-h-20 w-full rounded-lg border border-border px-3 py-2 text-sm"
            placeholder="Optional: paste instructions here…"
            value={instructionPaste}
            onChange={(e) => setInstructionPaste(e.target.value)}
            disabled={busy}
          />
          <Button variant="secondary" disabled={busy} onClick={() => void runAnalysis("instructions")}>
            {busy ? "Working…" : "Review assignment"}
          </Button>
        </section>

        <section className="space-y-3 rounded-xl border-2 border-teal/30 bg-card p-4">
          <h3 className="font-semibold text-fg">2. Completed work</h3>
          <p className="text-xs text-muted">PDF, photo, or scan of what you finished — can be added later.</p>
          <CaptureBar items={workFiles} onChange={setWorkFiles} disabled={busy} />
          <textarea
            className="min-h-20 w-full rounded-lg border border-border px-3 py-2 text-sm"
            placeholder="Optional: paste your answers here…"
            value={workPaste}
            onChange={(e) => setWorkPaste(e.target.value)}
            disabled={busy}
          />
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy} onClick={() => void runAnalysis("work")}>
              {busy ? "Working…" : "Assess completed work"}
            </Button>
            <Button variant="secondary" disabled={busy} onClick={() => void runAnalysis("both")}>
              Analyze both
            </Button>
          </div>
        </section>

        {status && <p className="text-xs text-teal">{status}</p>}
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red dark:bg-red-950/30">{error}</p>}

        {report && <ReportView report={report} assignmentTitle={asg?.title || "Assignment"} />}
      </div>
    </AppShell>
  );
}


function ReportView({ report, assignmentTitle }: { report: AssignmentFeedback; assignmentTitle: string }) {
  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-4 print:border-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-fg">Feedback</h3>
        <div className="flex gap-2">
          <Button variant="secondary" className="text-xs" onClick={() => printFeedback(assignmentTitle || "Assignment", report)}>
            Print
          </Button>
          <Button variant="secondary" className="text-xs" onClick={() => void shareFeedbackPdf(assignmentTitle || "Assignment", report)}>
            Share
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-bg p-3">
        <h4 className="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">1. Review of Assignment</h4>
        <p className="text-sm text-fg/90">{report.reviewOfAssignment}</p>
        {report.reviewSteps && report.reviewSteps.length > 0 && (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {report.reviewSteps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        )}
        {report.problemGuides && report.problemGuides.length > 0 && (
          <div className="mt-3 space-y-2">
            {report.problemGuides.map((pg, i) => (
              <div key={pg.id || i} className="rounded-lg border border-border bg-card p-2 text-sm">
                <p className="font-medium">
                  {i + 1}. {pg.problem}
                </p>
                <p className="mt-1 text-fg/90">
                  <span className="text-xs font-semibold text-muted">How to: </span>
                  {pg.howTo}
                </p>
                <p className="mt-1 text-fg/90">
                  <span className="text-xs font-semibold text-teal">Example: </span>
                  {pg.example}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-bg p-3">
        <h4 className="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">2. Assignment Assessment</h4>
        <p className="text-sm text-fg/90">{report.assignmentAssessment}</p>
        {report.strengths && report.strengths.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-semibold text-green-700 dark:text-green-300">What looks good</p>
            <ul className="list-disc pl-5 text-sm">
              {report.strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}
        {report.issues && report.issues.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">What to fix</p>
            <ul className="list-disc pl-5 text-sm">
              {report.issues.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-bg p-3">
        <h4 className="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">3. The Extra Mile</h4>
        <p className="text-sm text-fg/90">{report.extraMile}</p>
        {report.extraMileTips && report.extraMileTips.length > 0 && report.extraMile !== "N/A" && (
          <ul className="mt-2 list-disc pl-5 text-sm">
            {report.extraMileTips.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
