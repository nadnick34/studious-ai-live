import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { KidsOwlBanner, useKidsMascot } from "@/components/kids-mascot";
import { Button } from "@/components/ui/button";
import { CaptureBar, capturedToPayloads, type CapturedFile } from "@/components/capture-bar";
import { checkAssignmentWork, extractMaterials } from "@/lib/ai";
import { getAssignmentById, getClassById, getProfile, updateAssignment } from "@/lib/data";
import { uid } from "@/lib/utils";
import type { AssignmentRecord, AssignmentSubmission, ClassRecord } from "@/lib/types";

export const Route = createFileRoute("/class/$id/assignment/$assignmentId")({
  component: AssignmentDetailPage,
});

function AssignmentDetailPage() {
  const { id: classId, assignmentId } = Route.useParams();
  const [cls, setCls] = useState<ClassRecord | null>(null);
  const [asg, setAsg] = useState<AssignmentRecord | null>(null);
  const [workText, setWorkText] = useState("");
  const [captured, setCaptured] = useState<CapturedFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { kidsMode, name: mascotName } = useKidsMascot();

  useEffect(() => {
    void Promise.all([getClassById({ data: classId }), getAssignmentById({ data: assignmentId })]).then(
      ([c, a]) => {
        setCls(c);
        setAsg(a);
      },
    );
  }, [classId, assignmentId]);

  async function handleCheck() {
    if (!cls || !asg) return;
    if (!workText.trim() && captured.length === 0) {
      setError("Paste, upload, photograph, or scan your finished work first.");
      return;
    }
    setBusy(true);
    setError(null);
    setStatus(captured.length ? "Reading your work…" : null);
    try {
      let combined = workText.trim();
      const sourceFiles: string[] = [];
      if (captured.length) {
        const payloads = await capturedToPayloads(captured);
        const extracted = await extractMaterials({ data: { files: payloads } });
        sourceFiles.push(...extracted.attachments.map((a) => a.name));
        if (extracted.text?.trim()) {
          combined = [combined, extracted.text.trim()].filter(Boolean).join("\n\n");
        }
      }
      if (!combined.trim()) {
        setError("Could not read enough text from your work. Paste it or try a clearer photo/scan.");
        return;
      }
      setStatus("Checking against the assignment…");
      const profile = await getProfile();
      const feedback = await checkAssignmentWork({
        data: {
          className: cls.name,
          classCode: cls.code,
          subject: cls.subject,
          title: asg.title,
          instructionsText: asg.instructionsText,
          workText: combined.slice(0, 50000),
          kidsMode: Boolean(profile.kidsMode),
          childAge: profile.childAge,
        },
      });
      const submission: AssignmentSubmission = {
        id: uid("sub"),
        submittedAt: new Date().toISOString(),
        fileNames: sourceFiles,
        workText: combined.slice(0, 20000),
        feedback,
      };
      const submissions = [submission, ...(asg.submissions || [])];
      await updateAssignment({ data: { id: asg.id, patch: { submissions } } });
      setAsg({ ...asg, submissions });
      setWorkText("");
      setCaptured([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Check failed");
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

  const g = asg.guidance;

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
            ? `${mascotName} can help you plan — then check your work when you’re done.`
            : "Plan first. Check your finished draft before you turn it in."
        }
      />

      <div className="mx-auto max-w-2xl space-y-5">
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-2 text-lg font-semibold text-fg">{asg.title}</h2>
          {asg.sourceFiles?.length > 0 && (
            <p className="mb-2 text-xs text-muted">Sources: {asg.sourceFiles.join(", ")}</p>
          )}
          <details className="text-sm">
            <summary className="cursor-pointer text-teal">View instructions</summary>
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-bg p-3 text-xs text-fg">
              {asg.instructionsText}
            </pre>
          </details>
        </section>

        {g && (
          <section className="rounded-xl border border-border bg-card p-4 space-y-4">
            <h3 className="font-semibold text-fg">Recommendations & plan</h3>
            <p className="text-sm leading-relaxed text-fg/90">{g.summary}</p>
            <Block title="Steps" items={g.steps} />
            <Block title="Ideas" items={g.ideas} />
            <Block title="Tips" items={g.tips} />
            <Block title="Checklist" items={g.checklist} />
            {g.warnings && g.warnings.length > 0 && <Block title="Watch-outs" items={g.warnings} />}

            {g.problemGuides && g.problemGuides.length > 0 && (
              <div className="space-y-3 border-t border-border pt-4">
                <h4 className="text-sm font-semibold text-fg">Problem-by-problem how-tos</h4>
                <p className="text-xs text-muted">
                  Based on the questions and problems on your uploaded sheet. Examples show the approach — not a full
                  answer key.
                </p>
                {g.problemGuides.map((pg, i) => (
                  <div key={pg.id || i} className="rounded-xl border border-border bg-bg p-3 space-y-2">
                    <p className="text-sm font-semibold text-fg">
                      {i + 1}. {pg.problem}
                    </p>
                    <div>
                      <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">How to</p>
                      <p className="text-sm text-fg/90">{pg.howTo}</p>
                    </div>
                    <div className="rounded-lg border border-teal/20 bg-teal/5 px-3 py-2">
                      <p className="text-[11px] font-semibold tracking-wide text-teal uppercase">Example</p>
                      <p className="text-sm text-fg/90">{pg.example}</p>
                    </div>
                    {pg.tips && pg.tips.length > 0 && <Block title="Tips" items={pg.tips} />}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <section className="rounded-xl border-2 border-teal/30 bg-card p-4 space-y-3">
          <h3 className="font-semibold text-fg">Assignment checker</h3>
          <p className="text-xs text-muted">
            Upload or paste your finished work. Studious will compare it to the instructions and suggest improvements —
            it will not write the paper for you.
          </p>
          <div>
            <p className="mb-2 text-xs font-medium text-muted">Upload finished work (files, photo, or scan)</p>
            <CaptureBar items={captured} onChange={setCaptured} disabled={busy} />
          </div>
          <textarea
            className="min-h-28 w-full rounded-lg border border-border px-3 py-2 text-sm"
            placeholder="Optional: paste extra text from your draft…"
            value={workText}
            onChange={(e) => setWorkText(e.target.value)}
            disabled={busy}
          />
          {status && <p className="text-xs text-teal">{status}</p>}
          {error && <p className="text-sm text-red">{error}</p>}
          <Button disabled={busy} onClick={() => void handleCheck()}>
            {busy ? "Checking…" : "Check my work"}
          </Button>
        </section>

        {asg.submissions?.length > 0 && (
          <section className="space-y-3">
            <h3 className="font-semibold text-fg">Previous checks</h3>
            {asg.submissions.map((s) => (
              <div key={s.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
                <p className="text-xs text-muted">{new Date(s.submittedAt).toLocaleString()}</p>
                <p className="text-sm font-medium text-fg">{s.feedback.overall}</p>
                {s.feedback.scoreHint && <p className="text-xs text-teal">{s.feedback.scoreHint}</p>}
                <Block title="Strengths" items={s.feedback.strengths} />
                <Block title="Improvements" items={s.feedback.improvements} />
                <Block title="Next steps" items={s.feedback.nextSteps} />
              </div>
            ))}
          </section>
        )}
      </div>
    </AppShell>
  );
}

function Block({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <h4 className="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">{title}</h4>
      <ul className="list-disc space-y-1 pl-5 text-sm text-fg/90">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
