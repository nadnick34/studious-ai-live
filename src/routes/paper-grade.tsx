import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { extractMaterials, gradePaper } from "@/lib/ai";

export const Route = createFileRoute("/paper-grade")({ component: PaperGradePage });

type Result = {
  mode: "guide" | "check";
  band?: string;
  sections: { heading: string; bullets: string[] }[];
};

function PaperGradePage() {
  const [instructions, setInstructions] = useState("");
  const [paperText, setPaperText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function run(mode: "guide" | "check") {
    setBusy(true);
    setError(null);
    try {
      let extracted = paperText;
      if (files.length) {
        const payload = await Promise.all(
          files.map(async (file) => ({
            name: file.name,
            type: file.type || "application/octet-stream",
            size: file.size,
            base64: await fileToBase64(file),
          })),
        );
        const out = await extractMaterials({ data: { files: payload } });
        extracted = [paperText, out.text].filter(Boolean).join("\n\n");
      }
      const graded = await gradePaper({ data: { mode, instructions, paperText: extracted } });
      setResult(graded);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Paper grade failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="Paper Grade">
      <p className="text-sm text-muted">Add the instructions, then a writing guide. After the paper is written, upload it for a check.</p>
      <label className="mt-4 block text-xs font-semibold text-muted">Instructions</label>
      <textarea className="mt-1 min-h-24 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Prompt, rubric, or what the paper has to do" />
      <label className="mt-3 block text-xs font-semibold text-muted">Paper, if written</label>
      <textarea className="mt-1 min-h-24 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" value={paperText} onChange={(e) => setPaperText(e.target.value)} placeholder="Paste the draft, or upload it below" />
      <input className="mt-3 block w-full text-sm" type="file" multiple accept="application/pdf,image/*,.txt,.doc,.docx" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button disabled={busy} onClick={() => void run("guide")}>{busy ? "Working…" : "Writing guide"}</Button>
        <Button disabled={busy} variant="secondary" onClick={() => void run("check")}>Check paper</Button>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {result && (
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">{result.mode === "guide" ? "Writing guide" : "Paper check"}</h2>
            <Button variant="secondary" onClick={() => window.print()}>Print</Button>
          </div>
          {result.band && <p className="inline-flex rounded-lg border border-teal px-3 py-2 text-lg font-bold text-teal">{result.band}</p>}
          {result.sections.map((sec) => (
            <article key={sec.heading} className="rounded-xl border border-border bg-card px-4 py-3">
              <h3 className="font-bold">{sec.heading}</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {sec.bullets.map((b) => <li key={b}>{b}</li>)}
              </ul>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
