import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Briefcase, Pencil, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CaptureBar, capturedToPayloads, type CapturedFile } from "@/components/capture-bar";
import { Button } from "@/components/ui/button";
import { extractMaterials, parseMeetingInvite } from "@/lib/ai";
import {
  createMeeting,
  listMeetings,
  updateMeeting,
} from "@/lib/data";
import {
  MEETING_CATEGORIES,
  MEETING_TYPES,
  type MeetingCategory,
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
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MeetingRecord | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [inviteFiles, setInviteFiles] = useState<CapturedFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setMeetings(await listMeetings());
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
    setInviteBusy(true);
    setError(null);
    setInviteStatus("Reading invite…");
    try {
      let text = form.inviteText.trim();
      if (inviteFiles.length) {
        setInviteStatus("Extracting text from upload…");
        const payloads = await Promise.race([
          capturedToPayloads(inviteFiles),
          new Promise<never>((_, rej) => setTimeout(() => rej(new Error("Upload timed out. Try pasting the invite text instead.")), 45000)),
        ]);
        const extracted = await Promise.race([
          extractMaterials({ data: { files: payloads } }),
          new Promise<never>((_, rej) => setTimeout(() => rej(new Error("Reading the file timed out. Paste the invite text and try again.")), 60000)),
        ]);
        const extractedText = (extracted.text || "").trim();
        if (!extractedText) {
          setError("Could not read text from that file. Paste the invite or email body into the text box.");
          return;
        }
        text = [text, extractedText].filter(Boolean).join("\n\n");
      }
      if (!text.trim()) {
        setError("Paste invite text or upload the invite/email first.");
        return;
      }
      setInviteStatus("Filling fields…");
      const parsed = await Promise.race([
        parseMeetingInvite({ data: { text: text.slice(0, 20000) } }),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error("Invite analysis timed out. Fields were not auto-filled — enter them manually.")), 90000)),
      ]);
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
      setInviteStatus("Fields updated from invite.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not parse invite");
      setInviteStatus(null);
    } finally {
      setInviteBusy(false);
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


  return (
    <AppShell
      title="Meetings"
      right={
        <Button className="min-h-10 text-xs" onClick={openNew}>
          <Plus className="size-4" />
          New meeting
        </Button>
      }
    >
      <p className="mb-4 text-sm text-muted">
        Capture meetings, generate notes, focus items, and action items. Student class data stays separate.
      </p>

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
                {inviteStatus && <p className="mt-2 text-xs text-teal">{inviteStatus}</p>}
                <Button type="button" variant="secondary" className="mt-2" disabled={inviteBusy || busy} onClick={() => void parseInvite()}>
                  {inviteBusy ? "Reading invite…" : "Fill from invite"}
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
