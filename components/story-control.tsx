'use client';

export function StoryControl() {
  return (
    <div className="rounded-xl border bg-fd-secondary p-4">
      <div className="flex items-center gap-2 border-b pb-3">
        <div className="size-3 rounded-full bg-red-400" />
        <div className="size-3 rounded-full bg-yellow-400" />
        <div className="size-3 rounded-full bg-green-400" />
        <span className="ms-auto text-xs text-fd-muted-foreground">Concept Preview</span>
      </div>
      <div className="mt-4 grid gap-3">
        <div className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground">
          Agentic Retrieval
        </div>
        <div className="grid gap-2 text-xs text-fd-muted-foreground">
          <div className="rounded-lg border bg-fd-card p-2">Visual explainer</div>
          <div className="rounded-lg border bg-fd-card p-2">Architecture diagram</div>
          <div className="rounded-lg border bg-fd-card p-2">Curated resources</div>
        </div>
      </div>
    </div>
  );
}
