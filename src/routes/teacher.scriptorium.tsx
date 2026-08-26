import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { CaptureBar, capturedToPayloads, type CapturedFile } from "@/components/capture-bar";
import { Button } from "@/components/ui/button";
import { extractMaterials, generateScriptoriumPacket } from "@/lib/ai";
import { getProfile } from "@/lib/data";
import { brandFromProfile } from "@/lib/schools";

export const Route = createFileRoute("/teacher/scriptorium")({
  component: ScriptoriumPage,
});

const GEN_TYPES = ["Study Guide", "Quiz", "Test", "Practice"] as const;
const FORMATS = ["Multiple Choice", "Essay", "Fill in the Blank", "Problem Set", "Mixed"] as const;
const LOG_KEY = "studious-scriptorium-log";

type Packet = {
  generateType?: string;
  title?: string;
  subject?: string;
  schoolName?: string;
  date?: string;
  itemFormat?: string;
  overview?: string;
  narrative?: string;
  keyTerms?: { term: string; definition: string }[];
  guideSections?: { heading: string; bullets: string[] }[];
  keyDates?: { date: string; event: string }[];
  questions?: {
    number: number;
    type: string;
    prompt: string;
    choices?: string[];
    section?: string;
  }[];
  answerKey?: { number: number; answer: string; rationale?: string }[];
  resources?: { title: string; url?: string; note?: string }[];
};

type LogItem = {
  id: string;
  at: string;
  generateType: string;
  title: string;
  subject: string;
  format?: string;
  schoolName?: string;
};

function loadLog(): LogItem[] {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) || "[]") as LogItem[];
  } catch {
    return [];
  }
}

