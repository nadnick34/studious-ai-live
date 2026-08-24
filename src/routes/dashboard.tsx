import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Archive, Pencil, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { InfoButton, InfoModal } from "@/components/info-modal";
import { KidsMascot, useKidsMascot } from "@/components/kids-mascot";
import { Button } from "@/components/ui/button";
import { createClass, listClasses, seedSampleClass, updateClass } from "@/lib/data";
import { lookupProfessor, parseClassCalendar } from "@/lib/ai";
import { extractPdfText, formatShortDate, timeAgo } from "@/lib/utils";
import type { ClassRecord } from "@/lib/types";

export const Route = createFileRoute("/dashboard")({ component: DashboardPage });

const emptyForm = {
  name: "",
  code: "",
  subject: "",
  schoolName: "",
  semester: "",
  professorName: "",
  professorInsight: "",
  textbook: "",
  textbookAuthor: "",
  scheduleDays: "",
  scheduleTime: "",
  syllabusFile: "",
  syllabusText: "",
  miscNotes: "",
};

function DashboardPage() {
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ClassRecord | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [insightLoading, setInsightLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showClassInfo, setShowClassInfo] = useState(false);
  const { kidsMode, name: mascotName } = useKidsMascot();

  async function refresh() {
    const rows = await listClasses({ data: false });
    setClasses(rows);
    setLoading(false);
  }

  useEffect(() => {
    void refresh();
  }, []);

  function setField(key: keyof typeof emptyForm, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(c: ClassRecord, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setEditing(c);
    setForm({
      name: c.name || "",
      code: c.code || "",
      subject: c.subject || "",
      schoolName: c.schoolName || "",
      semester: c.semester || "",
      professorName: c.professorName || "",
      professorInsight: c.professorInsight || "",
      textbook: c.textbook || "",
      textbookAuthor: c.textbookAuthor || "",
      scheduleDays: c.scheduleDays || "",
      scheduleTime: c.scheduleTime || "",
      syllabusFile: c.syllabusFile || "",
      syllabusText: c.syllabusText || "",
      miscNotes: c.miscNotes || "",
    });
    setShowForm(true);
  }

  async function handleArchive(c: ClassRecord, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Archive “${c.code} – ${c.name}”?`)) return;
    await updateClass({ data: { id: c.id, patch: { archived: true } } });
    await refresh();
  }

  async function fetchProfessorInsight() {
    if (!form.professorName.trim()) return;
    setInsightLoading(true);
    try {
      const result = await lookupProfessor({
        data: {
          professorName: form.professorName.trim(),
          schoolName: form.schoolName.trim(),
          subject: form.subject.trim(),
          courseCode: form.code.trim(),
        },
      });
      setForm((f) => ({ ...f, professorInsight: result.summary }));
    } finally {
      setInsightLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    let alerts = editing?.alerts;
    let upcoming = editing?.upcoming;
    try {
      const parsed = await parseClassCalendar({
        data: {
          className: `${form.code} ${form.name}`.trim(),
          semester: form.semester,
          syllabusText: form.syllabusText,
        },
      });
      if (parsed.alerts?.length) alerts = parsed.alerts;
      if (parsed.upcoming?.length) upcoming = parsed.upcoming;
    } catch {
      /* keep class */
    }
    const payload = {
      name: form.name.trim(),
      code: form.code.trim() || "NEW",
      subject: form.subject.trim() || "General",
      schoolName: form.schoolName.trim() || undefined,
      semester: form.semester.trim() || undefined,
      professorName: form.professorName.trim() || undefined,
      professorInsight: form.professorInsight.trim() || undefined,
      textbook: form.textbook.trim() || undefined,
      textbookAuthor: form.textbookAuthor.trim() || undefined,
      scheduleDays: form.scheduleDays.trim() || undefined,
      scheduleTime: form.scheduleTime.trim() || undefined,
      syllabusFile: form.syllabusFile || undefined,
      syllabusText: form.syllabusText,
      miscNotes: form.miscNotes.trim() || undefined,
      alerts,
      upcoming,
    };
    if (editing) await updateClass({ data: { id: editing.id, patch: payload } });
    else await createClass({ data: payload });
    setSaving(false);
    setShowForm(false);
    setEditing(null);
    await refresh();
  }

  return (
    <AppShell
      title="My Classes"
      right={
        <div className="flex items-center gap-1.5">
          <InfoButton onClick={() => setShowClassInfo(true)} label="How classes work" />
          <Button onClick={openCreate} className="min-h-10 px-3 text-xs sm:text-sm">
            <Plus className="size-4" />
            New class
          </Button>
        </div>
      }
    >
      {loading ? (
        <p className="py-16 text-center text-sm text-muted">Loading classes…</p>
      ) : classes.length === 0 ? (
        <div className="mx-auto flex max-w-md flex-col items-center py-10 text-center sm:py-16">
          {kidsMode ? (
            <>
              <KidsMascot size="hero" showName />
              <h2 className="mt-4 text-xl font-bold text-fg">Welcome! I’m {mascotName}</h2>
              <p className="mt-2 mb-6 text-sm text-muted">
                I’m glad you’re here. Let’s add your first class and start learning together.
              </p>
            </>
          ) : (
            <p className="mb-4 text-muted">No classes yet. Create your first class to get started.</p>
          )}
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              New class
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                await seedSampleClass();
                await refresh();
              }}
            >
              Try a sample class
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => (
            <div key={c.id} className="card-surface relative rounded-xl p-4">
              <Link to="/class/$id" params={{ id: c.id }} className="block pr-2">
                <div className="mb-1 text-xs font-semibold text-teal">{c.code}</div>
                <div className="mb-1 pr-20 font-semibold text-fg">{c.name}</div>
                <div className="space-y-0.5 text-xs text-muted">
                  {c.subject && <div>{c.subject}</div>}
                  {c.professorName && <div>Prof. {c.professorName}</div>}
                  {(c.scheduleDays || c.scheduleTime) && (
                    <div>{[c.scheduleDays, c.scheduleTime].filter(Boolean).join(" · ")}</div>
                  )}
                  {c.semester && <div>{c.semester}</div>}
                </div>
                {(() => {
                  const upcoming = c.upcoming || [];
                  const titles = new Set(upcoming.map((u) => (u.title || "").toLowerCase().slice(0, 40)));
                  const alerts = (c.alerts || []).filter((a) => {
                    const msg = (a.message || "").toLowerCase();
                    return ![...titles].some((t) => t && (msg.includes(t) || t.includes(msg.slice(0, 40))));
                  });
                  return alerts.length > 0 ? (
                  <div className="mt-3 space-y-1">
                    {alerts.slice(0, 3).map((a) => (
                      <div key={a.id} className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] leading-snug text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
                        {a.message}
                      </div>
                    ))}
                  </div>
                  ) : null;
                })()}
                {c.upcoming && c.upcoming.length > 0 && (
                  <div className="mt-3">
                    <div className="mb-1 text-[10px] font-semibold tracking-wide text-teal uppercase">Upcoming</div>
                    <ul className="space-y-1">
                      {c.upcoming.slice(0, 4).map((u) => (
                        <li key={u.id} className="flex justify-between gap-2 text-[11px] text-fg">
                          <span className="truncate">
                            <span className="text-muted capitalize">{u.type}</span>
                            {" · "}
                            {u.title}
                          </span>
                          {u.date && <span className="shrink-0 text-muted">{formatShortDate(u.date)}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-3 text-[10px] text-muted">Last opened {timeAgo(c.lastAccessed)}</div>
              </Link>
              <div className="absolute top-3 right-3 flex gap-1">
                <button
                  type="button"
                  onClick={(e) => openEdit(c, e)}
                  className="inline-flex min-h-9 items-center gap-1 rounded-md border border-teal bg-card px-2.5 text-[11px] font-medium text-teal"
                >
                  <Pencil className="size-3" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={(e) => void handleArchive(c, e)}
                  className="inline-flex min-h-9 items-center gap-1 rounded-md border border-border bg-card px-2.5 text-[11px] text-muted"
                >
                  <Archive className="size-3" />
                  Archive
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4">
          <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-card p-6 shadow-xl sm:max-w-lg sm:rounded-xl">
            <h3 className="mb-4 text-base font-semibold text-fg">{editing ? "Edit class" : "New class"}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Class name *" value={form.name} onChange={(v) => setField("name", v)} required placeholder="Principles of Biology" />
                <Field label="Course code" value={form.code} onChange={(v) => setField("code", v)} placeholder="BIOL 1543" />
                <Field label="Subject" value={form.subject} onChange={(v) => setField("subject", v)} placeholder="Biology" />
                <Field label="School" value={form.schoolName} onChange={(v) => setField("schoolName", v)} placeholder="University of Arkansas" />
                <Field label="Semester" value={form.semester} onChange={(v) => setField("semester", v)} placeholder="Fall 2026" />
                <Field label="Days" value={form.scheduleDays} onChange={(v) => setField("scheduleDays", v)} placeholder="MWF" />
                <Field label="Time" value={form.scheduleTime} onChange={(v) => setField("scheduleTime", v)} placeholder="10:00–10:50 AM" />
                <div className="sm:col-span-2">
                  <Field label="Professor" value={form.professorName} onChange={(v) => setField("professorName", v)} placeholder="Dr. Sarah Mitchell" />
                  <button
                    type="button"
                    onClick={() => void fetchProfessorInsight()}
                    disabled={insightLoading || !form.professorName.trim()}
                    className="mt-1 text-xs text-teal hover:underline disabled:opacity-50"
                  >
                    {insightLoading ? "Looking up insight…" : "Get professor insight"}
                  </button>
                  {form.professorInsight && (
                    <p className="mt-2 rounded-lg border border-border bg-bg px-2.5 py-2 text-[11px] leading-relaxed text-muted">
                      {form.professorInsight}
                    </p>
                  )}
                </div>
                <Field label="Textbook" value={form.textbook} onChange={(v) => setField("textbook", v)} />
                <Field label="Textbook author" value={form.textbookAuthor} onChange={(v) => setField("textbookAuthor", v)} />
              </div>
              <SyllabusField value={form.syllabusText} fileName={form.syllabusFile} onText={(v) => setField("syllabusText", v)} onFile={(n) => setField("syllabusFile", n)} />
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Misc notes</label>
                <textarea
                  value={form.miscNotes}
                  onChange={(e) => setField("miscNotes", e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-fg outline-none focus:border-teal"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setEditing(null); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : editing ? "Save changes" : "Create class"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showClassInfo && (
        <InfoModal title="Adding classes" onClose={() => setShowClassInfo(false)}>
          <p>
            Classes are the top-level folders for your courses. Create one class per course so materials, chapters, and
            alerts stay organized.
          </p>
          <p className="font-medium text-fg">When you add a class, include:</p>
          <ul className="list-disc space-y-1 pl-5 text-muted">
            <li>Course name and code (e.g. HIST102)</li>
            <li>School, semester, and professor when you know them</li>
            <li>Textbook if you have one</li>
            <li>Syllabus (PDF or pasted text) so Studious can surface upcoming dates</li>
            <li>Schedule and any misc notes that help you stay oriented</li>
          </ul>
          <p>
            After the class exists, open it and add chapters with notes, PDFs, photos, and lecture audio. You can edit or
            archive a class anytime from this list.
          </p>
        </InfoModal>
      )}
    </AppShell>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-fg outline-none focus:border-teal"
      />
    </div>
  );
}

function SyllabusField({
  value,
  fileName,
  onText,
  onFile,
}: {
  value: string;
  fileName: string;
  onText: (v: string) => void;
  onFile: (n: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted">Syllabus</label>
      <div className="flex items-center gap-2">
        <Button type="button" variant="secondary" className="min-h-10 text-xs" onClick={() => ref.current?.click()}>
          Upload syllabus
        </Button>
        <span className="truncate text-xs text-muted">{fileName || "Optional — used for alerts and upcoming"}</span>
        <input
          ref={ref}
          type="file"
          accept=".pdf,.txt,.png,.jpg,.jpeg"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            onFile(f.name);
            try {
              if (f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")) {
                const text = await extractPdfText(f);
                if (text) onText(text.slice(0, 20000));
              } else if (f.type.startsWith("text/") || /\.(txt|md)$/i.test(f.name)) {
                onText((await f.text()).slice(0, 20000));
              }
            } catch {
              /* keep filename; user can paste text */
            }
          }}
        />
      </div>
      <textarea
        value={value}
        onChange={(e) => onText(e.target.value)}
        rows={4}
        placeholder="Or paste syllabus text here (due dates, exams, readings)…"
        className="mt-2 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-fg outline-none focus:border-teal"
      />
    </div>
  );
}
