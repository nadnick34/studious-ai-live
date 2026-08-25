import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen, ClipboardList, Headphones, Layers3, MoreHorizontal, Pencil, Plus, Sparkles, Trash2, Shapes } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ClassicalModeIcon, ClassicalModeModal } from "@/components/classical-mode-modal";
import { InfoButton, InfoModal } from "@/components/info-modal";
import { KidsOwlBanner } from "@/components/kids-mascot";
import { Button } from "@/components/ui/button";
import { CaptureBar, capturedToPayloads, type CapturedFile } from "@/components/capture-bar";
import {
  createStudySet,
  deleteStudySet,
  getClassById,
  getProfile,
  listStudySets,
  touchClass,
  updateStudySet,
} from "@/lib/data";
import { extractMaterials, generateStudyPackage } from "@/lib/ai";
import { fileIsAudio, transcribeLectureFile } from "@/lib/transcribe-client";
import { uid } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils";
import type { Attachment, ClassRecord, StudySet } from "@/lib/types";

export const Route = createFileRoute("/class/$id/")({ component: ClassPage });

function ClassPage() {
  const { id: classId } = Route.useParams();
  const navigate = useNavigate();
  const [cls, setCls] = useState<ClassRecord | null>(null);
  const [sets, setSets] = useState<StudySet[]>([]);
  const [showChapterInfo, setShowChapterInfo] = useState(false);
  const [showCombine, setShowCombine] = useState(false);
  const [showFocus, setShowFocus] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [focusText, setFocusText] = useState("");
  const [focusName, setFocusName] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<StudySet | null>(null);

  async function refresh() {
    const [c, s] = await Promise.all([getClassById({ data: classId }), listStudySets({ data: classId })]);
    if (!c) {
      void navigate({ to: "/dashboard" });
      return;
    }
    setCls(c);
    setSets(s);
  }

  useEffect(() => {
    void touchClass({ data: classId });
    void refresh();
  }, [classId]);

  useEffect(() => {
    const pending = sets.some((s) => s.notes?.subtitle?.includes("Generating"));
    if (!pending) return;
    const t = window.setInterval(() => void refresh(), 8000);
    return () => window.clearInterval(t);
  }, [sets, classId]);

  async function handleCustomFocus() {
    if (!cls || !focusText.trim()) {
      setError("Describe what you want to focus on.");
      return;
    }
    setError(null);
    setBusy(true);
    const setName = focusName.trim() || `Focus: ${focusText.trim().slice(0, 40)}`;
    try {
      const profile = await getProfile();
      const generated = await generateStudyPackage({
        data: {
          className: cls.name,
          classCode: cls.code,
          subject: cls.subject,
          setName,
          sourceFiles: ["Custom Focus"],
          focusPrompt: focusText.trim(),
          kidsMode: Boolean(profile.kidsMode),
          childAge: profile.childAge,
        },
      });
      const set = await createStudySet({
        data: {
          classId,
          name: setName,
          generated,
          sourceFiles: ["Custom Focus"],
          focusPrompt: focusText.trim(),
        },
      });
      setShowFocus(false);
      setFocusText("");
      setFocusName("");
      await navigate({ to: "/class/$id/set/$setId", params: { id: classId, setId: set.id } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleCombine() {
    if (!cls || selected.length < 2) return;
    const chosen = sets.filter((s) => selected.includes(s.id));
    const extractedText = chosen
      .map((s) => {
        const secs = (s.notes?.sections || [])
          .map((sec) => [sec.heading, sec.body || "", (sec.bullets || []).join("\n")].filter(Boolean).join("\n"))
          .join("\n\n");
        return `===== ${s.name} =====\n${s.notes?.title || ""}\n${secs}`;
      })
      .join("\n\n");
    setBusy(true);
    setStatus("Combining selected chapters…");
    setError(null);
    try {
      const profile = await getProfile();
      const generated = await generateStudyPackage({
        data: {
          className: cls.name,
          classCode: cls.code,
          subject: cls.subject,
          setName: "Midterm / Final review",
          sourceFiles: chosen.map((s) => s.name),
          extractedText,
          focusPrompt: "Combine these chapter notes into one comprehensive midterm/final review.",
          kidsMode: Boolean(profile.kidsMode),
          childAge: profile.childAge,
        },
      });
      const set = await createStudySet({
        data: {
          classId,
          name: "Midterm / Final review",
          generated,
          sourceFiles: chosen.map((s) => s.name),
        },
      });
      setShowCombine(false);
      setSelected([]);
      await navigate({ to: "/class/$id/set/$setId", params: { id: classId, setId: set.id } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Combine failed");
    } finally {
      setBusy(false);
      setStatus("");
    }
  }

  if (!cls) {
    return (
      <AppShell title="Class">
        <p className="text-sm text-muted">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={cls.code}
      right={
        <div className="flex items-center gap-1.5">
          <InfoButton onClick={() => setShowChapterInfo(true)} label="How chapters work" />
          <Link to="/class/$id/upload" params={{ id: classId }}>
            <Button className="min-h-10 px-3 text-xs sm:text-sm">
              <Plus className="size-4" />
              New chapter
            </Button>
          </Link>
          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            className="grid size-10 place-items-center rounded-lg border border-border bg-card text-fg"
            aria-label="More actions"
          >
            <MoreHorizontal className="size-4" />
          </button>
        </div>
      }
    >
      {showMore && (
        <div className="mb-4 grid gap-2 rounded-xl border border-border bg-card p-2 sm:flex sm:flex-wrap">
          <Button variant="secondary" className="justify-start" onClick={() => { setShowMore(false); setShowFocus(true); }}>
            <Sparkles className="size-4" />
            Custom focus
          </Button>
          <Button variant="secondary" className="justify-start" onClick={() => { setShowMore(false); setShowCombine(true); }}>
            Combine for midterm / final
          </Button>
        </div>
      )}

      <div className="mb-1 text-xs text-muted">Class</div>
      <h2 className="mb-5 text-lg font-bold text-fg">
        {cls.code} – {cls.name}
      </h2>

      <KidsOwlBanner message="Open a chapter or add a new one. I’ll help you study!" />

      {sets.length === 0 ? (
        <div className="card-surface rounded-xl px-4 py-12 text-center text-sm text-muted">
          No chapters yet. Add materials, take a photo, or scan a page to start.
          <div className="mt-4">
            <Link to="/class/$id/upload" params={{ id: classId }}>
              <Button>New chapter</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {sets.map((s) => (
            <ChapterCard
              key={s.id}
              classId={classId}
              set={s}
              cls={cls}
              onEdit={() => setEditing(s)}
              onDelete={async () => {
                if (!confirm(`Delete “${s.name}”? This cannot be undone.`)) return;
                await deleteStudySet({ data: s.id });
                await refresh();
              }}
            />
          ))}
        </div>
      )}

      {showCombine && (
        <Modal title="Combine for midterm / final" onClose={() => setShowCombine(false)}>
          <p className="mb-4 text-xs text-muted">Select at least two chapters to merge into one study package.</p>
          <div className="mb-4 max-h-60 space-y-2 overflow-y-auto">
            {sets.map((s) => (
              <label key={s.id} className="flex min-h-11 items-center gap-3 rounded-lg border border-border px-3 py-2">
                <input
                  type="checkbox"
                  checked={selected.includes(s.id)}
                  onChange={(e) => {
                    if (e.target.checked) setSelected([...selected, s.id]);
                    else setSelected(selected.filter((id) => id !== s.id));
                  }}
                />
                <span className="text-sm">{s.name}</span>
              </label>
            ))}
          </div>
          {status && <p className="mb-3 text-sm text-teal">{status}</p>}
          {error && <p className="mb-3 text-sm text-red">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowCombine(false)}>Cancel</Button>
            <Button disabled={selected.length < 2 || busy} onClick={() => void handleCombine()}>
              {busy ? "Generating…" : "Combine selected"}
            </Button>
          </div>
        </Modal>
      )}

      {showFocus && (
        <Modal title="Custom focus" onClose={() => setShowFocus(false)}>
          <p className="mb-4 text-xs text-muted">
            Tell Studious what to emphasize — a tough section or extra depth. A full study package will be generated.
          </p>
          <label className="mb-1 block text-xs font-medium text-muted">Optional name</label>
          <input
            value={focusName}
            onChange={(e) => setFocusName(e.target.value)}
            className="mb-3 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-teal"
            placeholder="e.g. Punnett squares deep dive"
          />
          <label className="mb-1 block text-xs font-medium text-muted">What should we focus on?</label>
          <textarea
            value={focusText}
            onChange={(e) => setFocusText(e.target.value)}
            rows={4}
            className="mb-4 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-teal"
          />
          {error && <p className="mb-3 text-sm text-red">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowFocus(false)}>Cancel</Button>
            <Button disabled={busy} onClick={() => void handleCustomFocus()}>
              {busy ? "Generating…" : "Generate focused set"}
            </Button>
          </div>
        </Modal>
      )}

      {editing && (
        <EditChapterModal
          cls={cls}
          set={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await refresh();
          }}
        />
      )}

      {showChapterInfo && (
        <InfoModal title="Chapters & study modes" onClose={() => setShowChapterInfo(false)}>
          <p>
            A <strong>chapter</strong> (or study set) is one unit of work — for example Chapter 2, Lecture 5, or Weeks
            1–3. Upload everything for that unit, then generate notes, audio, flash cards, and a quiz.
          </p>
          <p className="font-medium text-fg">Best practice when adding a chapter</p>
          <ul className="list-disc space-y-1 pl-5 text-muted">
            <li>Name it clearly (e.g. “Chapter 2 – Cahokia”)</li>
            <li>Upload notes, PDF pages, slides, photos of the board, and lecture audio together when you can</li>
            <li>Prefer clearer audio or a transcript for long lectures</li>
            <li>Generate once materials are in, then study in the mode that fits you</li>
          </ul>
          <p className="font-medium text-fg">Combine for midterm / final</p>
          <p className="text-muted">
            Select multiple chapters and merge them into one review package so midterm and final study pull from the
            whole span of material.
          </p>
          <p className="font-medium text-fg">Custom focus</p>
          <p className="text-muted">
            Ask Studious to go deeper on a weak section or a specific topic. Useful when you already generated the unit
            but need more practice in one area.
          </p>
          <p className="font-medium text-fg">Classical mode (laurel icon)</p>
          <p className="text-muted">
            Opens a Trivium-style path: The Conspectus (memory-work, outline, logic, tell-back), Orator’s Companion,
            Socratic cards, and a Commonplace — aimed at mastery and narration, not only multiple choice.
          </p>
        </InfoModal>
      )}
    </AppShell>
  );
}

function ChapterCard({
  classId,
  set,
  cls,
  onEdit,
  onDelete,
}: {
  classId: string;
  set: StudySet;
  cls: ClassRecord;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [classicalOpen, setClassicalOpen] = useState(false);
  const [kidsMode, setKidsMode] = useState(false);
  useEffect(() => {
    void getProfile().then((p) => setKidsMode(Boolean(p.kidsMode)));
  }, []);
  const actions = kidsMode
    ? [
        { to: "/class/$id/set/$setId" as const, label: "Notes", icon: BookOpen },
        { to: "/class/$id/set/$setId/spatial" as const, label: "Spatial", icon: Shapes },
        { to: "/class/$id/set/$setId/flashcards" as const, label: "Cards", icon: Layers3, extra: set.flashcards?.length },
        { to: "/class/$id/set/$setId/quiz" as const, label: "Quiz", icon: Sparkles },
        { to: "/class/$id/assignments" as const, label: "Assign", icon: ClipboardList },
      ]
    : [
        { to: "/class/$id/set/$setId" as const, label: "Notes", icon: BookOpen },
        { to: "/class/$id/set/$setId/audio" as const, label: "Audio", icon: Headphones },
        { to: "/class/$id/set/$setId/flashcards" as const, label: "Cards", icon: Layers3, extra: set.flashcards?.length },
        { to: "/class/$id/set/$setId/quiz" as const, label: "Quiz", icon: Sparkles },
        { to: "/class/$id/assignments" as const, label: "Assign", icon: ClipboardList },
      ];
  return (
    <article className="card-surface rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-semibold text-fg">
            {set.name}
            {set.focusPrompt && (
              <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-amber-800 uppercase dark:bg-amber-900/40 dark:text-amber-200">
                Focus
              </span>
            )}
          </div>
          <div className="mt-0.5 text-xs text-muted">{formatDateTime(set.createdAt)}</div>
          {set.sourceFiles?.length > 0 && (
            <div className="mt-1 truncate text-[11px] text-muted">
              {set.attachments?.length || set.sourceFiles.length} attachment
              {(set.attachments?.length || set.sourceFiles.length) === 1 ? "" : "s"}
              {" · "}
              {set.sourceFiles.slice(0, 2).join(", ")}
            </div>
          )}
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => setClassicalOpen(true)}
            className="grid size-10 place-items-center rounded-lg text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-900/30"
            aria-label="Classical Education mode"
            title="Classical Education"
          >
            <ClassicalModeIcon className="size-4" />
          </button>
          <button type="button" onClick={onEdit} className="grid size-10 place-items-center rounded-lg text-teal hover:bg-bg" aria-label="Edit chapter">
            <Pencil className="size-4" />
          </button>
          <button type="button" onClick={onDelete} className="grid size-10 place-items-center rounded-lg text-red hover:bg-bg" aria-label="Delete chapter">
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
      {classicalOpen && (
        <ClassicalModeModal cls={cls} set={set} onClose={() => setClassicalOpen(false)} />
      )}
      <div className="mt-3 grid grid-cols-4 gap-1">
        {actions.map((a) => {
          const Icon = a.icon;
          const isAssign = a.label === "Assign";
          return (
            <Link
              key={a.label}
              to={a.to}
              params={isAssign ? { id: classId } : { id: classId, setId: set.id }}
              className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg bg-bg text-[11px] font-medium text-fg hover:bg-teal/10 hover:text-teal"
            >
              <Icon className="size-4" />
              {a.label}
              {a.extra ? <span className="text-[10px] text-muted">({a.extra})</span> : null}
            </Link>
          );
        })}
      </div>
    </article>
  );
}

function EditChapterModal({
  cls,
  set,
  onClose,
  onSaved,
}: {
  cls: ClassRecord;
  set: StudySet;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(set.name);
  const [attachments, setAttachments] = useState<Attachment[]>(set.attachments || []);
  const [newFiles, setNewFiles] = useState<CapturedFile[]>([]);
  const [rebuild, setRebuild] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      let nextAttachments = attachments;
      let extractedExtra = "";
      if (newFiles.length) {
        const audioItems = newFiles.filter((f) => fileIsAudio(f.file));
        const otherItems = newFiles.filter((f) => !fileIsAudio(f.file));
        const extraAttachments: Attachment[] = [];
        for (const item of audioItems) {
          const transcript = await transcribeLectureFile(item.file);
          extractedExtra += `\n\n===== SOURCE: ${item.file.name} =====\n${transcript}`;
          extraAttachments.push({
            id: uid("a"),
            name: item.file.name,
            kind: "audio",
            size: item.file.size,
            addedAt: new Date().toISOString(),
            extractedText: transcript.slice(0, 80000),
          });
        }
        if (otherItems.length) {
          const payloads = await capturedToPayloads(otherItems);
          const extracted = await extractMaterials({ data: { files: payloads } });
          extractedExtra += `\n${extracted.text}`;
          extraAttachments.push(...extracted.attachments);
        }
        nextAttachments = [...attachments, ...extraAttachments];
      }
      const sourceFiles = nextAttachments.map((a) => a.name);
      if (rebuild) {
        const existingText = nextAttachments.map((a) => a.extractedText || a.name).join("\n\n");
        const profile = await getProfile();
        const generated = await generateStudyPackage({
          data: {
            className: cls.name,
            classCode: cls.code,
            subject: cls.subject,
            setName: name.trim(),
            sourceFiles,
            extractedText: [existingText, extractedExtra].filter(Boolean).join("\n"),
            focusPrompt: set.focusPrompt,
            kidsMode: Boolean(profile.kidsMode),
            childAge: profile.childAge,
          },
        });
        await updateStudySet({
          data: {
            id: set.id,
            patch: {
              name: name.trim(),
              sourceFiles,
              attachments: nextAttachments,
              notes: generated.notes,
              audioScript: generated.audioScript,
              quiz: generated.quiz,
              flashcards: generated.flashcards,
            },
          },
        });
      } else {
        await updateStudySet({
          data: {
            id: set.id,
            patch: { name: name.trim(), sourceFiles, attachments: nextAttachments },
          },
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Edit chapter" onClose={onClose}>
      <label className="mb-1 block text-xs font-medium text-muted">Name</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="mb-4 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-teal"
      />

      <p className="mb-2 text-xs font-medium text-muted">Attachments</p>
      {attachments.length === 0 && newFiles.length === 0 && (
        <p className="mb-2 text-xs text-muted">None yet — add files, a photo, or a scan.</p>
      )}
      <ul className="mb-3 space-y-1.5">
        {attachments.map((a) => (
          <li key={a.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
            <span className="truncate">{a.name}</span>
            <button
              type="button"
              className="text-xs text-red"
              onClick={() => setAttachments(attachments.filter((x) => x.id !== a.id))}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <CaptureBar items={newFiles} onChange={setNewFiles} disabled={saving} />

      <label className="mt-4 flex items-start gap-2 text-sm">
        <input type="checkbox" className="mt-1" checked={rebuild} onChange={(e) => setRebuild(e.target.checked)} />
        <span>Rebuild notes, audio, cards, and quiz from all attachments</span>
      </label>
      {error && <p className="mt-3 text-sm text-red">{error}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button disabled={saving || !name.trim()} onClick={() => void save()}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </Modal>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4">
      <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-card p-6 shadow-xl sm:max-w-lg sm:rounded-xl">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold">{title}</h3>
          <button type="button" onClick={onClose} className="text-sm text-muted">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
