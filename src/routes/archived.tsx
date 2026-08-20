import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { listClasses, updateClass } from "@/lib/data";
import type { ClassRecord } from "@/lib/types";

export const Route = createFileRoute("/archived")({ component: ArchivedPage });

function ArchivedPage() {
  const [classes, setClasses] = useState<ClassRecord[]>([]);

  async function refresh() {
    setClasses(await listClasses({ data: true }));
  }

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <AppShell title="Archived classes">
      {classes.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted">
          No archived classes. Archive a class from My Classes when you’re done with it.
        </div>
      ) : (
        <div className="mx-auto max-w-2xl space-y-3">
          {classes.map((c) => (
            <div key={c.id} className="card-surface flex flex-col justify-between gap-3 rounded-xl p-4 sm:flex-row sm:items-center">
              <div>
                <div className="text-xs font-semibold text-muted">{c.code}</div>
                <div className="font-medium text-fg">{c.name}</div>
                <div className="text-xs text-muted">{c.subject}</div>
              </div>
              <div className="flex gap-2">
                <Link to="/class/$id" params={{ id: c.id }}>
                  <Button variant="secondary" className="text-xs">Open</Button>
                </Link>
                <Button
                  className="text-xs"
                  onClick={async () => {
                    await updateClass({ data: { id: c.id, patch: { archived: false } } });
                    await refresh();
                  }}
                >
                  Restore
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
