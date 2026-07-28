'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { docPages } from '@/content/docs/pages';

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full md:w-[280px] shrink-0">
      <div className="sticky top-0 md:top-6">
        <div className="rounded-2xl border bg-fd-card shadow-lg p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium tracking-tight">Docs</p>
            <Link href="/" className="text-xs text-fd-muted-foreground hover:underline">
              Back
            </Link>
          </div>
          <nav className="mt-4 flex flex-col gap-1">
            {docPages.map((p) => {
              const href = `/docs/${p.slug.join('/')}`;
              const active = pathname === href || (pathname === '/docs' && href.endsWith('/getting-started'));
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'px-3 py-2 rounded-xl text-sm border border-transparent hover:bg-fd-secondary',
                    active && 'bg-fd-secondary border-fd-border',
                  )}
                >
                  <div className="font-medium">{p.title}</div>
                  {p.description ? (
                    <div className="text-xs text-fd-muted-foreground mt-0.5">{p.description}</div>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}

