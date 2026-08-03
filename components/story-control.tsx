'use client';

import { Search, Sparkles, Clock3, Layers3 } from 'lucide-react';

export function StoryControl() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-fd-card shadow-sm">
      {/* Window */}
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <div className="size-2.5 rounded-full bg-red-400" />
        <div className="size-2.5 rounded-full bg-yellow-400" />
        <div className="size-2.5 rounded-full bg-green-400" />

        <div className="ml-4 flex h-8 flex-1 items-center rounded-lg border bg-fd-secondary px-3 text-xs text-fd-muted-foreground">
          <Search className="mr-2 h-3.5 w-3.5" />
          Search concepts...
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="space-y-2">
          <div className="inline-flex items-center rounded-full border bg-brand/10 px-2.5 py-1 text-[11px] font-medium text-brand">
            Featured Concept
          </div>

          <h3 className="text-lg font-semibold">
            Agentic Retrieval
          </h3>

          <p className="text-sm text-fd-muted-foreground">
            Learn how AI agents search, reason, and retrieve
            information across multiple knowledge sources.
          </p>
        </div>

        <div className="flex gap-2 text-xs">
          <div className="flex items-center gap-1 rounded-md border px-2 py-1">
            <Clock3 className="h-3.5 w-3.5" />
            5 min
          </div>

          <div className="flex items-center gap-1 rounded-md border px-2 py-1">
            <Layers3 className="h-3.5 w-3.5" />
            Intermediate
          </div>

          <div className="flex items-center gap-1 rounded-md border px-2 py-1">
            <Sparkles className="h-3.5 w-3.5" />
            Updated
          </div>
        </div>

        <div className="space-y-2">
          {[
            'Overview',
            'Architecture Diagram',
            'Visual Walkthrough',
            'Related Concepts',
          ].map((item) => (
            <div
              key={item}
              className="flex items-center justify-between rounded-lg border bg-fd-secondary/50 px-3 py-2 text-sm"
            >
              <span>{item}</span>

              <div className="h-2 w-16 rounded-full bg-fd-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}