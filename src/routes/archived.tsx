import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { listArchivedAssignments, listArchivedMeetings, listClasses, listPaperChecks, setAssignmentArchived, setPaperCheckArchived, updateClass, updateMeeting } from "@/lib/data";
import { fetchProfileShared } from "@/lib/profile-cache";
import type { AssignmentRecord, ClassRecord, MeetingRecord } from "@/lib/types";

export const Route = createFileRoute("/archived")({ component: ArchivedPage });

function ArchivedPage() {
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [checks, setChecks] = useState<AssignmentRecord[]>([]);
  const [papers, setPapers] = useState<{ id: string; title: string; mode: string; band: string; createdAt: string }[]>([]);
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [professional, setProfessional] = useState(false);

  async function refresh() {
    const profile = await fetchProfileShared();
    if (profile.role === "professional") {
      setProfessional(true);
      setMeetings(await listArchivedMeetings());
      setClasses([]);
      setChecks([]);
      setPapers([]);
      return;
    }
    setProfessional(false);
    const [c, a, p] = await Promise.all([
      listClasses({ data: true }),
      listArchivedAssignments(),
      listPaperChecks({ data: true }),
    ]);
    setClasses(c);
    setChecks(a);
    setPapers(p);
  }

  useEffect(() => { void refresh(); }, []);

  return (
    <AppShell title="Archive">
      {professional ? (
        <Section title="Meetings" empty="No archived meetings.">
          {meetings.map((m) => (
            <Row key={m.id} title={m.name} meta={m.category} onRestore={async () => { await updateMeeting({ data: { id: m.id, patch: { archived: false } } }); await refresh(); }} />
          ))}
        </Section>
      ) : null}
      {!professional && (
        <>
          <Section title="Classes" empty="No archived classes.">
            {classes.map((c) => (
              <Row key={c.id} title={c.name} meta={c.code} onRestore={async () => { await updateClass({ data: { id: c.id, patch: { archived: false } } }); await refresh(); }}>
                <Link to="/class/$id" params={{ id: c.id }}><Button variant="secondary" className="text-xs">Open</Button></Link>
              </Row>
            ))}
          </Section>
          <Section title="Assignment Assistant" empty="No archived checks.">
            {checks.map((c) => (
              <Row key={c.id} title={c.title} meta={new Date(c.createdAt).toLocaleDateString()} onRestore={async () => { await setAssignmentArchived({ data: { id: c.id, archived: false } }); await refresh(); }} />
            ))}
          </Section>
          <Section title="Paper Grade" empty="No archived paper checks.">
            {papers.map((c) => (
              <Row key={c.id} title={c.title} meta={[c.mode, c.band].filter(Boolean).join(" · ")} onRestore={async () => { await setPaperCheckArchived({ data: { id: c.id, archived: false } }); await refresh(); }} />
            ))}
          </Section>
        </>
      )}
    </AppShell>
  );
}

function Section({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  const items = Array.isArray(children) ? children : [children];
  const has = items.some(Boolean);
  return (
    <section className="mb-6">
      <h2 className="mb-2 text-sm font-bold">{title}</h2>
      {has ? <div className="space-y-2">{children}</div> : <p className="text-sm text-muted">{empty}</p>}
    </section>
  );
}

function Row({ title, meta, onRestore, children }: { title: string; meta?: string; onRestore: () => Promise<void>; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <div>
        <div className="font-medium">{title}</div>
        {meta && <div className="text-xs text-muted">{meta}</div>}
      </div>
      <div className="flex gap-2">
        {children}
        <Button className="text-xs" onClick={() => void onRestore()}>Restore</Button>
      </div>
    </div>
  );
}
