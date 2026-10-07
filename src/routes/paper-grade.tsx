import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { CaptureBar, capturedToPayloads, type CapturedFile } from "@/components/capture-bar";
import { Button } from "@/components/ui/button";
import { extractMaterials, gradePaper } from "@/lib/ai";

export const Route = createFileRoute("/paper-grade")({ component: PaperGradePage });

type Result = { mode: "guide" | "check"; band?: string; sections: { heading: string; bullets: string[] }[] };

function PaperGradePage() {
  const [instructions, setInstructions] = useState("");
  const [captured, setCaptured] = useState<CapturedFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function run(mode: "guide" | "check") {
    setBusy(true);
    setError(null);
    try {
      let text = instructions.trim();
      if (captured.length) {
        const extracted = await extractMaterials({ data: { files: await capturedToPayloads(captured) } });
        text = [text, extracted.text].filter(Boolean).join("\n\n");
      }
      if (!text.trim()) {
        setError("Add the prompt or the paper first.");
        return;
      }
      setResult(await gradePaper({ data: { mode, instructions: text, paperText: text } }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Paper grade failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="Paper Grade">
      <section className="space-y-3 rounded-xl border border-border bg-card p-4">
        <h2 className="font-semibold">Paper material</h2>
        <p className="text-xs text-muted">Add the instructions, a photo, a scan, or the draft. Use Writing guide before you write. Use Check paper after.</p>
        <CaptureBar items={captured} onChange={setCaptured} disabled={busy} />
        <textarea className="min-h-28 w-full rounded-lg border border-border px-3 py-2 text-sm" placeholder="Paste the prompt or the paper" value={instructions} onChange={(e) => setInstructions(e.target.value)} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="grid grid-cols-2 gap-2">
          <Button disabled={busy} onClick={() => void run("guide")}>{busy ? "Working…" : "Writing guide"}</Button>
          <Button disabled={busy} variant="secondary" onClick={() => void run("check")}>Check paper</Button>
        </div>
      </section>
      {result && (
        <section className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">{result.mode === "guide" ? "Writing guide" : "Paper check"}</h2>
            {result.band && <span className="rounded-lg border border-teal px-3 py-1 font-bold text-teal">{result.band}</span>}
          </div>
          {result.sections.map((sec) => (
            <article key={sec.heading} className="rounded-xl border border-border bg-card px-4 py-3">
              <h3 className="font-bold">{sec.heading}</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {sec.bullets.map((b) => <li key={b}>{b}</li>)}
              </ul>
            </article>
          ))}
        </section>
      )}
    </AppShell>
  );
}
