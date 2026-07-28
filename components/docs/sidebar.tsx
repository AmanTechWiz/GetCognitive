'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, SidebarIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { docGroups, docPages } from '@/content/docs/pages';
import { FumadocsIcon } from '@/components/fumadocs-icon';
import { GithubMark, ThemeToggle } from '@/components/site-header';

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <aside
      id="nd-sidebar"
      className="hidden w-[268px] shrink-0 border-e bg-fd-card text-sm lg:block"
    >
      <div className="fd-scroll-container sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto px-4 py-6">
        <div className="flex flex-col gap-3 pb-4">
          <div className="flex items-center gap-2">
            <Link href="/" className="inline-flex items-center gap-2.5 text-[0.9375rem] font-medium me-auto">
              <FumadocsIcon className="size-5" />
              <span>Fumadocs</span>
            </Link>
            <button className="inline-flex size-8 items-center justify-center rounded-md text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground">
              <SidebarIcon className="size-4" />
            </button>
          </div>
          <button className="flex h-10 w-full items-center gap-2 rounded-lg border bg-fd-secondary/50 px-3 text-sm text-fd-muted-foreground">
            <Search className="size-4" />
            <span>Search</span>
            <kbd className="ms-auto rounded-md border bg-fd-background px-1.5 py-0.5 text-[11px]">
              Ctrl K
            </kbd>
          </button>
          <div>
            <Link href="/docs" className="block rounded-lg px-2 py-1.5 text-sm font-medium">
              Framework
            </Link>
            <p className="px-2 text-xs text-fd-muted-foreground">The docs framework</p>
          </div>
        </div>
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
        <div className="sticky bottom-0 mt-8 bg-fd-background pt-4">
          <div className="flex items-center rounded-lg border bg-fd-secondary/50 p-0.5 pe-0 text-fd-muted-foreground">
            <a
              href="https://github.com/fuma-nama/fumadocs"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Github"
              className="inline-flex size-8 items-center justify-center rounded-md transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
            >
              <GithubMark className="size-4" />
            </a>
            <ThemeToggle className="ms-auto h-8 rounded-none border-y-0 border-e-0 bg-transparent px-1" />
          </div>
        </div>
      </div>
    </aside>
  );
}
