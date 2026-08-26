import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { CaptureBar, capturedToPayloads, type CapturedFile } from "@/components/capture-bar";
import { Button } from "@/components/ui/button";
import { extractMaterials, generateProjectIntelligence } from "@/lib/ai";
import {
  getMeetingProjectById,
  listMeetingSessions,
  listMeetings,
  updateMeetingProject,
} from "@/lib/data";
import type { GanttTask, MeetingProject, MeetingRecord, ProjectMaterial } from "@/lib/types";
import { uid } from "@/lib/utils";

export const Route = createFileRoute("/project/$id")({
  component: ProjectDetailPage,
});

function ProjectDetailPage() {
  const { id } = Route.useParams();
  const [project, setProject] = useState<MeetingProject | null>(null);
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<CapturedFile[]>([]);
  const [tab, setTab] = useState<"overview" | "gantt" | "materials" | "meetings">("overview");

  async function refresh() {
    const [p, m] = await Promise.all([getMeetingProjectById({ data: id }), listMeetings()]);
    setProject(p);
    setMeetings(m);
  }

  useEffect(() => {
    void refresh();
  }, [id]);

  const linked = useMemo(() => {
    if (!project) return [];
    return meetings.filter((m) => project.meetingIds.includes(m.id) || m.projectId === project.id);
  }, [project, meetings]);

  async function rebuildIntelligence() {
    if (!project) return;
    setBusy(true);
    setError(null);
    setStatus("Gathering meeting notes and materials…");
    try {
      let meetingContext = "";
      for (const m of linked) {
        meetingContext += `\n## Meeting: ${m.name}\nSubject: ${m.subject}\nAgenda: ${m.agendaText}\nNotes: ${m.miscNotes}\n`;
        const sessions = await listMeetingSessions({ data: m.id });
        for (const s of sessions) {
          meetingContext += `Session ${s.name}: ${JSON.stringify(s.notes).slice(0, 4000)}\nActions: ${JSON.stringify(s.actionItems).slice(0, 2000)}\n`;
        }
      }
      let materialText = project.materials.map((x) => `${x.name}: ${x.notes || ""}`).join("\n");
      if (files.length) {
        setStatus("Reading uploads…");
        const payloads = await capturedToPayloads(files);
        const extracted = await extractMaterials({ data: { files: payloads } });
        materialText += "\n" + (extracted.text || "");
        const added: ProjectMaterial[] = extracted.attachments.map((a) => ({
          id: uid("pm"),
          name: a.name,
          kind: a.kind,
          notes: (a.extractedText || "").slice(0, 500),
          needsSignature: /sign|signature|approve/i.test(a.name + (a.extractedText || "")),
          signed: false,
          addedAt: new Date().toISOString(),
        }));
        await updateMeetingProject({
          data: {
            id: project.id,
            patch: { materials: [...(project.materials || []), ...added] },
          },
        });
      }
      setStatus("Building plan, Gantt, and status summary…");
      const intel = await generateProjectIntelligence({
        data: {
          projectName: project.name,
          description: project.description,
          startDate: project.startDate,
          endDate: project.endDate,
          meetingContext,
          materialText,
        },
      });
      const updated = await updateMeetingProject({
        data: {
          id: project.id,
          patch: {
            statusSummary: intel.statusSummary || "",
            ganttTasks: (intel.ganttTasks || []) as GanttTask[],
            stakeholders: intel.stakeholders || project.stakeholders,
            plan: intel.plan || project.plan,
            materials: intel.materials?.length
              ? [
                  ...(project.materials || []),
                  ...intel.materials.map((m: ProjectMaterial) => ({
                    ...m,
                    id: m.id || uid("pm"),
                    addedAt: m.addedAt || new Date().toISOString(),
                  })),
                ]
              : project.materials,
          },
        },
      });
      setProject(updated);
      setFiles([]);
      setStatus("Updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not build project view");
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  if (!project) {
    return (
      <AppShell title="Project">
        <p className="text-sm text-muted">Loading…</p>
      </AppShell>
    );
  }

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "gantt" as const, label: "Gantt" },
    { id: "materials" as const, label: "Materials" },
    { id: "meetings" as const, label: "Meetings" },
  ];

  return (
    <AppShell
      title={project.name}
      right={
        <Button className="min-h-10 text-xs" disabled={busy} onClick={() => void rebuildIntelligence()}>
          {busy ? "Working…" : "Refresh AI plan"}
        </Button>
      }
    >
      <Link to="/projects" className="mb-4 inline-block text-sm text-teal hover:underline">
        ← Projects
      </Link>

      <div className="mb-4 rounded-xl border border-border bg-card p-4">
        <div className="text-xs capitalize text-muted">{project.status}</div>
        <h2 className="text-lg font-semibold text-fg">{project.name}</h2>
        {project.description && <p className="mt-1 text-sm text-fg/85">{project.description}</p>}
        <p className="mt-2 text-xs text-muted">
          {project.startDate || "Start TBD"} → {project.endDate || "End TBD"}
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              tab === t.id ? "bg-slate text-white" : "border border-border bg-card text-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {status && <p className="mb-2 text-xs text-teal">{status}</p>}
      {error && <p className="mb-2 text-sm text-red">{error}</p>}

      {tab === "overview" && (
        <div className="mx-auto max-w-2xl space-y-4">
          <section className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-2 font-semibold text-fg">Status summary</h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg/90">
              {project.statusSummary || "Click “Refresh AI plan” to generate a coordinator status summary from meetings and materials."}
            </p>
          </section>
          {project.plan && Object.keys(project.plan).length > 0 && (
            <section className="rounded-xl border border-border bg-card p-4 text-sm">
              <h3 className="mb-2 font-semibold text-fg">Plan</h3>
              {Array.isArray((project.plan as { phases?: string[] }).phases) && (
                <div className="mb-2">
                  <p className="text-xs font-semibold text-muted">Phases</p>
                  <ul className="list-disc pl-5">
                    {((project.plan as { phases: string[] }).phases || []).map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
              )}
              {Array.isArray((project.plan as { discovery?: string[] }).discovery) && (
                <div className="mb-2">
                  <p className="text-xs font-semibold text-muted">Discovery</p>
                  <ul className="list-disc pl-5">
                    {((project.plan as { discovery: string[] }).discovery || []).map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
              )}
              {Array.isArray((project.plan as { weeklyCadence?: string[] }).weeklyCadence) && (
                <div className="mb-2">
                  <p className="text-xs font-semibold text-muted">Weekly cadence</p>
                  <ul className="list-disc pl-5">
                    {((project.plan as { weeklyCadence: string[] }).weeklyCadence || []).map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}
          {project.stakeholders?.length > 0 && (
            <section className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-2 font-semibold text-fg">Stakeholders</h3>
              <ul className="space-y-1 text-sm">
                {project.stakeholders.map((s) => (
                  <li key={s.id}>
                    <span className="font-medium">{s.name}</span>
                    {s.role && <span className="text-muted"> · {s.role}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-2 text-sm font-semibold text-fg">Add materials for plan refresh</h3>
            <CaptureBar items={files} onChange={setFiles} disabled={busy} />
          </section>
        </div>
      )}

      {tab === "gantt" && <GanttChart tasks={project.ganttTasks || []} start={project.startDate} end={project.endDate} />}

      {tab === "materials" && (
        <div className="mx-auto max-w-xl space-y-2">
          {(project.materials || []).length === 0 ? (
            <p className="text-sm text-muted">No materials yet. Upload on Overview and refresh the AI plan.</p>
          ) : (
            project.materials.map((m) => (
              <div key={m.id} className="rounded-xl border border-border bg-card p-3 text-sm">
                <div className="font-medium text-fg">{m.name}</div>
                <div className="text-xs text-muted">
                  {m.kind || "file"}
                  {m.owner ? ` · ${m.owner}` : ""}
                  {m.needsSignature ? (m.signed ? " · Signed" : " · Signature needed") : ""}
                </div>
                {m.notes && <p className="mt-1 text-fg/80">{m.notes}</p>}
              </div>
            ))
          )}
        </div>
      )}

      {tab === "meetings" && (
        <div className="mx-auto max-w-xl space-y-2">
          {linked.length === 0 ? (
            <p className="text-sm text-muted">No meetings linked. Link them when creating a project, or from a future edit.</p>
          ) : (
            linked.map((m) => (
              <Link
                key={m.id}
                to="/meeting/$id"
                params={{ id: m.id }}
                className="block rounded-xl border border-border bg-card p-3 hover:border-teal/40"
              >
                <div className="font-medium text-fg">{m.name}</div>
                <div className="text-xs text-muted">
                  {m.category} · {m.meetingType}
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </AppShell>
  );
}

function GanttChart({
  tasks,
  start,
  end,
}: {
  tasks: GanttTask[];
  start?: string | null;
  end?: string | null;
}) {
  if (!tasks.length) {
    return <p className="text-sm text-muted">No Gantt tasks yet. Use Refresh AI plan after adding meetings or materials.</p>;
  }
  const starts = tasks.map((t) => new Date(t.start).getTime()).filter((n) => !Number.isNaN(n));
  const ends = tasks.map((t) => new Date(t.end).getTime()).filter((n) => !Number.isNaN(n));
  const min = start ? new Date(start).getTime() : Math.min(...starts);
  const max = end ? new Date(end).getTime() : Math.max(...ends);
  const span = Math.max(max - min, 1);

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 font-semibold text-fg">Gantt</h3>
      <div className="min-w-[640px] space-y-2">
        {tasks.map((t) => {
          const s = new Date(t.start).getTime();
          const e = new Date(t.end).getTime();
          const left = Number.isNaN(s) ? 0 : ((s - min) / span) * 100;
          const width = Number.isNaN(s) || Number.isNaN(e) ? 8 : Math.max(((e - s) / span) * 100, 2);
          return (
            <div key={t.id} className="grid grid-cols-[140px_1fr] items-center gap-2 text-xs">
              <div className="truncate text-fg" title={t.name}>
                {t.name}
                {t.owner ? <span className="text-muted"> · {t.owner}</span> : null}
              </div>
              <div className="relative h-7 rounded bg-bg">
                <div
                  className="absolute top-1 h-5 rounded bg-slate/80 text-[10px] leading-5 text-white"
                  style={{ left: `${left}%`, width: `${width}%` }}
                  title={`${t.start} → ${t.end}`}
                >
                  <span className="px-1">{t.lane || ""}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
