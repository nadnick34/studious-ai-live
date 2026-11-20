import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ClassLoadError({
  onRetry,
  onBack,
}: {
  onRetry: () => Promise<void> | void;
  onBack: () => void;
}) {
  const [retrying, setRetrying] = useState(false);

  return (
    <div className="card-surface mx-auto max-w-md rounded-xl px-6 py-10 text-center">
      <h2 className="text-base font-semibold text-fg">This class could not be loaded</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
        Something went wrong while opening this class. Try again, or go back.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Button
          type="button"
          disabled={retrying}
          onClick={() => {
            setRetrying(true);
            Promise.resolve(onRetry()).finally(() => setRetrying(false));
          }}
        >
          Try again
        </Button>
        <Button type="button" variant="secondary" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
}
