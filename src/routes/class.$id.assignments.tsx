import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ClipboardList, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { KidsOwlBanner } from "@/components/kids-mascot";
import { Button } from "@/components/ui/button";
import { generateAssignmentGuidance } from "@/lib/ai";
import {
  createAssignment,
  deleteAssignment,
  getClassById,
  getProfile,
  listAssignments,
} from "@/lib/data";
import { extractPdfText, uid } from "@/lib/utils";
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
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
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

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const names: string[] = [];
    let text = instructions;
    for (const f of files) {
      names.push(f.name);
      try {
        if (f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")) {
          text += `\n\n--- ${f.name} ---\n` + (await extractPdfText(f));
        } else if (f.type.startsWith("text/") || /\.(txt|md|docx?)$/i.test(f.name)) {
          text += `\n\n--- ${f.name} ---\n` + (await f.text());
        } else if (f.type.startsWith("image/")) {
          text += `\n\n[Image uploaded: ${f.name}. Describe any written instructions if needed.]`;
        }
      } catch {
        text += `\n\n[Could not read ${f.name}]`;
      }
    }
    setFileNames((prev) => [...prev, ...names]);
    setInstructions(text.slice(0, 60000));
  }

  async function handleCreate() {
    if (!cls || !title.trim() || !instructions.trim()) {
      setError("Add a title and assignment instructions (paste or upload).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const profile = await getProfile();
      const guidance = await generateAssignmentGuidance({
        data: {
          className: cls.name,
          classCode: cls.code,
          subject: cls.subject,
          title: title.trim(),
          instructionsText: instructions.trim(),
          kidsMode: Boolean(profile.kidsMode),
          childAge: profile.childAge,
        },
      });
      const asg = await createAssignment({
        data: {
          classId,
          title: title.trim(),
          instructionsText: instructions.trim(),
          sourceFiles: fileNames,
          guidance,
        },
      });
      setShowNew(false);
      setTitle("");
      setInstructions("");
      setFileNames([]);
      await navigate({ to: "/class/$id/assignment/$assignmentId", params: { id: classId, assignmentId: asg.id } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create assignment help");
    } finally {
      setBusy(false);
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

      <KidsOwlBanner message="Upload the assignment sheet, get a plan, then check your finished work." />

      <p className="mb-4 text-sm text-muted">
        Upload or paste the assignment instructions. Studious gives recommendations and ideas — then you can upload
        finished work for feedback. It does not write the assignment for you.
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
          />
          <textarea
            className="min-h-36 w-full rounded-lg border border-border px-3 py-2 text-sm"
            placeholder="Paste assignment instructions here…"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />
          <div>
            <label className="mb-1 block text-xs text-muted">Or upload sheet (PDF, text, image)</label>
            <input type="file" multiple accept=".pdf,.txt,.md,.png,.jpg,.jpeg,.doc,.docx" onChange={(e) => void onFile(e)} />
            {fileNames.length > 0 && <p className="mt-1 text-xs text-muted">{fileNames.join(", ")}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowNew(false)}>
              Cancel
            </Button>
            <Button disabled={busy} onClick={() => void handleCreate()}>
              {busy ? "Building plan…" : "Get recommendations"}
            </Button>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-4 py-12 text-center text-sm text-muted">
          <ClipboardList className="mx-auto mb-3 size-8 opacity-50" />
          No assignments yet. Add one to get a plan and later check your work.
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
                  {a.submissions.length ? `${a.submissions.length} check(s)` : "Plan ready"} ·{" "}
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
