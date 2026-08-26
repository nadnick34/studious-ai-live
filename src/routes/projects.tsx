import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FolderKanban } from "lucide-react";
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
    if (!name.trim() || selected.length < 1) {
      setError("Enter a project name and select at least one meeting.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createMeetingProject({ data: { name: name.trim(), meetingIds: selected } });
      setShowNew(false);
      setName("");
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
          New project
        </Button>
      }
    >
      <p className="mb-4 text-sm text-muted">
        Group related meetings under a project. Content stays separate; this is organization only.
      </p>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-4 py-14 text-center text-sm text-muted">
          <FolderKanban className="mx-auto mb-3 size-8 opacity-50" />
          No projects yet. Group meetings from here or from the Meetings page.
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => {
            const linked = meetings.filter((m) => p.meetingIds.includes(m.id) || m.projectId === p.id);
            return (
              <div key={p.id} className="rounded-xl border border-border bg-card p-4">
                <div className="font-semibold text-fg">{p.name}</div>
                <div className="mt-1 text-xs text-muted">
                  {linked.length || p.meetingIds.length} meeting{(linked.length || p.meetingIds.length) === 1 ? "" : "s"}
                </div>
                <ul className="mt-3 space-y-1">
                  {(linked.length ? linked : []).map((m) => (
                    <li key={m.id}>
                      <Link to="/meeting/$id" params={{ id: m.id }} className="text-sm text-teal hover:underline">
                        {m.name}
                      </Link>
                      <span className="text-xs text-muted"> · {m.category}</span>
                    </li>
                  ))}
                  {!linked.length && p.meetingIds.map((mid) => (
                    <li key={mid}>
                      <Link to="/meeting/$id" params={{ id: mid }} className="text-sm text-teal hover:underline">
                        Open meeting
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5">
            <h3 className="text-lg font-semibold text-fg">New project</h3>
            <input
              className="mt-3 w-full rounded-lg border border-border px-3 py-2 text-sm"
              placeholder="Project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className="mt-3 max-h-56 space-y-2 overflow-y-auto">
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
              {meetings.length === 0 && <p className="text-sm text-muted">Create a meeting first.</p>}
            </div>
            {error && <p className="mt-2 text-sm text-red">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowNew(false)}>
                Cancel
              </Button>
              <Button disabled={busy} onClick={() => void create()}>
                {busy ? "Saving…" : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
