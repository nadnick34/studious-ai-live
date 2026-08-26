import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileText, Headphones, ListChecks, Plus, Target } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { getMeetingById, listMeetingSessions, updateMeeting } from "@/lib/data";
import type { MeetingRecord, MeetingSession } from "@/lib/types";

export const Route = createFileRoute("/meeting/$id/")({
  component: MeetingHome,
});

function MeetingHome() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState<MeetingRecord | null>(null);
  const [sessions, setSessions] = useState<MeetingSession[]>([]);

  useEffect(() => {
    void Promise.all([getMeetingById({ data: id }), listMeetingSessions({ data: id })]).then(([m, s]) => {
      setMeeting(m);
      setSessions(s);
    });
  }, [id]);

  if (!meeting) {
    return (
      <AppShell title="Meeting">
        <p className="text-sm text-muted">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={meeting.name}
      right={
        <Link to="/meeting/$id/upload" params={{ id }}>
          <Button className="min-h-10 text-xs">
            <Plus className="size-4" />
            Add materials
          </Button>
        </Link>
      }
    >
      <div className="mb-4 flex items-center justify-between">
        <Link to="/meetings" className="text-sm text-teal hover:underline">
          ← Meetings
        </Link>
        <button
          type="button"
          className="text-xs text-muted hover:text-fg"
          onClick={() => {
            if (!confirm("Archive this meeting?")) return;
            void updateMeeting({ data: { id, patch: { archived: true } } }).then(() =>
              navigate({ to: "/meetings" }),
            );
          }}
        >
          Archive
        </button>
      </div>

      <div className="mb-5 rounded-xl border border-border bg-card p-4 text-sm">
        <div className="font-semibold text-fg">{meeting.name}</div>
        <div className="mt-1 text-xs text-muted">
          {meeting.category} · {meeting.meetingType}
          {meeting.companyName ? ` · ${meeting.companyName}` : ""}
        </div>
        {meeting.subject && <p className="mt-2 text-fg/90">{meeting.subject}</p>}
        <div className="mt-2 grid gap-1 text-xs text-muted sm:grid-cols-2">
          {meeting.organizer && <div>Organizer: {meeting.organizer}</div>}
          {meeting.location && <div>Location: {meeting.location}</div>}
          {meeting.meetingAt && <div>When: {new Date(meeting.meetingAt).toLocaleString()}</div>}
          {meeting.attendees && <div className="sm:col-span-2">Attendees: {meeting.attendees}</div>}
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-4 py-12 text-center text-sm text-muted">
          No materials yet. Upload notes, photos, scans, or audio to generate a summary.
          <div className="mt-4">
            <Link to="/meeting/$id/upload" params={{ id }}>
              <Button>Add materials</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <div key={s.id} className="rounded-xl border border-border bg-card p-4">
              <div className="font-semibold text-fg">{s.name}</div>
              <div className="text-xs text-muted">{new Date(s.createdAt).toLocaleString()}</div>
              <div className="mt-3 grid grid-cols-3 gap-1">
                <Link
                  to="/meeting/$id/session/$sessionId"
                  params={{ id, sessionId: s.id }}
                  className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg bg-bg text-[11px] font-medium hover:text-teal"
                >
                  <FileText className="size-4" />
                  Notes
                </Link>
                <Link
                  to="/meeting/$id/session/$sessionId"
                  params={{ id, sessionId: s.id }}
                  className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg bg-bg text-[11px] font-medium hover:text-teal"
                >
                  <Target className="size-4" />
                  Focus
                </Link>
                <Link
                  to="/meeting/$id/session/$sessionId"
                  params={{ id, sessionId: s.id }}
                  className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg bg-bg text-[11px] font-medium hover:text-teal"
                >
                  <ListChecks className="size-4" />
                  Actions
                </Link>
              </div>
              <div className="mt-2">
                <Link
                  to="/meeting/$id/session/$sessionId"
                  params={{ id, sessionId: s.id }}
                  className="inline-flex items-center gap-1 text-xs text-teal"
                >
                  <Headphones className="size-3.5" /> Narrative audio script
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
