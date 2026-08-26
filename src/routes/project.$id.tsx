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

      {tab === "gantt" && (
        <GanttChart
          tasks={project.ganttTasks || []}
          start={project.startDate}
          end={project.endDate}
          projectName={project.name}
          onChange={async (next) => {
            const updated = await updateMeetingProject({
              data: { id: project.id, patch: { ganttTasks: next } },
            });
            if (updated) setProject(updated);
          }}
        />
      )}

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

function formatMDY(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[2]}/${m[3]}/${m[1].slice(2)}`;
    return iso;
  }
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(2);
  return `${mm}/${dd}/${yy}`;
}

function barColor(t: GanttTask) {
  if (t.completed) return "bg-emerald-600";
  if (t.risk === "high") return "bg-red-600";
  if (t.risk === "medium") return "bg-orange-500";
  return "bg-amber-400"; // incomplete default
}

function GanttChart({
  tasks,
  start,
  end,
  projectName,
  onChange,
}: {
  tasks: GanttTask[];
  start?: string | null;
  end?: string | null;
  projectName: string;
  onChange: (tasks: GanttTask[]) => void | Promise<void>;
}) {
  const [local, setLocal] = useState(tasks);
  useEffect(() => setLocal(tasks), [tasks]);

  if (!local.length) {
    return (
      <p className="text-sm text-muted">
        No Gantt tasks yet. Use Refresh AI plan after adding meetings or materials.
      </p>
    );
  }

  const starts = local.map((t) => new Date(t.start).getTime()).filter((n) => !Number.isNaN(n));
  const ends = local.map((t) => new Date(t.end).getTime()).filter((n) => !Number.isNaN(n));
  const min = start ? new Date(start).getTime() : Math.min(...starts);
  const max = end ? new Date(end).getTime() : Math.max(...ends);
  const span = Math.max(max - min, 1);

  function patch(id: string, partial: Partial<GanttTask>) {
    const next = local.map((t) => (t.id === id ? { ...t, ...partial } : t));
    setLocal(next);
    void onChange(next);
  }

  function downloadCsv() {
    const header = "Task,Owner,Lane,Start,End,Completed,Risk,Progress";
    const rows = local.map((t) =>
      [
        t.name,
        t.owner || "",
        t.lane || "",
        formatMDY(t.start),
        formatMDY(t.end),
        t.completed ? "yes" : "no",
        t.completed ? "" : t.risk || "none",
        t.progress ?? "",
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName.replace(/[^a-z0-9]+/gi, "-")}-gantt.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function printGantt() {
    const w = window.open("", "_blank", "noopener,noreferrer,width=960,height=720");
    if (!w) return;
    const rows = local
      .map((t) => {
        const s = new Date(t.start).getTime();
        const e = new Date(t.end).getTime();
        const left = Number.isNaN(s) ? 0 : ((s - min) / span) * 100;
        const width = Number.isNaN(s) || Number.isNaN(e) ? 8 : Math.max(((e - s) / span) * 100, 2);
        const color = t.completed ? "#059669" : t.risk === "high" ? "#dc2626" : t.risk === "medium" ? "#f97316" : "#fbbf24";
        return `<div style="display:grid;grid-template-columns:160px 1fr;gap:8px;align-items:center;margin:6px 0;font-size:12px">
          <div>${t.name}${t.owner ? " · " + t.owner : ""}</div>
          <div style="position:relative;height:22px;background:#f1f5f9;border-radius:4px">
            <div title="${formatMDY(t.start)} – ${formatMDY(t.end)}" style="position:absolute;left:${left}%;width:${width}%;top:3px;height:16px;border-radius:4px;background:${color}"></div>
          </div>
        </div>`;
      })
      .join("");
    w.document.write(`<!doctype html><html><head><title>${projectName} Gantt</title>
      <style>body{font-family:system-ui,sans-serif;padding:24px;color:#111} h1{font-size:18px} .legend span{display:inline-block;width:12px;height:12px;border-radius:2px;margin-right:4px;vertical-align:middle}</style>
      </head><body>
      <h1>${projectName} — Gantt</h1>
      <p class="legend">
        <span style="background:#059669"></span> Completed
        <span style="background:#fbbf24;margin-left:12px"></span> Incomplete
        <span style="background:#f97316;margin-left:12px"></span> Medium risk
        <span style="background:#dc2626;margin-left:12px"></span> High risk
      </p>
      ${rows}
      <script>window.onload=()=>{window.print()}<\/script>
      </body></html>`);
    w.document.close();
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-fg">Gantt</h3>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" className="text-xs" onClick={downloadCsv}>
            Download CSV
          </Button>
          <Button type="button" variant="secondary" className="text-xs" onClick={printGantt}>
            Print / PDF
          </Button>
        </div>
      </div>
      <div className="mb-3 flex flex-wrap gap-3 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1"><span className="size-2.5 rounded-sm bg-emerald-600" /> Completed</span>
        <span className="inline-flex items-center gap-1"><span className="size-2.5 rounded-sm bg-amber-400" /> Incomplete</span>
        <span className="inline-flex items-center gap-1"><span className="size-2.5 rounded-sm bg-orange-500" /> Medium risk</span>
        <span className="inline-flex items-center gap-1"><span className="size-2.5 rounded-sm bg-red-600" /> High risk</span>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[720px] space-y-2">
          {local.map((t) => {
            const s = new Date(t.start).getTime();
            const e = new Date(t.end).getTime();
            const left = Number.isNaN(s) ? 0 : ((s - min) / span) * 100;
            const width = Number.isNaN(s) || Number.isNaN(e) ? 8 : Math.max(((e - s) / span) * 100, 2);
            const tip = `${t.name}: ${formatMDY(t.start)} – ${formatMDY(t.end)}${t.owner ? ` · ${t.owner}` : ""}`;
            return (
              <div key={t.id} className="grid grid-cols-[minmax(120px,160px)_1fr_auto] items-center gap-2 text-xs">
                <div className="truncate text-fg" title={t.name}>
                  {t.name}
                  {t.owner ? <span className="text-muted"> · {t.owner}</span> : null}
                </div>
                <div className="relative h-8 rounded bg-bg">
                  <div
                    className={`absolute top-1.5 h-5 rounded ${barColor(t)} text-[10px] leading-5 text-white shadow-sm`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    title={tip}
                  >
                    <span className="px-1 opacity-90">{t.lane || ""}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <label className="flex items-center gap-1 text-[10px] text-muted">
                    <input
                      type="checkbox"
                      checked={Boolean(t.completed)}
                      onChange={(e) => patch(t.id, { completed: e.target.checked, risk: e.target.checked ? "none" : t.risk })}
                    />
                    Done
                  </label>
                  <select
                    className="rounded border border-border bg-bg px-1 py-0.5 text-[10px]"
                    value={t.completed ? "none" : t.risk || "none"}
                    disabled={Boolean(t.completed)}
                    onChange={(e) =>
                      patch(t.id, { risk: e.target.value as GanttTask["risk"], completed: false })
                    }
                    title="Deadline risk"
                  >
                    <option value="none">On track</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-2 text-[11px] text-muted">Hover a bar for dates (MM/DD/YY). Mark Done or set Medium/High risk for deadline slip.</p>
    </div>
  );
}
