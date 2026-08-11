'use client';

import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

export function Marquee({
  children,
  className,
  durationMs = 18000,
}: {
  children: ReactNode;
  className?: string;
  durationMs?: number;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]',
        className,
      )}
    >
      <div
        className="flex w-max gap-4 animate-[marquee_var(--duration)_linear_infinite]"
        style={{ ['--duration' as never]: `${durationMs}ms` }}
      >
        {children}
        {children}
      </div>
    </div>
  );
}
