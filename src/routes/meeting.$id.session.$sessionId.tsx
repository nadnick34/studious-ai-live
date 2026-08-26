import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { BrowserTtsPlayer } from "@/components/browser-tts-player";
import { getMeetingById, getMeetingSessionById } from "@/lib/data";
import type { MeetingRecord, MeetingSession } from "@/lib/types";

export const Route = createFileRoute("/meeting/$id/session/$sessionId")({
  component: SessionPage,
});

function SessionPage() {
  const { id, sessionId } = Route.useParams();
  const [meeting, setMeeting] = useState<MeetingRecord | null>(null);
  const [session, setSession] = useState<MeetingSession | null>(null);
  const [tab, setTab] = useState<"notes" | "focus" | "actions" | "audio">("notes");

  useEffect(() => {
    void Promise.all([getMeetingById({ data: id }), getMeetingSessionById({ data: sessionId })]).then(
      ([m, s]) => {
        setMeeting(m);
        setSession(s);
      },
    );
  }, [id, sessionId]);

  if (!meeting || !session) {
    return (
      <AppShell title="Session">
        <p className="text-sm text-muted">Loading…</p>
      </AppShell>
    );
  }

  const tabs = [
    { id: "notes" as const, label: "Notes" },
    { id: "focus" as const, label: "Focus items" },
    { id: "actions" as const, label: "Action items" },
    { id: "audio" as const, label: "Audio" },
  ];

  return (
    <AppShell title={session.name}>
      <Link to="/meeting/$id" params={{ id }} className="mb-4 inline-block text-sm text-teal hover:underline">
        ← {meeting.name}
      </Link>

      <div className="mb-4 flex flex-wrap gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              tab === t.id ? "bg-slate text-white" : "bg-card text-muted border border-border"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "notes" && (
        <div className="mx-auto max-w-2xl space-y-4">
          <h2 className="font-serif text-xl font-semibold text-fg">{session.notes?.title || session.name}</h2>
          {session.notes?.subtitle && <p className="text-sm text-muted">{session.notes.subtitle}</p>}
          {(session.notes?.sections || []).map((sec, i) => (
            <section key={i} className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-2 font-semibold text-fg">{sec.heading}</h3>
              {sec.body && <p className="mb-2 text-sm text-fg/90">{sec.body}</p>}
              {sec.bullets && (
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {sec.bullets.map((b, j) => (
                    <li key={j}>{b}</li>
                  ))}
                </ul>
              )}
              {sec.table && (
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr>
                        {sec.table.headers.map((h, j) => (
                          <th key={j} className="border-b border-border px-2 py-1 font-semibold">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sec.table.rows.map((row, r) => (
                        <tr key={r}>
                          {row.map((cell, c) => (
                            <td key={c} className="border-b border-border/60 px-2 py-1">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}
          {session.notes?.speakers && session.notes.speakers.length > 0 && (
            <section className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-2 font-semibold text-fg">Speakers</h3>
              {session.notes.speakers.map((sp, i) => (
                <div key={i} className="mb-3">
                  <p className="text-sm font-medium text-fg">{sp.name}</p>
                  <ul className="list-disc pl-5 text-sm text-fg/90">
                    {sp.points.map((pt, j) => (
                      <li key={j}>{pt}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          )}
        </div>
      )}

      {tab === "focus" && (
        <div className="mx-auto max-w-xl space-y-2">
          {(session.focusItems || []).length === 0 ? (
            <p className="text-sm text-muted">No focus items yet (still generating or none found).</p>
          ) : (
            session.focusItems.map((f) => (
              <div key={f.id} className="rounded-xl border border-border bg-card p-3">
                <p className="font-medium text-fg">{f.phrase}</p>
                {f.why && <p className="mt-1 text-sm text-muted">{f.why}</p>}
              </div>
            ))
          )}
        </div>
      )}

      {tab === "actions" && (
        <div className="mx-auto max-w-xl space-y-2">
          {(session.actionItems || []).length === 0 ? (
            <p className="text-sm text-muted">No action items yet.</p>
          ) : (
            session.actionItems.map((a) => (
              <div key={a.id} className="rounded-xl border border-border bg-card p-3 text-sm">
                <p className="font-medium text-fg">{a.action}</p>
                <div className="mt-1 text-xs text-muted">
                  {a.owner && <span>Owner: {a.owner}</span>}
                  {a.dueHint && <span> · {a.dueHint}</span>}
                  {a.audience && <span> · Notify: {a.audience}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "audio" && (
        <div className="mx-auto max-w-xl">
          {session.audioScript ? (
            <>
              <BrowserTtsPlayer text={session.audioScript} title="Meeting narrative" />
              <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-border bg-card p-4 text-sm leading-relaxed">
                {session.audioScript}
              </pre>
            </>
          ) : (
            <p className="text-sm text-muted">Narrative script not ready yet.</p>
          )}
        </div>
      )}
    </AppShell>
  );
}
