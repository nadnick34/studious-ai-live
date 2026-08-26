import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { CaptureBar, capturedToPayloads, type CapturedFile } from "@/components/capture-bar";
import { Button } from "@/components/ui/button";
import { extractMaterials, generateMeetingPackage } from "@/lib/ai";
import { createMeetingSession, getMeetingById } from "@/lib/data";
import { fileIsAudio, transcribeLectureFile } from "@/lib/transcribe-client";
import { uid } from "@/lib/utils";
import type { Attachment, MeetingRecord } from "@/lib/types";

export const Route = createFileRoute("/meeting/$id/upload")({
  component: MeetingUploadPage,
});

function MeetingUploadPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState<MeetingRecord | null>(null);
  const [name, setName] = useState("Session notes");
  const [files, setFiles] = useState<CapturedFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getMeetingById({ data: id }).then(setMeeting);
  }, [id]);

  async function handleGenerate() {
    if (!meeting) return;
    if (!files.length) {
      setError("Add at least one file, photo, scan, or audio.");
      return;
    }
    setBusy(true);
    setError(null);
    setStatus("Reading materials…");
    try {
      const audioItems = files.filter((f) => fileIsAudio(f.file));
      const otherItems = files.filter((f) => !fileIsAudio(f.file));
      let extractedText = "";
      const attachments: Attachment[] = [];
      for (const item of audioItems) {
        const transcript = await transcribeLectureFile(item.file, setStatus);
        extractedText += `\n\n===== AUDIO: ${item.file.name} =====\n${transcript}`;
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
        setStatus("Reading documents and images…");
        const payloads = await capturedToPayloads(otherItems);
        const extracted = await extractMaterials({ data: { files: payloads } });
        extractedText += `\n${extracted.text}`;
        attachments.push(...extracted.attachments);
      }
      if (meeting.agendaText) extractedText = `AGENDA:\n${meeting.agendaText}\n\n${extractedText}`;
      if (meeting.inviteText) extractedText = `INVITE CONTEXT:\n${meeting.inviteText.slice(0, 5000)}\n\n${extractedText}`;

      setStatus("Saving session — analysis continues in the background…");
      const pending = {
        notes: {
          title: name.trim() || "Session notes",
          subtitle: "Generating… you can leave this page.",
          sections: [
            {
              heading: "Working",
              body: "Studious is building notes, focus items, and action items from your upload.",
              layout: "stack" as const,
              bullets: ["Refresh the meeting page in a few minutes."],
            },
          ],
        },
        focusItems: [],
        actionItems: [],
        audioScript: "",
      };
      const session = await createMeetingSession({
        data: {
          meetingId: id,
          name: name.trim() || "Session notes",
          generated: pending,
          sourceFiles: attachments.map((a) => a.name),
          attachments,
        },
      });

      void (async () => {
        try {
          const generated = await generateMeetingPackage({
            data: {
              meetingName: meeting.name,
              category: meeting.category,
              organizer: meeting.organizer,
              meetingType: meeting.meetingType,
              subject: meeting.subject,
              companyName: meeting.companyName,
              location: meeting.location,
              meetingAt: meeting.meetingAt,
              attendees: meeting.attendees,
              agendaText: meeting.agendaText,
              miscNotes: meeting.miscNotes,
              extractedText: extractedText.trim(),
              sourceFiles: attachments.map((a) => a.name),
            },
          });
          const { updateMeetingSession } = await import("@/lib/data");
          await updateMeetingSession({
            data: {
              id: session.id,
              patch: {
                notes: generated.notes,
                focusItems: generated.focusItems,
                actionItems: generated.actionItems,
                audioScript: generated.audioScript,
              },
            },
          });
        } catch {
          /* pending row remains */
        }
      })();

      await navigate({ to: "/meeting/$id", params: { id } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setBusy(false);
      setStatus("");
    }
  }

  if (!meeting) {
    return (
      <AppShell title="Add materials">
        <p className="text-sm text-muted">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="Add materials">
      <Link to="/meeting/$id" params={{ id }} className="mb-4 inline-block text-sm text-teal hover:underline">
        ← {meeting.name}
      </Link>
      <div className="mx-auto max-w-xl space-y-4">
        <input
          className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          placeholder="Session label (e.g. Kickoff discussion)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={busy}
        />
        <CaptureBar items={files} onChange={setFiles} disabled={busy} />
        {status && <p className="text-xs text-teal">{status}</p>}
        {error && <p className="text-sm text-red">{error}</p>}
        <Button disabled={busy} onClick={() => void handleGenerate()}>
          {busy ? "Working…" : "Generate notes & actions"}
        </Button>
      </div>
    </AppShell>
  );
}
