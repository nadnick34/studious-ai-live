import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Mic, Pause, Play, Square, Check } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CaptureBar, capturedToPayloads, type CapturedFile } from "@/components/capture-bar";
import { Button } from "@/components/ui/button";
import { extractMaterials, generateStudyPackage } from "@/lib/ai";
import { createClass, createStudySet, getProfile, listClasses, listStudySets } from "@/lib/data";
import { fileIsAudio, transcribeLectureFile } from "@/lib/transcribe-client";
import { uid } from "@/lib/utils";
import type { Attachment, ClassRecord, StudySet } from "@/lib/types";

export const Route = createFileRoute("/notes")({
  component: NotesPage,
});

type RecState = "idle" | "recording" | "paused";

function NotesPage() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [files, setFiles] = useState<CapturedFile[]>([]);
  const [recState, setRecState] = useState<RecState>("idle");
  const [recSeconds, setRecSeconds] = useState(0);
  const [transcriptParts, setTranscriptParts] = useState<string[]>([]);
  const [audioBlobs, setAudioBlobs] = useState<Blob[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [showComplete, setShowComplete] = useState(false);
  const [busy, setBusy] = useState(false);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function startTimer() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => setRecSeconds((s) => s + 1), 1000);
  }
  function stopTimer() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime });
        if (blob.size > 0) setAudioBlobs((prev) => [...prev, blob]);
        chunksRef.current = [];
      };
      mediaRef.current = rec;
      rec.start(1000);
      setRecState("recording");
      startTimer();
    } catch {
      setError("Microphone access is required to record. Check browser permissions.");
    }
  }

  function pauseRecording() {
    const rec = mediaRef.current;
    if (!rec || rec.state !== "recording") return;
    rec.pause();
    setRecState("paused");
    stopTimer();
  }

  function resumeRecording() {
    const rec = mediaRef.current;
    if (!rec || rec.state !== "paused") return;
    rec.resume();
    setRecState("recording");
    startTimer();
  }

  function stopRecording() {
    const rec = mediaRef.current;
    if (rec && (rec.state === "recording" || rec.state === "paused")) {
      rec.stop();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    mediaRef.current = null;
    setRecState("idle");
    stopTimer();
  }

  async function handleCompleteClick() {
    if (recState !== "idle") stopRecording();
    // small delay so onstop can flush blob
    await new Promise((r) => setTimeout(r, 200));
    if (!text.trim() && files.length === 0 && audioBlobs.length === 0 && transcriptParts.length === 0) {
      setError("Add typed notes, a recording, or a file before completing.");
      return;
    }
    setError(null);
    setShowComplete(true);
  }

  async function buildSourceText(): Promise<{ text: string; attachments: Attachment[] }> {
    let combined = "";
    const attachments: Attachment[] = [];

    if (text.trim()) {
      combined += `\n\n===== LIVE NOTES =====\n${text.trim()}`;
      attachments.push({
        id: uid("a"),
        name: "live-notes.txt",
        kind: "text",
        size: text.trim().length,
        addedAt: new Date().toISOString(),
        extractedText: text.trim().slice(0, 80000),
      });
    }

    for (let i = 0; i < audioBlobs.length; i++) {
      const blob = audioBlobs[i];
      const file = new File([blob], `session-recording-${i + 1}.webm`, { type: blob.type || "audio/webm" });
      setStatus(`Transcribing recording ${i + 1} of ${audioBlobs.length}…`);
      const transcript = await transcribeLectureFile(file, setStatus);
      combined += `\n\n===== SESSION RECORDING ${i + 1} =====\n${transcript}`;
      attachments.push({
        id: uid("a"),
        name: file.name,
        kind: "audio",
        size: file.size,
        addedAt: new Date().toISOString(),
        extractedText: transcript.slice(0, 80000),
      });
    }

    if (transcriptParts.length) {
      combined += `\n\n===== EARLIER TRANSCRIPT =====\n${transcriptParts.join("\n")}`;
    }

    const audioUploads = files.filter((f) => fileIsAudio(f.file));
    const otherUploads = files.filter((f) => !fileIsAudio(f.file));
    for (const item of audioUploads) {
      setStatus(`Transcribing ${item.file.name}…`);
      const transcript = await transcribeLectureFile(item.file, setStatus);
      combined += `\n\n===== SOURCE: ${item.file.name} =====\n${transcript}`;
      attachments.push({
        id: uid("a"),
        name: item.file.name,
        kind: "audio",
        size: item.file.size,
        addedAt: new Date().toISOString(),
        extractedText: transcript.slice(0, 80000),
      });
    }
    if (otherUploads.length) {
      setStatus("Reading uploaded files…");
      const payloads = await capturedToPayloads(otherUploads);
      const extracted = await extractMaterials({ data: { files: payloads } });
      combined += `\n${extracted.text}`;
      attachments.push(...extracted.attachments);
    }

    return { text: combined.trim(), attachments };
  }

  async function finishSession(opts: {
    classId: string;
    classCode: string;
    className: string;
    subject: string;
    chapterName: string;
  }) {
    setBusy(true);
    setError(null);
    try {
      setStatus("Preparing session materials…");
      const { text: sourceText, attachments } = await buildSourceText();
      if (!sourceText) {
        setError("Nothing to generate from. Add notes, audio, or files.");
        return;
      }
      setStatus("Building study materials…");
      const profile = await getProfile();
      const generated = await generateStudyPackage({
        data: {
          className: opts.className,
          classCode: opts.classCode,
          subject: opts.subject,
          setName: opts.chapterName,
          sourceFiles: attachments.map((a) => a.name),
          extractedText: sourceText,
          kidsMode: Boolean(profile.kidsMode),
          childAge: profile.childAge,
          childGender: profile.childGender,
        },
      });
      setStatus("Saving chapter…");
      const set = await createStudySet({
        data: {
          classId: opts.classId,
          name: opts.chapterName,
          generated,
          sourceFiles: attachments.map((a) => a.name),
          attachments,
        },
      });
      setShowComplete(false);
      setText("");
      setFiles([]);
      setAudioBlobs([]);
      setTranscriptParts([]);
      setRecSeconds(0);
      await navigate({ to: "/class/$id/set/$setId", params: { id: opts.classId, setId: set.id } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete session");
    } finally {
      setBusy(false);
      setStatus(null);
    }
  }

  const mm = String(Math.floor(recSeconds / 60)).padStart(2, "0");
  const ss = String(recSeconds % 60).padStart(2, "0");

  return (
    <AppShell title="Notes">
      <p className="mb-4 text-sm text-muted">
        Type while you listen, record the lecture, and attach files. Pause and resume anytime. When you’re done, hit
        Complete to generate into a class and chapter.
      </p>

      <div className="mx-auto max-w-2xl space-y-4">
        <section className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-fg">Live notes</h2>
            <span className="text-[11px] text-muted">{text.length.toLocaleString()} chars</span>
          </div>
          <textarea
            className="min-h-48 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm leading-relaxed text-fg"
            placeholder="Start typing your notes here…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={busy}
          />
        </section>

        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-2 text-sm font-semibold text-fg">Recording</h2>
          <div className="flex flex-wrap items-center gap-2">
            {recState === "idle" && (
              <Button type="button" onClick={() => void startRecording()} disabled={busy}>
                <Mic className="size-4" />
                Start recording
              </Button>
            )}
            {recState === "recording" && (
              <>
                <Button type="button" variant="secondary" onClick={pauseRecording}>
                  <Pause className="size-4" />
                  Pause
                </Button>
                <Button type="button" variant="secondary" onClick={stopRecording}>
                  <Square className="size-4" />
                  Stop
                </Button>
              </>
            )}
            {recState === "paused" && (
              <>
                <Button type="button" onClick={resumeRecording}>
                  <Play className="size-4" />
                  Resume
                </Button>
                <Button type="button" variant="secondary" onClick={stopRecording}>
                  <Square className="size-4" />
                  Stop
                </Button>
              </>
            )}
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                recState === "recording"
                  ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                  : recState === "paused"
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                    : "bg-bg text-muted"
              }`}
            >
              {recState === "recording" ? "Recording" : recState === "paused" ? "Paused" : "Idle"} · {mm}:{ss}
            </span>
            {audioBlobs.length > 0 && (
              <span className="text-xs text-muted">{audioBlobs.length} segment(s) saved</span>
            )}
          </div>
          <p className="mt-2 text-xs text-muted">You can keep typing while recording. Stop when the segment is done; start again anytime.</p>
        </section>

        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-2 text-sm font-semibold text-fg">Files / photo / scan</h2>
          <CaptureBar items={files} onChange={setFiles} disabled={busy} />
        </section>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red dark:bg-red-950/30">{error}</p>}
        {status && <p className="text-xs text-teal">{status}</p>}

        <div className="flex justify-end">
          <Button disabled={busy} onClick={() => void handleCompleteClick()}>
            <Check className="size-4" />
            Complete session
          </Button>
        </div>
      </div>

      {showComplete && (
        <CompleteModal
          busy={busy}
          status={status}
          onClose={() => !busy && setShowComplete(false)}
          onFinish={(opts) => void finishSession(opts)}
        />
      )}
    </AppShell>
  );
}

function CompleteModal({
  busy,
  status,
  onClose,
  onFinish,
}: {
  busy: boolean;
  status: string | null;
  onClose: () => void;
  onFinish: (opts: {
    classId: string;
    classCode: string;
    className: string;
    subject: string;
    chapterName: string;
  }) => void;
}) {
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [sets, setSets] = useState<StudySet[]>([]);
  const [modeClass, setModeClass] = useState<"existing" | "new">("existing");
  const [modeChapter, setModeChapter] = useState<"existing" | "new">("new");
  const [classId, setClassId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [newClassName, setNewClassName] = useState("");
  const [newClassCode, setNewClassCode] = useState("");
  const [newClassSubject, setNewClassSubject] = useState("");
  const [chapterName, setChapterName] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void listClasses().then((list) => {
      const active = list.filter((c) => !c.archived);
      setClasses(active);
      if (active[0]) setClassId(active[0].id);
    });
  }, []);

  useEffect(() => {
    if (!classId || modeClass === "new") {
      setSets([]);
      return;
    }
    void listStudySets({ data: classId }).then(setSets);
  }, [classId, modeClass]);

  async function submit() {
    setErr(null);
    try {
      let targetClass: ClassRecord | null = null;
      if (modeClass === "new") {
        if (!newClassName.trim() || !newClassCode.trim()) {
          setErr("Enter class name and code.");
          return;
        }
        targetClass = await createClass({
          data: {
            name: newClassName.trim(),
            code: newClassCode.trim(),
            subject: newClassSubject.trim() || newClassName.trim(),
          },
        });
      } else {
        targetClass = classes.find((c) => c.id === classId) || null;
        if (!targetClass) {
          setErr("Select a class.");
          return;
        }
      }

      let name = chapterName.trim();
      if (modeChapter === "existing") {
        const ch = sets.find((s) => s.id === chapterId);
        if (!ch) {
          setErr("Select a chapter, or choose New chapter.");
          return;
        }
        name = ch.name;
      } else if (!name) {
        setErr("Enter a chapter name (e.g. Chapter 3 – Lecture notes).");
        return;
      }

      onFinish({
        classId: targetClass.id,
        classCode: targetClass.code,
        className: targetClass.name,
        subject: targetClass.subject,
        chapterName: name,
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not prepare class");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-xl">
        <h3 className="text-lg font-semibold text-fg">Complete session</h3>
        <p className="mt-1 text-sm text-muted">
          Assign these notes and recordings to a class and chapter, then generate study materials.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <p className="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">Class</p>
            <div className="mb-2 flex gap-2">
              <button
                type="button"
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${modeClass === "existing" ? "bg-teal text-white" : "bg-bg text-fg"}`}
                onClick={() => setModeClass("existing")}
                disabled={busy}
              >
                Existing
              </button>
              <button
                type="button"
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${modeClass === "new" ? "bg-teal text-white" : "bg-bg text-fg"}`}
                onClick={() => setModeClass("new")}
                disabled={busy}
              >
                New class
              </button>
            </div>
            {modeClass === "existing" ? (
              <select
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                disabled={busy}
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} – {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="space-y-2">
                <input className="w-full rounded-lg border border-border px-3 py-2 text-sm" placeholder="Class name" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} disabled={busy} />
                <input className="w-full rounded-lg border border-border px-3 py-2 text-sm" placeholder="Code (e.g. BIOL 101)" value={newClassCode} onChange={(e) => setNewClassCode(e.target.value)} disabled={busy} />
                <input className="w-full rounded-lg border border-border px-3 py-2 text-sm" placeholder="Subject (optional)" value={newClassSubject} onChange={(e) => setNewClassSubject(e.target.value)} disabled={busy} />
              </div>
            )}
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">Chapter</p>
            <div className="mb-2 flex gap-2">
              <button
                type="button"
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${modeChapter === "new" ? "bg-teal text-white" : "bg-bg text-fg"}`}
                onClick={() => setModeChapter("new")}
                disabled={busy}
              >
                New chapter
              </button>
              <button
                type="button"
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${modeChapter === "existing" ? "bg-teal text-white" : "bg-bg text-fg"}`}
                onClick={() => setModeChapter("existing")}
                disabled={busy || modeClass === "new"}
              >
                Existing chapter
              </button>
            </div>
            {modeChapter === "existing" && modeClass === "existing" ? (
              <select
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                value={chapterId}
                onChange={(e) => setChapterId(e.target.value)}
                disabled={busy}
              >
                <option value="">Select chapter…</option>
                {sets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                placeholder="Chapter name (e.g. Week 3 lecture)"
                value={chapterName}
                onChange={(e) => setChapterName(e.target.value)}
                disabled={busy}
              />
            )}
            {modeChapter === "existing" && (
              <p className="mt-1 text-[11px] text-muted">
                Generates a new study package using this chapter’s name (does not overwrite old materials).
              </p>
            )}
          </div>
        </div>

        {err && <p className="mt-3 text-sm text-red">{err}</p>}
        {status && <p className="mt-2 text-xs text-teal">{status}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" disabled={busy} onClick={onClose}>
            Back
          </Button>
          <Button disabled={busy} onClick={() => void submit()}>
            {busy ? "Generating…" : "Generate"}
          </Button>
        </div>
      </div>
    </div>
  );
}
