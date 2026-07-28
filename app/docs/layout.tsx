import type { ReactNode } from 'react';
import { DocsSidebar } from '@/components/docs/sidebar';

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-6 md:px-12 py-6 md:py-10">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[280px_1fr]">
        <DocsSidebar />
        <div className="rounded-2xl border bg-fd-card shadow-lg p-6 md:p-10">{children}</div>
      </div>
    </div>
  );
}

