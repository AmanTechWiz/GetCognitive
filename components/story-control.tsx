'use client';

export function StoryControl() {
  return (
    <div className="rounded-xl border bg-fd-secondary p-4">
      <div className="flex items-center gap-2 border-b pb-3">
        <div className="size-3 rounded-full bg-red-400" />
        <div className="size-3 rounded-full bg-yellow-400" />
        <div className="size-3 rounded-full bg-green-400" />
        <span className="ms-auto text-xs text-fd-muted-foreground">Preview</span>
      </div>
      <div className="mt-4 grid gap-3">
        <button className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground">
          Primary Button
        </button>
        <div className="grid grid-cols-3 gap-2">
          <div className="h-12 rounded-lg border bg-fd-card" />
          <div className="h-12 rounded-lg border bg-fd-card" />
          <div className="h-12 rounded-lg border bg-fd-card" />
        </div>
      </div>
    </div>
  );
}
