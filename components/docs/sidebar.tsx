'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Check, ChevronDown, ChevronsUpDown, Search, SidebarIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { docGroups, docPages } from '@/content/docs/pages';
import { FumadocsIcon } from '@/components/fumadocs-icon';
import { GithubMark, ThemeToggle } from '@/components/site-header';

const sections = [
  {
    title: 'Framework',
    description: 'The docs framework',
    href: '/docs',
    color: 'var(--framework-color)',
  },
  {
    title: 'UI',
    description: 'Layouts and components',
    href: '/docs/customize',
    color: 'var(--ui-color)',
  },
  {
    title: 'Headless',
    description: 'Build your own docs UI',
    href: '/docs/manual-installation',
    color: 'var(--headless-color)',
  },
];

export function DocsSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const selected = useMemo(
    () => sections.find((section) => pathname === section.href) ?? sections[0],
    [pathname],
  );

  return (
    <aside
      id="nd-sidebar"
      className="hidden w-[268px] shrink-0 border-e bg-fd-card text-sm lg:block"
    >
      <div className="fd-scroll-container sticky top-0 flex h-dvh flex-col overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-3 pb-3">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 text-[0.9375rem] font-medium me-auto"
            >
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
          <div className="relative">
            <button
              onClick={() => setOpen((value) => !value)}
              className="flex w-full items-center gap-2 rounded-lg border bg-fd-secondary/50 p-2 text-start text-fd-secondary-foreground transition-colors hover:bg-fd-accent"
            >
              <span
                className="size-5 rounded-md"
                style={{ backgroundColor: selected.color }}
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium leading-none">{selected.title}</span>
                <span className="mt-1 block truncate text-[0.8125rem] text-fd-muted-foreground">
                  {selected.description}
                </span>
              </span>
              <ChevronsUpDown className="ms-auto size-4 shrink-0 text-fd-muted-foreground" />
            </button>
            {open ? (
              <div className="absolute left-0 right-0 top-[calc(100%+0.25rem)] z-40 rounded-xl border bg-fd-popover p-1 text-fd-popover-foreground shadow-lg">
                {sections.map((section) => {
                  const active = section.title === selected.title;

                  return (
                    <Link
                      key={section.title}
                      href={section.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
                    >
                      <span
                        className="size-5 rounded-md"
                        style={{ backgroundColor: section.color }}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium leading-none">
                          {section.title}
                        </span>
                        <span className="mt-1 block truncate text-[0.8125rem] text-fd-muted-foreground">
                          {section.description}
                        </span>
                      </span>
                      <Check
                        className={cn(
                          'ms-auto size-3.5 shrink-0 text-fd-primary',
                          !active && 'invisible',
                        )}
                      />
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
        <nav className="flex-1 space-y-6 pt-2">
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
                          'relative block rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-fd-accent/50 hover:text-fd-accent-foreground',
                          active
                            ? 'bg-fd-primary/10 text-fd-primary before:absolute before:inset-y-2 before:left-2 before:w-px before:bg-fd-primary ps-5'
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
        <div className="sticky bottom-0 mt-8 bg-fd-card pt-4">
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