function ScriptoriumPage() {
  const [genType, setGenType] = useState<(typeof GEN_TYPES)[number]>("Study Guide");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [date, setDate] = useState("");
  const [format, setFormat] = useState<(typeof FORMATS)[number]>("Mixed");
  const [count, setCount] = useState(10);
  const [comments, setComments] = useState("");
  const [files, setFiles] = useState<CapturedFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [packet, setPacket] = useState<Packet | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [log, setLog] = useState<LogItem[]>([]);

  const isAssess = genType !== "Study Guide";

  useEffect(() => {
    setLog(loadLog());
    void getProfile()
      .then((p) => {
        const brand = brandFromProfile(p);
        const name = brand?.name || p.customSchoolName || "";
        if (name && name !== "Studious") setSchoolName(name);
      })
      .catch(() => {});
  }, []);

  async function generate() {
    if (!title.trim()) {
      setError("Give the packet a title.");
      return;
    }
    if (!subject.trim()) {
      setError("Enter a subject so items can be written appropriately.");
      return;
    }
    if (!files.length && !comments.trim()) {
      setError("Upload source pages or enter focus comments (or both).");
      return;
    }
    setBusy(true);
    setError(null);
    setStatus("Reading sources…");
    try {
      let extractedText = "";
      if (files.length) {
        const payloads = await capturedToPayloads(files);
        const extracted = await extractMaterials({ data: { files: payloads } });
        extractedText = extracted.text || "";
      }
      const profile = await getProfile().catch(() => null);
      setStatus("Composing the packet…");
      const result = (await generateScriptoriumPacket({
        data: {
          generateType: genType,
          title: title.trim(),
          subject: subject.trim(),
          schoolName: schoolName.trim(),
          date: date.trim(),
          itemFormat: format,
          questionCount: count,
          comments: comments.trim(),
          extractedText,
          schoolType: profile?.schoolSelect || "Classical",
        },
      })) as Packet;
      setPacket(result);
      setShowKey(false);
      const entry: LogItem = {
        id: `${Date.now()}`,
        at: new Date().toISOString(),
        generateType: genType,
        title: result.title || title.trim(),
        subject: result.subject || subject.trim(),
        format: isAssess ? format : undefined,
        schoolName: schoolName.trim() || undefined,
      };
      const nextLog = [entry, ...loadLog()].slice(0, 40);
      localStorage.setItem(LOG_KEY, JSON.stringify(nextLog));
      setLog(nextLog);
      setStatus("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="Scriptorium">
      <div className="mx-auto max-w-3xl space-y-5">
        <div>
          <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">Teacher workshop</p>
          <h2 className="text-xl font-semibold text-fg">Scriptorium</h2>
          <p className="mt-1 text-sm text-muted">
            Upload textbook pages, scans, photos, or notes. Add focus comments. Generate a study guide, quiz, test, or
            practice set — classical in tone, faithful to your sources.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-muted">
              Generate
              <select
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm text-fg"
                value={genType}
                onChange={(e) => setGenType(e.target.value as (typeof GEN_TYPES)[number])}
                disabled={busy}
              >
                {GEN_TYPES.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-muted">
              Subject
              <input
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm text-fg"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="U.S. History, Algebra I…"
                disabled={busy}
              />
            </label>
            <label className="block text-xs text-muted sm:col-span-2">
              Title
              <input
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm text-fg"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Chapter 3 Study Guide"
                disabled={busy}
              />
            </label>
            <label className="block text-xs text-muted sm:col-span-2">
              School name
              <input
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm text-fg"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="Pulled from your profile — edit if needed"
                disabled={busy}
              />
            </label>
            {isAssess && (
              <>
                <label className="block text-xs text-muted">
                  Date
                  <input
                    type="date"
                    className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm text-fg"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    disabled={busy}
                  />
                </label>
                <label className="block text-xs text-muted">
                  Test/Quiz Format
                  <select
                    className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm text-fg"
                    value={format}
                    onChange={(e) => setFormat(e.target.value as (typeof FORMATS)[number])}
                    disabled={busy}
                  >
                    {FORMATS.map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs text-muted sm:col-span-2">
                  Number of questions ({count})
                  <input
                    type="range"
                    min={5}
                    max={25}
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="mt-2 w-full"
                    disabled={busy}
                  />
                </label>
              </>
            )}
          </div>

          <label className="mt-3 block text-xs text-muted">
            Comments / focus areas
            <textarea
              className="mt-1 min-h-24 w-full rounded-lg border border-border px-3 py-2 text-sm text-fg"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Emphasize causation in the Civil War; include vocabulary from pages 44–51…"
              disabled={busy}
            />
          </label>

          <div className="mt-3">
            <div className="mb-1 text-xs text-muted">Source pages — files, photo, or scan</div>
            <div className="rounded-xl border border-dashed border-border bg-bg/50 p-3">
              <CaptureBar items={files} onChange={setFiles} disabled={busy} />
            </div>
          </div>

          {status && <p className="mt-3 text-xs text-teal">{status}</p>}
          {error && <p className="mt-3 text-sm text-red">{error}</p>}

          <div className="mt-4 flex justify-end">
            <Button disabled={busy} onClick={() => void generate()}>
              {busy ? "Generating…" : `Generate ${genType}`}
            </Button>
          </div>
        </div>

        {packet && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-end gap-2 print:hidden">
              {isAssess && !!packet.answerKey?.length && (
                <Button variant="secondary" onClick={() => setShowKey((v) => !v)}>
                  {showKey ? "Show student copy" : "Show answer key"}
                </Button>
              )}
              <Button variant="secondary" onClick={() => window.print()}>
                Print / PDF
              </Button>
            </div>
            <PacketView packet={packet} showKey={showKey} isAssess={isAssess} fallbackDate={date} schoolName={schoolName} />
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card p-5 print:hidden">
          <h3 className="text-sm font-semibold text-fg">Scriptorium log</h3>
          <p className="mt-0.5 text-xs text-muted">What this account has generated in this browser.</p>
          {log.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Nothing generated yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border text-sm">
              {log.map((item) => (
                <li key={item.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
                  <div>
                    <span className="font-medium text-fg">{item.title}</span>
                    <span className="text-muted">
                      {" "}
                      · {item.generateType}
                      {item.format ? ` · ${item.format}` : ""} · {item.subject}
                    </span>
                  </div>
                  <span className="text-xs text-muted">
                    {new Date(item.at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function PacketView({
  packet,
  showKey,
  isAssess,
  fallbackDate,
  schoolName,
}: {
  packet: Packet;
  showKey: boolean;
  isAssess: boolean;
  fallbackDate: string;
  schoolName: string;
}) {
  const dateLine = packet.date || fallbackDate || "____________";
  const school = packet.schoolName || schoolName;
  const vocabQs = (packet.questions || []).filter((q) =>
    /vocab/i.test(`${q.type} ${q.section || ""}`),
  );
  const otherQs = (packet.questions || []).filter(
    (q) => !/vocab/i.test(`${q.type} ${q.section || ""}`),
  );

  return (
    <article className="rounded-2xl border border-border bg-card p-6 print:border-0">
      <header className="mb-5 border-b border-border pb-4">
        {school ? <p className="text-center text-sm text-muted">{school}</p> : null}
        <h3 className="mt-1 text-center text-2xl font-semibold text-fg">{packet.title}</h3>
        <p className="text-center text-sm text-muted">
          {packet.subject}
          {packet.generateType ? ` · ${packet.generateType}` : ""}
          {isAssess && packet.itemFormat ? ` · ${packet.itemFormat}` : ""}
        </p>
        {isAssess && (
          <div className="mt-4 flex items-end justify-between gap-6 text-sm">
            <p className="min-w-0">
              Date: <span className="inline-block min-w-28 border-b border-fg/50">{dateLine}</span>
            </p>
            <p className="min-w-0 text-right">
              Student Name: <span className="inline-block min-w-40 border-b border-fg/50">&nbsp;</span>
            </p>
          </div>
        )}
      </header>

      {!isAssess && packet.narrative && (
        <section className="mb-5">
          <h4 className="mb-2 text-sm font-semibold text-fg">Narrative</h4>
          {packet.narrative.split(/\n+/).map((para, i) => (
            <p key={i} className="mb-2 text-sm leading-relaxed text-fg">
              {para}
            </p>
          ))}
        </section>
      )}

      {!isAssess && !!packet.keyTerms?.length && (
        <section className="mb-5">
          <h4 className="mb-2 text-sm font-semibold text-fg">Key Terms and Vocabulary</h4>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] tracking-wide text-muted uppercase">
                <th className="py-2 pr-3">Term</th>
                <th className="py-2">Definition</th>
              </tr>
            </thead>
            <tbody>
              {packet.keyTerms.map((k) => (
                <tr key={k.term} className="border-b border-border/70 align-top">
                  <td className="py-2 pr-3 font-medium">{k.term}</td>
                  <td className="py-2">{k.definition}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {!isAssess && !!packet.guideSections?.length && (
        <section className="mb-5 space-y-3">
          {packet.guideSections.map((s) => (
            <div key={s.heading}>
              <h4 className="text-sm font-semibold text-fg">{s.heading}</h4>
              <ul className="mt-1 list-disc pl-5 text-sm">
                {(s.bullets || []).map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {!isAssess && !!packet.keyDates?.length && (
        <section className="mb-5">
          <h4 className="mb-2 text-sm font-semibold text-fg">Key Dates</h4>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] tracking-wide text-muted uppercase">
                <th className="py-2 pr-3">Date</th>
                <th className="py-2">Event</th>
              </tr>
            </thead>
            <tbody>
              {packet.keyDates.map((d) => (
                <tr key={`${d.date}-${d.event}`} className="border-b border-border/70 align-top">
                  <td className="py-2 pr-3 font-medium whitespace-nowrap">{d.date}</td>
                  <td className="py-2">{d.event}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {isAssess && !!packet.questions?.length && (
        <section className="mb-5 space-y-5">
          {vocabQs.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-fg">Vocabulary Fill in the Blank</h4>
              {vocabQs.map((q) => (
                <QuestionBlock key={q.number} q={q} showKey={showKey} answer={packet.answerKey?.find((a) => a.number === q.number)} />
              ))}
            </div>
          )}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-fg">{showKey ? "Answer Key" : vocabQs.length ? "Questions" : "Questions"}</h4>
            {(otherQs.length ? otherQs : vocabQs.length ? [] : packet.questions).map((q) => (
              <QuestionBlock key={q.number} q={q} showKey={showKey} answer={packet.answerKey?.find((a) => a.number === q.number)} />
            ))}
          </div>
        </section>
      )}

      {!isAssess && !!packet.resources?.length && (
        <section>
          <h4 className="mb-2 text-sm font-semibold text-fg">Additional Resources</h4>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {packet.resources.map((r) => (
              <li key={r.title}>
                {r.url ? (
                  <a href={r.url} target="_blank" rel="noreferrer" className="text-teal hover:underline">
                    {r.title}
                  </a>
                ) : (
                  r.title
                )}
                {r.note ? ` — ${r.note}` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

function QuestionBlock({
  q,
  showKey,
  answer,
}: {
  q: NonNullable<Packet["questions"]>[number];
  showKey: boolean;
  answer?: { answer: string; rationale?: string };
}) {
  return (
    <div className="text-sm">
      <p className="font-medium">
        {q.number}. {q.prompt}
      </p>
      {q.type === "Problem Set" && !showKey && <p className="mt-1 text-xs italic text-muted">Show your work.</p>}
      {!!q.choices?.length && (
        <ul className="mt-1 space-y-0.5 pl-4">
          {q.choices.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      )}
      {!showKey && q.type !== "Multiple Choice" && (
        <div className="mt-2 min-h-12 rounded border border-dashed border-border" />
      )}
      {showKey && answer && (
        <p className="mt-1 text-emerald-700">
          <span className="font-semibold">Answer:</span> {answer.answer}
          {answer.rationale ? ` — ${answer.rationale}` : ""}
        </p>
      )}
    </div>
  );
}
