import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Archive, GraduationCap, Pencil, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CaptureBar, capturedToPayloads, type CapturedFile } from "@/components/capture-bar";
import { Button } from "@/components/ui/button";
import { extractMaterials, parseTeacherClassDocument } from "@/lib/ai";
import { createTeacherClass, getProfile, getTeacherClassStats, listTeacherClasses, updateTeacherClass } from "@/lib/data";
import {
  COURSE_LEVELS,
  SCHOOL_TYPES,
  type CourseLevel,
  type SchoolType,
  type TeacherClass,
} from "@/lib/types";

export const Route = createFileRoute("/teacher/")({ component: TeacherDashboard });

function TeacherDashboard() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [classStats, setClassStats] = useState<Record<string, { studentCount: number; classAverage: number }>>({});
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [parseBusy, setParseBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [docFiles, setDocFiles] = useState<CapturedFile[]>([]);
  const [studentsText, setStudentsText] = useState("");
  const [syllabusText, setSyllabusText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    subject: "",
    gradeLevel: "",
    courseLevel: "Regular" as CourseLevel,
    schoolType: "Private Independent" as SchoolType,
    schoolName: "",
  });

  async function refresh() {
    try {
      const list = await listTeacherClasses();
      setClasses(list);
      const entries = await Promise.all(
        list.map(async (c) => {
          try {
            const s = await getTeacherClassStats({ data: c.id });
            return [c.id, { studentCount: s.studentCount, classAverage: s.classAverage }] as const;
          } catch {
            return [c.id, { studentCount: 0, classAverage: 0 }] as const;
          }
        }),
      );
      setClassStats(Object.fromEntries(entries));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load classes");
    }
  }

  useEffect(() => {
    void getProfile().then((p) => {
      if (p.role !== "teacher") void navigate({ to: "/dashboard" });
    });
    void refresh();
  }, [navigate]);

  function openNew() {
    setEditingId(null);
    setForm({
      name: "",
      subject: "",
      gradeLevel: "",
      courseLevel: "Regular",
      schoolType: "Private Independent",
      schoolName: "",
    });
    setStudentsText("");
    setSyllabusText("");
    setDocFiles([]);
    setError(null);
    setStatus(null);
    setShowForm(true);
  }

  function openEdit(c: TeacherClass) {
    setEditingId(c.id);
    setForm({
      name: c.name,
      subject: c.subject,
      gradeLevel: c.gradeLevel,
      courseLevel: c.courseLevel,
      schoolType: c.schoolType,
      schoolName: c.schoolName,
    });
    setSyllabusText("");
    setStudentsText("");
    setDocFiles([]);
    setError(null);
    setStatus(null);
    setShowForm(true);
  }

  async function archiveClass(c: TeacherClass) {
    if (!confirm(`Archive “${c.name}”?`)) return;
    try {
      await updateTeacherClass({ data: { id: c.id, patch: { archived: true } } });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not archive class");
    }
  }

  async function fillFromDocument() {
    if (!docFiles.length && !syllabusText.trim()) {
      setError("Upload a syllabus/roster PDF or paste text first.");
      return;
    }
    setParseBusy(true);
    setError(null);
    setStatus("Reading document…");
    try {
      let text = syllabusText.trim();
      if (docFiles.length) {
        const payloads = await capturedToPayloads(docFiles);
        const extracted = await extractMaterials({ data: { files: payloads } });
        text = [text, extracted.text || ""].filter(Boolean).join("\n\n");
      }
      if (!text.trim()) {
        setError("Could not read text from that file. Try a clearer PDF or paste the text.");
        return;
      }
      setStatus("Extracting class, syllabus, and roster…");
      const parsed = await parseTeacherClassDocument({ data: { text } });
      setForm((f) => ({
        name: parsed.name || f.name,
        subject: parsed.subject || f.subject,
        gradeLevel: parsed.gradeLevel || f.gradeLevel,
        courseLevel: (COURSE_LEVELS.includes(parsed.courseLevel) ? parsed.courseLevel : f.courseLevel) as CourseLevel,
        schoolType: (SCHOOL_TYPES.includes(parsed.schoolType) ? parsed.schoolType : f.schoolType) as SchoolType,
        schoolName: parsed.schoolName || f.schoolName,
      }));
      if (parsed.syllabusText) setSyllabusText(parsed.syllabusText);
      if (Array.isArray(parsed.students) && parsed.students.length) {
        setStudentsText(parsed.students.join("\n"));
      }
      setStatus(`Filled fields${parsed.students?.length ? ` · ${parsed.students.length} students found` : ""}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not parse document");
      setStatus(null);
    } finally {
      setParseBusy(false);
    }
  }

  async function create() {
    if (!form.name.trim() || !form.subject.trim()) {
      setError("Class name and subject are required.");
      return;
    }
    setBusy(true);
    setError(null);
    setStatus("Saving class…");
    try {
      const students = studentsText
        .split(/[\n,;]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (editingId) {
        await updateTeacherClass({
          data: {
            id: editingId,
            patch: {
              name: form.name.trim(),
              subject: form.subject.trim(),
              gradeLevel: form.gradeLevel,
              courseLevel: form.courseLevel,
              schoolType: form.schoolType,
              schoolName: form.schoolName,
            },
          },
        });
        setShowForm(false);
        setEditingId(null);
        setStatus(null);
        await refresh();
        return;
      }
      const c = await createTeacherClass({
        data: {
          ...form,
          syllabusText: syllabusText.trim(),
          students,
        },
      });
      if (!c?.id) throw new Error("Save returned no class id.");
      setShowForm(false);
      setEditingId(null);
      setStatus(null);
      setDocFiles([]);
      setStudentsText("");
      setSyllabusText("");
      setForm({
        name: "",
        subject: "",
        gradeLevel: "",
        courseLevel: "Regular",
        schoolType: "Private Independent",
        schoolName: "",
      });
      await refresh();
      await navigate({ to: "/teacher/class/$id", params: { id: c.id } });
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "Could not create class. If this keeps happening, redeploy so the teacher tables migration runs.";
      setError(msg);
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell
      title="Teacher Classes"
      right={
        <Button className="min-h-10 text-xs" onClick={() => openNew()}>
          <Plus className="size-4" />
          New class
        </Button>
      }
    >
      <p className="mb-4 text-sm text-muted">
        Less grading. More time with the student. Create a class manually or upload a syllabus/roster document to fill
        details and the student list.
      </p>

      {error && !showForm && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red dark:bg-red-950/30">{error}</p>
      )}

      {classes.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-4 py-14 text-center text-sm text-muted">
          <GraduationCap className="mx-auto mb-3 size-8 opacity-50" />
          No classes yet. Add your first class to start grading and analytics.
          <div className="mt-4">
            <Button onClick={() => openNew()}>New class</Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {classes.map((c) => (
            <div
              key={c.id}
              className="relative rounded-xl border border-border bg-card p-4 transition-colors hover:border-teal/40"
            >
              <div className="absolute top-3 right-3 flex gap-1">
                <button
                  type="button"
                  className="grid size-8 place-items-center rounded-lg text-muted hover:bg-bg hover:text-fg"
                  aria-label="Edit class"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openEdit(c);
                  }}
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  className="grid size-8 place-items-center rounded-lg text-muted hover:bg-bg hover:text-fg"
                  aria-label="Archive class"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    void archiveClass(c);
                  }}
                >
                  <Archive className="size-4" />
                </button>
              </div>
              <button
                type="button"
                className="block w-full pr-16 text-left"
                onClick={() => void navigate({ to: "/teacher/class/$id", params: { id: c.id } })}
              >
                <div className="font-semibold text-fg">{c.name}</div>
                <div className="mt-1 text-sm text-muted">
                  {c.subject} · Grade {c.gradeLevel || "—"} · {c.courseLevel}
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted">
                  <span>{c.schoolType}</span>
                  <span>·</span>
                  <span>{classStats[c.id]?.studentCount ?? "—"} students</span>
                  <span>·</span>
                  <span>Avg {classStats[c.id]?.classAverage ?? "—"}%</span>
                </div>
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-5">
            <h3 className="text-lg font-semibold text-fg">{editingId ? "Edit class" : "New class"}</h3>
            <p className="mt-1 text-sm text-muted">
              Optional: upload a syllabus, class info sheet, or roster and auto-fill the fields below.
            </p>

            <div className="mt-3 rounded-xl border border-border bg-bg p-3">
              <p className="mb-2 text-xs font-semibold text-muted">Syllabus / class info / roster upload</p>
              <CaptureBar items={docFiles} onChange={setDocFiles} disabled={busy || parseBusy} />
              <textarea
                className="field mt-2 min-h-20"
                placeholder="Or paste syllabus / roster text…"
                value={syllabusText}
                onChange={(e) => setSyllabusText(e.target.value)}
                disabled={busy || parseBusy}
              />
              <Button
                type="button"
                variant="secondary"
                className="mt-2"
                disabled={busy || parseBusy}
                onClick={() => void fillFromDocument()}
              >
                {parseBusy ? "Reading…" : "Fill from document"}
              </Button>
            </div>

            <div className="mt-3 space-y-2">
              <input className="field" placeholder="Class name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={busy} />
              <input className="field" placeholder="Subject *" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} disabled={busy} />
              <input className="field" placeholder="Grade level (e.g. 10, 6th)" value={form.gradeLevel} onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })} disabled={busy} />
              <select className="field" value={form.courseLevel} onChange={(e) => setForm({ ...form, courseLevel: e.target.value as CourseLevel })} disabled={busy}>
                {COURSE_LEVELS.map((x) => (
                  <option key={x} value={x}>{x}</option>
                ))}
              </select>
              <select className="field" value={form.schoolType} onChange={(e) => setForm({ ...form, schoolType: e.target.value as SchoolType })} disabled={busy}>
                {SCHOOL_TYPES.map((x) => (
                  <option key={x} value={x}>{x}</option>
                ))}
              </select>
              <input className="field" placeholder="School name" value={form.schoolName} onChange={(e) => setForm({ ...form, schoolName: e.target.value })} disabled={busy} />
              <textarea
                className="field min-h-24"
                placeholder="Student roster (one name per line, or comma-separated)"
                value={studentsText}
                onChange={(e) => setStudentsText(e.target.value)}
                disabled={busy}
              />
            </div>
            {status && <p className="mt-2 text-xs text-teal">{status}</p>}
            {error && <p className="mt-2 text-sm text-red">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setForm({
                    name: "",
                    subject: "",
                    gradeLevel: "",
                    courseLevel: "Regular",
                    schoolType: "Private Independent",
                    schoolName: "",
                  });
                  setStudentsText("");
                  setSyllabusText("");
                  setDocFiles([]);
                  setError(null);
                  setStatus(null);
                }}
              >
                Cancel
              </Button>
              <Button disabled={busy || parseBusy} onClick={() => void create()}>
                {busy ? "Saving…" : editingId ? "Save changes" : "Create class"}
              </Button>
            </div>
          </div>
        </div>
      )}
      <style>{`.field{width:100%;border-radius:0.5rem;border:1px solid var(--border);background:var(--bg);padding:0.55rem 0.75rem;font-size:0.875rem;color:var(--text)}`}</style>
    </AppShell>
  );
}
