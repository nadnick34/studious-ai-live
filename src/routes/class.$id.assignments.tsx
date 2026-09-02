import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { CaptureBar, capturedToPayloads, type CapturedFile } from "@/components/capture-bar";
import { KidsOwlBanner, useKidsMascot } from "@/components/kids-mascot";
import { Button } from "@/components/ui/button";
import { analyzeAssignment, extractMaterials } from "@/lib/ai";
import {
  createAssignment,
  deleteAssignment,
  getClassById,
  getProfile,
  listAssignments,
  updateAssignment,
} from "@/lib/data";
import { FeedbackActions } from "@/components/feedback-actions";
import { uid } from "@/lib/utils";
import type { AssignmentFeedback, AssignmentRecord, AssignmentSubmission, ClassRecord } from "@/lib/types";

export const Route = createFileRoute("/class/$id/assignments")({
  component: AssignmentsPage,
});

function AssignmentsPage() {
  const { id: classId } = Route.useParams();
  const [cls, setCls] = useState<ClassRecord | null>(null);
  const [rows, setRows] = useState<AssignmentRecord[]>([]);
  const [title, setTitle] = useState("");
  const [paste, setPaste] = useState("");
  const [captured, setCaptured] = useState<CapturedFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<AssignmentFeedback | null>(null);
  const { kidsMode, name: mascotName } = useKidsMascot();

  async function refresh() {
    const [c, list] = await Promise.all([
      getClassById({ data: classId }),
      listAssignments({ data: classId }),
    ]);
    setCls(c);
    setRows(list);
  }

  useEffect(() => {
    void refresh();
  }, [classId]);

  async function handleAnalyze() {
    if (!cls) return;
    if (!title.trim()) {
      setError("Add a short title (e.g. Chapter 1 homework).");
      return;
    }
    if (!paste.trim() && captured.length === 0) {
      setError("Upload or paste the assignment sheet and/or completed work.");
      return;
    }
    setBusy(true);
    setError(null);
    setStatus("Reading uploads…");
    try {
      let material = paste.trim();
      const sourceFiles: string[] = [];
      if (captured.length) {
        const payloads = await capturedToPayloads(captured);
        const extracted = await extractMaterials({ data: { files: payloads } });
        sourceFiles.push(...extracted.attachments.map((a) => a.name));
        if (extracted.text?.trim()) {
          material = [material, extracted.text.trim()].filter(Boolean).join("\n\n");
        }
      }
      if (!material.trim()) {
        setError("Could not read text from the upload. Try a clearer PDF, photo, or paste the text.");
        return;
      }

      setStatus("Analyzing…");
      const profile = await getProfile();
      const feedback = await analyzeAssignment({
        data: {
          className: cls.name,
          classCode: cls.code,
          subject: cls.subject,
          title: title.trim(),
          // Single material blob — model classifies blank vs completed
          instructionsText: material.slice(0, 55000),
          workText: material.slice(0, 55000),
          kidsMode: Boolean(profile.kidsMode),
          childAge: profile.childAge,
          singleMaterial: true,
        },
      });

      const submission: AssignmentSubmission = {
        id: uid("sub"),
        submittedAt: new Date().toISOString(),
        fileNames: sourceFiles,
        workText: material.slice(0, 20000),
        feedback,
      };

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
          : null;

      const asg = await createAssignment({
        data: {
          classId,
          title: title.trim(),
          instructionsText: material.slice(0, 60000),
          sourceFiles,
          guidance,
        },
      });
      await updateAssignment({
        data: {
          id: asg.id,
          patch: { submissions: [submission] },
        },
      });

      setReport(feedback);
      setPaste("");
      setCaptured([]);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setBusy(false);
      setStatus(null);
    }
  }

  if (!cls) {
    return (
      <AppShell title="Assignment assistant">
        <p className="text-sm text-muted">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="Assignment assistant">
      <div className="mb-4 flex items-center justify-between">
        <Link to="/class/$id" params={{ id: classId }} className="text-sm text-teal hover:underline">
          ← Back to class
        </Link>
        <span className="text-xs text-muted">{cls.code}</span>
      </div>

      <KidsOwlBanner
        message={
          kidsMode
            ? `${mascotName} can read the sheet or your finished work in one place.`
            : "Upload the blank sheet, completed work, or both in one box — Studious figures out which is which."
        }
      />

      <div className="mx-auto max-w-2xl space-y-4">
        <section className="space-y-3 rounded-xl border border-border bg-card p-4">
          <h2 className="font-semibold text-fg">Assignment material</h2>
          <p className="text-xs text-muted">
            One upload for everything: directions, blank problems, and/or finished answers (PDF, photo, or scan).
          </p>
          <input
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            placeholder="Title (e.g. Chapter 1 homework)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={busy}
          />
          <CaptureBar items={captured} onChange={setCaptured} disabled={busy} />
          <textarea
            className="min-h-28 w-full rounded-lg border border-border px-3 py-2 text-sm"
            placeholder="Optional: paste text from the assignment or your answers…"
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            disabled={busy}
          />
          {status && <p className="text-xs text-teal">{status}</p>}
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red dark:bg-red-950/30">{error}</p>}
          <Button disabled={busy} onClick={() => void handleAnalyze()}>
            {busy ? "Working…" : "Analyze"}
          </Button>
        </section>

        {report && <ReportView report={report} assignmentTitle={title || "Assignment"} />}

        {rows.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-fg">Recent</h3>
            {rows.slice(0, 8).map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => {
                    const last = a.submissions?.[0]?.feedback;
                    if (last) setReport(last);
                    setTitle(a.title);
                  }}
                >
                  <div className="truncate font-medium text-fg">{a.title}</div>
                  <div className="text-xs text-muted">{new Date(a.createdAt).toLocaleString()}</div>
                </button>
                <button
                  type="button"
                  className="text-xs text-muted hover:text-red"
                  onClick={() => {
                    if (!confirm(`Delete “${a.title}”?`)) return;
                    void deleteAssignment({ data: a.id }).then(refresh);
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </section>
        )}
      </div>
    </AppShell>
  );
}


function ReportView({ report, assignmentTitle }: { report: AssignmentFeedback; assignmentTitle: string }) {
  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-4 print:border-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-fg">Feedback</h3>
        <FeedbackActions title={assignmentTitle || "Assignment"} report={report} />
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
        <h4 className="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">2. Completed Work Assessment</h4>
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
