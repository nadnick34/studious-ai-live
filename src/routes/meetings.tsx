import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Briefcase, FolderKanban, Pencil, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CaptureBar, capturedToPayloads, type CapturedFile } from "@/components/capture-bar";
import { Button } from "@/components/ui/button";
import { extractMaterials, parseMeetingInvite } from "@/lib/ai";
import {
  createMeeting,
  createMeetingProject,
  listMeetingProjects,
  listMeetings,
  updateMeeting,
} from "@/lib/data";
import {
  MEETING_CATEGORIES,
  MEETING_TYPES,
  type MeetingCategory,
  type MeetingProject,
  type MeetingRecord,
  type MeetingType,
} from "@/lib/types";

export const Route = createFileRoute("/meetings")({ component: MeetingsPage });

const emptyForm = {
  name: "",
  category: "Regular Work" as MeetingCategory,
  organizer: "",
  meetingType: "In-Person" as MeetingType,
  subject: "",
  companyName: "",
  location: "",
  meetingAt: "",
  attendees: "",
  miscNotes: "",
  agendaText: "",
  inviteText: "",
};

function MeetingsPage() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [projects, setProjects] = useState<MeetingProject[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MeetingRecord | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [inviteFiles, setInviteFiles] = useState<CapturedFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showProject, setShowProject] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  async function refresh() {
    const [m, p] = await Promise.all([listMeetings(), listMeetingProjects()]);
    setMeetings(m);
    setProjects(p);
  }

  useEffect(() => {
    void refresh();
  }, []);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setInviteFiles([]);
    setShowForm(true);
  }

  function openEdit(m: MeetingRecord, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setEditing(m);
    setForm({
      name: m.name,
      category: m.category,
      organizer: m.organizer,
      meetingType: m.meetingType,
      subject: m.subject,
      companyName: m.companyName,
      location: m.location,
      meetingAt: m.meetingAt ? m.meetingAt.slice(0, 16) : "",
      attendees: m.attendees,
      miscNotes: m.miscNotes,
      agendaText: m.agendaText,
      inviteText: m.inviteText,
    });
    setInviteFiles([]);
    setShowForm(true);
  }

  async function parseInvite() {
    setBusy(true);
    setError(null);
    try {
      let text = form.inviteText;
      if (inviteFiles.length) {
        const payloads = await capturedToPayloads(inviteFiles);
        const extracted = await extractMaterials({ data: { files: payloads } });
        text = [text, extracted.text].filter(Boolean).join("\n\n");
      }
      if (!text.trim()) {
        setError("Paste invite text or upload the invite/email first.");
        return;
      }
      const parsed = await parseMeetingInvite({ data: { text } });
      setForm((f) => ({
        ...f,
        name: parsed.name || f.name,
        category: (MEETING_CATEGORIES.includes(parsed.category) ? parsed.category : f.category) as MeetingCategory,
        organizer: parsed.organizer || f.organizer,
        meetingType: (MEETING_TYPES.includes(parsed.meetingType) ? parsed.meetingType : f.meetingType) as MeetingType,
        subject: parsed.subject || f.subject,
        companyName: parsed.companyName || f.companyName,
        location: parsed.location || f.location,
        meetingAt: parsed.meetingAt ? String(parsed.meetingAt).slice(0, 16) : f.meetingAt,
        attendees: parsed.attendees || f.attendees,
        agendaText: parsed.agendaText || f.agendaText,
        miscNotes: parsed.miscNotes || f.miscNotes,
        inviteText: text,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not parse invite");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!form.name.trim()) {
      setError("Meeting name is required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category,
        organizer: form.organizer,
        meetingType: form.meetingType,
        subject: form.subject,
        companyName: form.companyName,
        location: form.location,
        meetingAt: form.meetingAt ? new Date(form.meetingAt).toISOString() : null,
        attendees: form.attendees,
        miscNotes: form.miscNotes,
        agendaText: form.agendaText,
        inviteText: form.inviteText,
      };
      if (editing) {
        await updateMeeting({ data: { id: editing.id, patch: payload } });
        setShowForm(false);
        await refresh();
      } else {
        const m = await createMeeting({ data: payload });
        setShowForm(false);
        await navigate({ to: "/meeting/$id", params: { id: m.id } });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveProject() {
    if (!projectName.trim() || selected.length < 2) {
      setError("Name the project and select at least two meetings.");
      return;
    }
    setBusy(true);
    try {
      await createMeetingProject({ data: { name: projectName.trim(), meetingIds: selected } });
      setShowProject(false);
      setSelected([]);
      setProjectName("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Project failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell
      title="Meetings"
      right={
        <div className="flex gap-1.5">
          <Button variant="secondary" className="min-h-10 text-xs" onClick={() => setShowProject(true)}>
            <FolderKanban className="size-4" />
            Project
          </Button>
          <Button className="min-h-10 text-xs" onClick={openNew}>
            <Plus className="size-4" />
            New meeting
          </Button>
        </div>
      }
    >
      <p className="mb-4 text-sm text-muted">
        Capture meetings, generate notes, focus items, and action items. Student class data stays separate.
      </p>

      {projects.length > 0 && (
        <div className="mb-5 space-y-2">
          <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">Projects</h3>
          {projects.map((p) => (
            <div key={p.id} className="rounded-xl border border-border bg-card px-4 py-3">
              <div className="font-semibold text-fg">{p.name}</div>
              <div className="text-xs text-muted">{p.meetingIds.length} meetings grouped</div>
            </div>
          ))}
        </div>
      )}

      {meetings.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-4 py-14 text-center text-sm text-muted">
          <Briefcase className="mx-auto mb-3 size-8 opacity-50" />
          No meetings yet. Create one to start capturing notes and actions.
          <div className="mt-4">
            <Button onClick={openNew}>New meeting</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map((m) => (
            <Link
              key={m.id}
              to="/meeting/$id"
              params={{ id: m.id }}
              className="block rounded-xl border border-border bg-card p-4 hover:border-teal/40"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-fg">{m.name}</div>
                  <div className="mt-0.5 text-xs text-muted">
                    {m.category} · {m.meetingType}
                    {m.companyName ? ` · ${m.companyName}` : ""}
                  </div>
                  {m.subject && <div className="mt-1 text-sm text-fg/80">{m.subject}</div>}
                  {m.meetingAt && (
                    <div className="mt-1 text-xs text-muted">{new Date(m.meetingAt).toLocaleString()}</div>
                  )}
                </div>
                <button
                  type="button"
                  className="grid size-9 place-items-center rounded-lg text-muted hover:bg-bg hover:text-fg"
                  aria-label="Edit"
                  onClick={(e) => openEdit(m, e)}
                >
                  <Pencil className="size-4" />
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-5">
            <h3 className="text-lg font-semibold text-fg">{editing ? "Edit meeting" : "New meeting"}</h3>
            <div className="mt-3 space-y-3">
              <Field label="Meeting name *">
                <input className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Category">
                  <select className="field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as MeetingCategory })}>
                    {MEETING_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Meeting type">
                  <select className="field" value={form.meetingType} onChange={(e) => setForm({ ...form, meetingType: e.target.value as MeetingType })}>
                    {MEETING_TYPES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Organizer">
                <input className="field" value={form.organizer} onChange={(e) => setForm({ ...form, organizer: e.target.value })} />
              </Field>
              <Field label="Subject">
                <input className="field" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Company">
                  <input className="field" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
                </Field>
                <Field label="Location">
                  <input className="field" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                </Field>
              </div>
              <Field label="Date / time">
                <input type="datetime-local" className="field" value={form.meetingAt} onChange={(e) => setForm({ ...form, meetingAt: e.target.value })} />
              </Field>
              <Field label="Attendees">
                <textarea className="field min-h-16" placeholder="Comma-separated names or emails" value={form.attendees} onChange={(e) => setForm({ ...form, attendees: e.target.value })} />
              </Field>
              <Field label="Agenda (paste or upload below)">
                <textarea className="field min-h-20" value={form.agendaText} onChange={(e) => setForm({ ...form, agendaText: e.target.value })} />
              </Field>
              <Field label="Misc notes">
                <textarea className="field min-h-16" value={form.miscNotes} onChange={(e) => setForm({ ...form, miscNotes: e.target.value })} />
              </Field>
              <div className="rounded-xl border border-border bg-bg p-3">
                <p className="mb-2 text-xs font-semibold text-muted">Meeting invite / email (optional)</p>
                <CaptureBar items={inviteFiles} onChange={setInviteFiles} disabled={busy} />
                <textarea
                  className="field mt-2 min-h-16"
                  placeholder="Or paste invite / email text…"
                  value={form.inviteText}
                  onChange={(e) => setForm({ ...form, inviteText: e.target.value })}
                />
                <Button type="button" variant="secondary" className="mt-2" disabled={busy} onClick={() => void parseInvite()}>
                  {busy ? "Reading…" : "Fill from invite"}
                </Button>
              </div>
            </div>
            {error && <p className="mt-3 text-sm text-red">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" disabled={busy} onClick={() => setShowForm(false)}>Cancel</Button>
              <Button disabled={busy} onClick={() => void save()}>{busy ? "Saving…" : editing ? "Save" : "Create meeting"}</Button>
            </div>
          </div>
        </div>
      )}

      {showProject && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5">
            <h3 className="text-lg font-semibold text-fg">Group into project</h3>
            <p className="mt-1 text-sm text-muted">Select meetings to group under one project name (does not merge content).</p>
            <input className="field mt-3" placeholder="Project name" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
            <div className="mt-3 max-h-56 space-y-2 overflow-y-auto">
              {meetings.map((m) => (
                <label key={m.id} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selected.includes(m.id)}
                    onChange={(e) =>
                      setSelected((prev) => (e.target.checked ? [...prev, m.id] : prev.filter((id) => id !== m.id)))
                    }
                  />
                  <span className="truncate">{m.name}</span>
                </label>
              ))}
            </div>
            {error && <p className="mt-2 text-sm text-red">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowProject(false)}>Cancel</Button>
              <Button disabled={busy} onClick={() => void saveProject()}>Create project</Button>
            </div>
          </div>
        </div>
      )}

      <style>{`.field{width:100%;border-radius:0.5rem;border:1px solid var(--border);background:var(--bg);padding:0.55rem 0.75rem;font-size:0.875rem;color:var(--text)}`}</style>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted">{label}</span>
      {children}
    </label>
  );
}
