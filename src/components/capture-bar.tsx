import { useRef, useState } from "react";
import { Camera, FilePlus2, ScanLine, X } from "lucide-react";
import { CameraModal } from "@/components/camera-modal";
import { compressImageFile } from "@/lib/utils";
import type { FilePayload } from "@/lib/types";
import { dataUrlToPayload, fileToPayload } from "@/lib/utils";

export type CapturedFile = {
  id: string;
  file: File;
  preview?: string;
  mode: "file" | "photo" | "scan";
};

async function toPayload(item: CapturedFile): Promise<FilePayload> {
  if (item.file.type.startsWith("image/")) {
    const dataUrl = await compressImageFile(item.file);
    return dataUrlToPayload(dataUrl, item.file.name);
  }
  return fileToPayload(item.file);
}

export async function capturedToPayloads(items: CapturedFile[]) {
  return Promise.all(items.map(toPayload));
}

export function CaptureBar({
  items,
  onChange,
  disabled,
}: {
  items: CapturedFile[];
  onChange: (items: CapturedFile[]) => void;
  disabled?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const scanRef = useRef<HTMLInputElement>(null);
  const [cameraMode, setCameraMode] = useState<"photo" | "scan" | null>(null);

  function addFiles(list: FileList | File[] | null, mode: CapturedFile["mode"]) {
    if (!list) return;
    const next = Array.from(list).map((file) => ({
      id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 6)}`,
      file,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      mode,
    }));
    onChange([...items, ...next]);
  }

  function remove(id: string) {
    const found = items.find((i) => i.id === id);
    if (found?.preview) URL.revokeObjectURL(found.preview);
    onChange(items.filter((i) => i.id !== id));
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => fileRef.current?.click()}
          className="flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-bg px-2 py-3 text-center text-xs font-medium text-fg hover:border-teal disabled:opacity-50"
        >
          <FilePlus2 className="size-5 text-teal" />
          Files
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (navigator.mediaDevices) setCameraMode("photo");
            else photoRef.current?.click();
          }}
          className="flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-bg px-2 py-3 text-center text-xs font-medium text-fg hover:border-teal disabled:opacity-50"
        >
          <Camera className="size-5 text-teal" />
          Photo
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (navigator.mediaDevices) setCameraMode("scan");
            else scanRef.current?.click();
          }}
          className="flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-bg px-2 py-3 text-center text-xs font-medium text-fg hover:border-teal disabled:opacity-50"
        >
          <ScanLine className="size-5 text-teal" />
          Scan
        </button>
      </div>
      <p className="text-[11px] leading-relaxed text-muted">
        Files, a live photo, or a page scan. Scans are read for text when you generate.
      </p>

      <input
        ref={fileRef}
        type="file"
        multiple
        className="sr-only"
        accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.webp,.gif,.mp3,.m4a,.wav"
        onChange={(e) => {
          addFiles(e.target.files, "file");
          e.currentTarget.value = "";
        }}
      />
      <input
        ref={photoRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          addFiles(e.target.files, "photo");
          e.currentTarget.value = "";
        }}
      />
      <input
        ref={scanRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          addFiles(e.target.files, "scan");
          e.currentTarget.value = "";
        }}
      />

      {items.length > 0 && (
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
            >
              {item.preview ? (
                <img src={item.preview} alt="" className="size-10 rounded-md object-cover" />
              ) : (
                <span className="grid size-10 place-items-center rounded-md bg-bg text-[10px] font-semibold uppercase text-muted">
                  {item.file.name.split(".").pop()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{item.file.name}</div>
                <div className="text-[11px] capitalize text-muted">
                  {item.mode === "scan" ? "Scan" : item.mode === "photo" ? "Photo" : "File"} ·{" "}
                  {Math.max(1, Math.round(item.file.size / 1024))} KB
                </div>
              </div>
              {!disabled && (
                <button type="button" onClick={() => remove(item.id)} className="grid size-11 place-items-center text-muted hover:text-red" aria-label="Remove">
                  <X className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {cameraMode && (
        <CameraModal
          title={cameraMode === "scan" ? "Scan a page" : "Take a photo"}
          onClose={() => setCameraMode(null)}
          onCapture={(file) => addFiles([file], cameraMode)}
        />
      )}
    </div>
  );
}
