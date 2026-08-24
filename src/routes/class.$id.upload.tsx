import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { CaptureBar, capturedToPayloads, type CapturedFile } from "@/components/capture-bar";
import { createStudySet, getClassById } from "@/lib/data";
import { extractMaterials, generateStudyPackage } from "@/lib/ai";
import { fileIsAudio, transcribeLectureFile } from "@/lib/transcribe-client";
import { uid } from "@/lib/utils";
import type { Attachment, ClassRecord } from "@/lib/types";

export const Route = createFileRoute("/class/$id/upload")({ component: UploadPage });

function UploadPage() {
  const { id: classId } = Route.useParams();
  const navigate = useNavigate();
  const [cls, setCls] = useState<ClassRecord | null>(null);
  const [name, setName] = useState("");
  const [files, setFiles] = useState<CapturedFile[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    void getClassById({ data: classId }).then((c) => setCls(c));
  }, [classId]);

  async function handleGenerate() {
    if (!name.trim()) {
      setError("Please name this chapter (for example: Chapter 2).");
      return;
    }
    if (!files.length) {
      setError("Add at least one file, photo, or scan.");
      return;
    }
    if (!cls) return;
    setError(null);
    setGenerating(true);
    setStatus("Reading your materials…");
    try {
      const audioItems = files.filter((f) => fileIsAudio(f.file));
      const otherItems = files.filter((f) => !fileIsAudio(f.file));
      let extractedText = "";
      const attachments: Attachment[] = [];
      for (const item of audioItems) {
        const transcript = await transcribeLectureFile(item.file, setStatus);
        extractedText += `\n\n===== SOURCE: ${item.file.name} =====\n${transcript}`;
        attachments.push({
          id: uid("a"),
          name: item.file.name,
          kind: "audio",
          size: item.file.size,
          addedAt: new Date().toISOString(),
          extractedText: transcript.slice(0, 80000),
        });
      }
      if (otherItems.length) {
        setStatus("Reading PDFs and notes…");
        const payloads = await capturedToPayloads(otherItems);
        const extracted = await extractMaterials({ data: { files: payloads } });
        extractedText += `\n${extracted.text}`;
        attachments.push(...extracted.attachments);
      }
      const extracted = {
        text: extractedText.trim(),
        attachments,
      };
      setStatus("Saving this chapter, then building notes in the background…");
      const pending = {
        notes: {
          title: name.trim(),
          subtitle: "Generating… keep this tab open.",
          sections: [{ heading: "Working", body: "Studious AI is writing notes, quiz, and flash cards from your upload.", layout: "stack" as const, bullets: ["This usually takes a few minutes for a long chapter."] }],
          otherResources: [],
        },
        audioScript: "",
        quiz: [],
        flashcards: [],
        slides: [],
      };
      const set = await createStudySet({
        data: {
          classId,
          name: name.trim(),
          generated: pending,
          sourceFiles: extracted.attachments.map((a) => a.name),
          attachments: extracted.attachments,
        },
      });
      void (async () => {
        try {
          const { getProfile } = await import("@/lib/data");
          const profile = await getProfile();
          const generated = await generateStudyPackage({
            data: {
              className: cls.name,
              classCode: cls.code,
              subject: cls.subject,
              setName: name.trim(),
              sourceFiles: extracted.attachments.map((a) => a.name),
              extractedText: extracted.text,
              kidsMode: Boolean(profile.kidsMode),
              childAge: profile.childAge,
            },
          });
          const { updateStudySet } = await import("@/lib/data");
          await updateStudySet({
            data: {
              id: set.id,
              patch: {
                notes: generated.notes,
                audioScript: generated.audioScript,
                quiz: generated.quiz,
                flashcards: generated.flashcards,
              },
            },
          });
        } catch {
          /* class page will still show the pending row */
        }
      })();
      await navigate({ to: "/class/$id", params: { id: classId } });
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : JSON.stringify(err) || "Something went wrong while reading or transcribing the lecture.";
      setError(msg);
      setGenerating(false);
      setStatus("");
    }
  }

  if (!cls) {
    return (
      <AppShell title="Upload">
        <p className="text-sm text-muted">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell title={`${cls.code} – New chapter`}>
      <Link to="/class/$id" params={{ id: classId }} className="mb-4 inline-block text-sm text-teal hover:underline">
        ← Back to class
      </Link>
      <div className="mx-auto max-w-lg">
        <div className="card-surface rounded-xl p-5 sm:p-6">
          <h2 className="mb-1 text-base font-semibold">New chapter</h2>
          <p className="mb-5 text-xs text-muted">
            Name the set, then attach files, take a photo, or scan a page. Generate when you’re ready.
          </p>
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium text-muted">Name this set</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chapter 2"
              disabled={generating}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-teal"
            />
          </div>
          <CaptureBar items={files} onChange={setFiles} disabled={generating} />
          {error && <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red">{error}</div>}
          {status && generating && <div className="mt-4 text-sm text-teal">{status}</div>}
          <div className="mt-5 flex justify-end gap-2">
            <Link to="/class/$id" params={{ id: classId }}>
              <Button type="button" variant="secondary" disabled={generating}>
                Cancel
              </Button>
            </Link>
            <Button type="button" onClick={() => void handleGenerate()} disabled={generating || !files.length || !name.trim()}>
              {generating ? "Generating…" : "Generate study materials"}
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
