import { useEffect, useState } from "react";
import { Pause, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BrowserTtsPlayer({ text, title }: { text: string; title?: string }) {
  const [state, setState] = useState<"idle" | "playing" | "paused">("idle");

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function play() {
    if (!text.trim() || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    u.onend = () => setState("idle");
    u.onerror = () => setState("idle");
    window.speechSynthesis.speak(u);
    setState("playing");
  }

  function pause() {
    window.speechSynthesis.pause();
    setState("paused");
  }

  function resume() {
    window.speechSynthesis.resume();
    setState("playing");
  }

  function stop() {
    window.speechSynthesis.cancel();
    setState("idle");
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      {title && <p className="mb-2 text-sm font-medium text-fg">{title}</p>}
      <div className="flex flex-wrap gap-2">
        {state === "idle" && (
          <Button type="button" onClick={play}>
            <Play className="size-4" /> Play
          </Button>
        )}
        {state === "playing" && (
          <>
            <Button type="button" variant="secondary" onClick={pause}>
              <Pause className="size-4" /> Pause
            </Button>
            <Button type="button" variant="secondary" onClick={stop}>
              <Square className="size-4" /> Stop
            </Button>
          </>
        )}
        {state === "paused" && (
          <>
            <Button type="button" onClick={resume}>
              <Play className="size-4" /> Resume
            </Button>
            <Button type="button" variant="secondary" onClick={stop}>
              <Square className="size-4" /> Stop
            </Button>
          </>
        )}
      </div>
      <p className="mt-2 text-xs text-muted">Uses your device’s text-to-speech.</p>
    </div>
  );
}
