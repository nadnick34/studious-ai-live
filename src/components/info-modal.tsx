import type { ReactNode } from "react";

export function InfoButton({
  onClick,
  label = "Info",
  className = "",
}: {
  onClick: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`grid size-9 place-items-center rounded-full border border-border bg-card text-sm font-semibold text-teal hover:bg-teal/10 ${className}`}
      aria-label={label}
      title={label}
    >
      i
    </button>
  );
}

export function InfoModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={onClose} />
      <div className="relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="font-serif text-lg font-semibold text-fg">{title}</h2>
          <button type="button" onClick={onClose} className="text-sm text-muted hover:text-fg">
            Close
          </button>
        </div>
        <div className="space-y-3 text-sm leading-relaxed text-fg/90">{children}</div>
      </div>
    </div>
  );
}
