import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ClipboardList, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CaptureBar, capturedToPayloads, type CapturedFile } from "@/components/capture-bar";
import { KidsOwlBanner } from "@/components/kids-mascot";
import { Button } from "@/components/ui/button";
import { extractMaterials, analyzeAssignment } from "@/lib/ai";
import {
  createAssignment,
  deleteAssignment,
  getClassById,
  getProfile,
  listAssignments,
} from "@/lib/data";
import type { AssignmentRecord, ClassRecord } from "@/lib/types";

export const Route = createFileRoute("/class/$id/assignments")({
  component: AssignmentsPage,
});

function AssignmentsPage() {
  const { id: classId } = Route.useParams();
  const navigate = useNavigate();
  const [cls, setCls] = useState<ClassRecord | null>(null);
  const [rows, setRows] = useState<AssignmentRecord[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [captured, setCaptured] = useState<CapturedFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  async function handleCreate() {
    if (!cls || !title.trim()) {
      setError("Add an assignment title.");
      return;
    }
    if (!instructions.trim() && captured.length === 0) {
      setError("Upload, photograph, scan, or paste the assignment instructions and/or problem sheet.");
      return;
    }
    setBusy(true);
    setError(null);
    setStatus("Reading uploads…");
    try {
      let combined = instructions.trim();
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
        setError("Could not read enough text from the uploads. Paste the instructions or try clearer photos.");
        return;
      }
      setStatus("Analyzing assignment and building how-to guidance…");
      const profile = await getProfile();
      const report = await analyzeAssignment({
        data: {
          className: cls.name,
          classCode: cls.code,
          subject: cls.subject,
          title: title.trim(),
          instructionsText: combined.slice(0, 55000),
          kidsMode: Boolean(profile.kidsMode),
          childAge: profile.childAge,
        },
      });
      const guidance = {
        summary: report.reviewOfAssignment === "TBD" ? "" : report.reviewOfAssignment,
        steps: report.reviewSteps || [],
        ideas: [] as string[],
        tips: [] as string[],
        checklist: [] as string[],
        warnings: [] as string[],
        problemGuides: report.problemGuides || [],
      };
      const asg = await createAssignment({
        data: {
          classId,
          title: title.trim(),
          instructionsText: combined.slice(0, 60000),
          sourceFiles,
          guidance,
        },
      });
      setShowNew(false);
      setTitle("");
      setInstructions("");
      setCaptured([]);
      await navigate({
        to: "/class/$id/assignment/$assignmentId",
        params: { id: classId, assignmentId: asg.id },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create assignment help");
    } finally {
      setBusy(false);
      setStatus(null);
    }
  }

  if (!cls) {
    return (
      <AppShell title="Assignments">
        <p className="text-sm text-muted">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Assignment Assistant"
      right={
        <Button className="min-h-10 text-xs" onClick={() => setShowNew(true)}>
          <Plus className="size-4" />
          New assignment
        </Button>
      }
    >
      <div className="mb-4 flex items-center justify-between">
        <Link to="/class/$id" params={{ id: classId }} className="text-sm text-teal hover:underline">
          ← Back to class
        </Link>
        <span className="text-xs text-muted">{cls.code}</span>
      </div>

      <KidsOwlBanner message="Upload the sheet or problems — get how-tos and examples, then check your finished work." />

      <p className="mb-4 text-sm text-muted">
        Upload the assignment instructions and/or the actual questions and problems (files, photo, or scan). Studious
        analyzes the sheet and gives brief how-tos with examples. It does not complete the assignment for you.
      </p>

      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red dark:bg-red-950/30">{error}</p>}

      {showNew && (
        <div className="mb-5 space-y-3 rounded-xl border border-border bg-card p-4">
          <h3 className="font-semibold text-fg">New assignment help</h3>
          <input
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            placeholder="Assignment title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={busy}
          />
          <div>
            <p className="mb-2 text-xs font-medium text-muted">Upload instructions and/or problem sheet</p>
            <CaptureBar items={captured} onChange={setCaptured} disabled={busy} />
          </div>
          <textarea
            className="min-h-28 w-full rounded-lg border border-border px-3 py-2 text-sm"
            placeholder="Optional: paste extra instructions or questions here…"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            disabled={busy}
          />
          {status && <p className="text-xs text-teal">{status}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" disabled={busy} onClick={() => setShowNew(false)}>
              Cancel
            </Button>
            <Button disabled={busy} onClick={() => void handleCreate()}>
              {busy ? "Working…" : "Analyze & get how-tos"}
            </Button>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-4 py-12 text-center text-sm text-muted">
          <ClipboardList className="mx-auto mb-3 size-8 opacity-50" />
          No assignments yet. Add one to get problem-by-problem guidance.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
              <Link
                to="/class/$id/assignment/$assignmentId"
                params={{ id: classId, assignmentId: a.id }}
                className="min-w-0 flex-1"
              >
                <div className="font-semibold text-fg">{a.title}</div>
                <div className="text-xs text-muted">
                  {a.guidance?.problemGuides?.length
                    ? `${a.guidance.problemGuides.length} problem guide(s)`
                    : "Plan ready"}
                  {a.submissions.length ? ` · ${a.submissions.length} check(s)` : ""} ·{" "}
                  {new Date(a.createdAt).toLocaleDateString()}
                </div>
              </Link>
              <button
                type="button"
                className="text-muted hover:text-red"
                aria-label="Delete"
                onClick={() => {
                  if (!confirm(`Delete “${a.title}”?`)) return;
                  void deleteAssignment({ data: a.id }).then(refresh);
                }}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
