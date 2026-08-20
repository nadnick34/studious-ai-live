import { useEffect, useRef, useState } from "react";
import { Camera, SwitchCamera, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CameraModal({
  title,
  onClose,
  onCapture,
}: {
  title: string;
  onClose: () => void;
  onCapture: (file: File) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facing, setFacing] = useState<"environment" | "user">("environment");

  useEffect(() => {
    let cancelled = false;
    async function start() {
      setError(null);
      try {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facing }, width: { ideal: 1600 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        setError("Camera isn’t available here. Use Take photo instead — it opens your phone’s camera.");
      }
    }
    void start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [facing]);

  function snap() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `scan-${Date.now()}.jpg`, { type: "image/jpeg" });
        onCapture(file);
        onClose();
      },
      "image/jpeg",
      0.86,
    );
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <p className="text-sm font-medium">{title}</p>
        <button type="button" onClick={onClose} className="grid size-11 place-items-center rounded-full hover:bg-white/10" aria-label="Close camera">
          <X className="size-5" />
        </button>
      </div>
      <div className="relative flex-1">
        <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
        {error && (
          <div className="absolute inset-x-4 top-4 rounded-xl bg-black/70 px-4 py-3 text-sm text-white">{error}</div>
        )}
      </div>
      <div className="flex items-center justify-center gap-8 px-6 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))}
          className="grid size-12 place-items-center rounded-full bg-white/15 text-white"
          aria-label="Flip camera"
        >
          <SwitchCamera className="size-5" />
        </button>
        <button
          type="button"
          onClick={snap}
          disabled={Boolean(error)}
          className="grid size-16 place-items-center rounded-full bg-white text-slate-dark shadow-lg disabled:opacity-40"
          aria-label="Capture"
        >
          <Camera className="size-7" />
        </button>
        <Button variant="ghost" className="text-white" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
