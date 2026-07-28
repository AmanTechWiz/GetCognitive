'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { docGroups, docPages } from '@/content/docs/pages';

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <aside id="nd-sidebar" className="hidden w-[280px] shrink-0 border-r bg-fd-background lg:block">
      <div className="fd-scroll-container sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto px-4 py-6">
        <Link href="/docs" className="block rounded-lg px-2 py-1.5 text-sm font-medium">
          Framework
        </Link>
        <p className="px-2 pb-4 text-xs text-fd-muted-foreground">The docs framework</p>
        <nav className="space-y-6">
          {docGroups.map((group) => {
            const pages = docPages.filter((page) => page.group === group);
            if (pages.length === 0) {
              return (
                <div key={group}>
                  <p className="px-2 text-xs font-medium text-fd-muted-foreground">{group}</p>
                </div>
              );
            }

            return (
              <div key={group}>
                <p className="px-2 text-xs font-medium text-fd-muted-foreground">{group}</p>
                <div className="mt-2 space-y-0.5">
                  {pages.map((page) => {
                    const href = `/docs/${page.slug.join('/')}`;
                    const active =
                      pathname === href || (pathname === '/docs' && href.endsWith('/getting-started'));

                    return (
                      <Link
                        key={href}
                        href={href}
                        className={cn(
                          'block rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground',
                          active
                            ? 'bg-fd-accent text-fd-accent-foreground'
                            : 'text-fd-muted-foreground',
                        )}
                      >
                        {page.title}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
