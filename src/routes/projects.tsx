import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FolderKanban, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { createMeetingProject, listMeetingProjects, listMeetings } from "@/lib/data";
import type { MeetingProject, MeetingRecord } from "@/lib/types";

export const Route = createFileRoute("/projects")({ component: ProjectsPage });

function ProjectsPage() {
  const [projects, setProjects] = useState<MeetingProject[]>([]);
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const [p, m] = await Promise.all([listMeetingProjects(), listMeetings()]);
    setProjects(p);
    setMeetings(m);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function create() {
    if (!name.trim()) {
      setError("Enter a project name.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createMeetingProject({
        data: {
          name: name.trim(),
          description: description.trim(),
          meetingIds: selected,
          startDate: startDate || null,
          endDate: endDate || null,
        },
      });
      setShowNew(false);
      setName("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      setSelected([]);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create project");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell
      title="Projects"
      right={
        <Button className="min-h-10 text-xs" onClick={() => setShowNew(true)}>
          <Plus className="size-4" />
          Ad-hoc project
        </Button>
      }
    >
      <p className="mb-4 text-sm text-muted">
        Coordinate work across meetings, files, deadlines, signatures, and stakeholders. Create an ad-hoc project anytime —
        linking meetings is optional.
      </p>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-4 py-14 text-center text-sm text-muted">
          <FolderKanban className="mx-auto mb-3 size-8 opacity-50" />
          No projects yet. Start an ad-hoc project for discovery, kickoff, compliance, and weekly cadence.
          <div className="mt-4">
            <Button onClick={() => setShowNew(true)}>Ad-hoc project</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => {
            const linked = meetings.filter((m) => p.meetingIds.includes(m.id) || m.projectId === p.id);
            return (
              <Link
                key={p.id}
                to="/project/$id"
                params={{ id: p.id }}
                className="block rounded-xl border border-border bg-card p-4 hover:border-teal/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-fg">{p.name}</div>
                    <div className="mt-0.5 text-xs text-muted capitalize">
                      {p.status || "active"}
                      {p.startDate ? ` · ${p.startDate}` : ""}
                      {p.endDate ? ` → ${p.endDate}` : ""}
                    </div>
                    {p.description && <p className="mt-2 line-clamp-2 text-sm text-fg/80">{p.description}</p>}
                    <p className="mt-2 text-xs text-muted">
                      {linked.length || p.meetingIds.length} meeting
                      {(linked.length || p.meetingIds.length) === 1 ? "" : "s"}
                      {p.ganttTasks?.length ? ` · ${p.ganttTasks.length} plan tasks` : ""}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-5">
            <h3 className="text-lg font-semibold text-fg">Ad-hoc project</h3>
            <p className="mt-1 text-sm text-muted">
              For a PM coordinating meetings, files, deadlines, signatures, and stakeholder updates.
            </p>
            <input
              className="mt-3 w-full rounded-lg border border-border px-3 py-2 text-sm"
              placeholder="Project name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <textarea
              className="mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm"
              placeholder="Description / objective"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="text-xs text-muted">
                Start
                <input type="date" className="mt-1 w-full rounded-lg border border-border px-2 py-2 text-sm" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </label>
              <label className="text-xs text-muted">
                End
                <input type="date" className="mt-1 w-full rounded-lg border border-border px-2 py-2 text-sm" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </label>
            </div>
            <p className="mt-3 text-xs font-semibold text-muted">Link meetings (optional)</p>
            <div className="mt-1 max-h-40 space-y-2 overflow-y-auto">
              {meetings.map((m) => (
                <label key={m.id} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selected.includes(m.id)}
                    onChange={(e) =>
                      setSelected((prev) => (e.target.checked ? [...prev, m.id] : prev.filter((x) => x !== m.id)))
                    }
                  />
                  <span className="truncate">{m.name}</span>
                </label>
              ))}
              {meetings.length === 0 && <p className="text-sm text-muted">No meetings yet — you can still create the project.</p>}
            </div>
            {error && <p className="mt-2 text-sm text-red">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowNew(false)}>
                Cancel
              </Button>
              <Button disabled={busy} onClick={() => void create()}>
                {busy ? "Saving…" : "Create project"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
