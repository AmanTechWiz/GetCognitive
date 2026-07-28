'use client';

import { cn } from '@/lib/cn';

export function CodeInline({ code, className }: { code: string; className?: string }) {
  return (
    <code
      className={cn(
        'px-2 py-1 rounded-lg border bg-fd-secondary text-fd-secondary-foreground font-mono text-xs',
        className,
      )}
    >
      {code}
    </code>
  );
}

