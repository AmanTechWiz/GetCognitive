'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Check, ChevronRight, ChevronsUpDown, FileText, SidebarIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { docGroups, docPages } from '@/content/docs/pages';
import { FumadocsIcon } from '@/components/fumadocs-icon';
import { GithubMark, ThemeToggle } from '@/components/site-header';
import { CognitiveSearchTrigger } from '@/components/cognitive-search';

const sections = [
  {
    title: 'Handbook',
    description: 'AI systems course',
    href: '/docs',
    color: 'var(--brand)',
  },
  {
    title: 'Chapters',
    description: 'Long-form tutorials',
    href: '/docs/foundations/from-prompt-to-production',
    color: 'var(--accent)',
  },
  {
    title: 'Appendices',
    description: 'References and checklists',
    href: '/docs/appendix/core-concepts',
    color: 'var(--fd-primary)',
  },
];

export function DocsSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [openChapters, setOpenChapters] = useState<Record<string, boolean>>({});
  const selected = useMemo(
    () =>
      sections.find((section) => pathname === section.href || pathname.startsWith(section.href)) ??
      sections[0],
    [pathname],
  );
  const groupedPages = useMemo(
    () =>
      docGroups.map((group) => ({
        group,
        chapters: buildChapterTree(docPages.filter((page) => page.group === group)),
      })),
    [],
  );

  useEffect(() => {
    const activeGroup = groupedPages.find(({ chapters }) =>
      chapters.some((chapter) => isActiveNode(pathname, chapter)),
    )?.group;

    if (!activeGroup) return;
    setOpenGroups((current) => ({ ...current, [activeGroup]: true }));

    const activeChapter = groupedPages
      .flatMap(({ chapters }) => chapters)
      .find((chapter) => isActiveNode(pathname, chapter));
    if (activeChapter) {
      setOpenChapters((current) => ({ ...current, [activeChapter.page.slug.join('/')]: true }));
    }
  }, [groupedPages, pathname]);

  return (
    <aside
      id="nd-sidebar"
      className="hidden w-[300px] shrink-0 border-e bg-fd-card text-sm lg:block"
    >
      <div className="fd-scroll-container sticky top-0 flex h-dvh flex-col overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-3 pb-3">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 text-[0.9375rem] font-medium me-auto"
            >
              <FumadocsIcon className="size-5" />
              <span>AI Systems</span>
            </Link>
            <button className="inline-flex size-8 items-center justify-center rounded-md text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground">
              <SidebarIcon className="size-4" />
            </button>
          </div>
          <CognitiveSearchTrigger />
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
        <nav className="flex-1 space-y-1 pt-1.5">
          {groupedPages.map(({ group, chapters }) => {
            const activeGroup = chapters.some((chapter) => isActiveNode(pathname, chapter));
            const expanded = openGroups[group] ?? activeGroup ?? group === 'Start Here';

            if (chapters.length === 0) {
              return (
                <div key={group}>
                  <p className="px-2 text-xs font-medium text-fd-muted-foreground">{group}</p>
                </div>
              );
            }

            return (
              <div key={group} className="rounded-lg">
                <button
                  type="button"
                  onClick={() =>
                    setOpenGroups((current) => ({
                      ...current,
                      [group]: !(current[group] ?? activeGroup ?? group === 'Start Here'),
                    }))
                  }
                  className={cn(
                    'flex min-h-8 w-full items-center gap-2 rounded-lg border border-transparent px-2 py-1 text-start text-[0.75rem] font-bold uppercase tracking-wide transition-colors hover:border-fd-border hover:bg-fd-accent/70 hover:text-fd-accent-foreground',
                    activeGroup ? 'border-fd-border bg-fd-accent text-fd-accent-foreground shadow-sm' : 'text-fd-foreground',
                  )}
                >
                  <BookOpen className="size-3.5 shrink-0 text-fd-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{formatGroupTitle(group)}</span>
                  <span className="rounded bg-fd-secondary px-1 py-0 text-[10px] font-medium normal-case tracking-normal text-fd-muted-foreground">
                    {chapters.length}
                  </span>
                  <ChevronRight
                    className={cn('size-3.5 shrink-0 text-fd-muted-foreground transition-transform', expanded && 'rotate-90')}
                  />
                </button>
                {expanded ? (
                  <div className="ms-3 mt-1 space-y-0.5 border-s border-white/30 ps-1.5">
                    {chapters.map((chapter) => (
                      <ChapterNavItem
                        key={chapter.page.slug.join('/')}
                        chapter={chapter}
                        pathname={pathname}
                        expanded={openChapters[chapter.page.slug.join('/')] ?? isActiveNode(pathname, chapter)}
                        onToggle={() =>
                          setOpenChapters((current) => ({
                            ...current,
                            [chapter.page.slug.join('/')]: !(current[chapter.page.slug.join('/')] ?? isActiveNode(pathname, chapter)),
                          }))
                        }
                      />
                    ))}
                  </div>
                ) : null}
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

type ChapterNode = {
  page: (typeof docPages)[number];
  children: (typeof docPages)[number][];
};

function ChapterNavItem({
  chapter,
  pathname,
  expanded,
  onToggle,
}: {
  chapter: ChapterNode;
  pathname: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const href = `/docs/${chapter.page.slug.join('/')}`;
  const active = isActivePage(pathname, chapter.page.slug);
  const activeChild = chapter.children.some((child) => isActivePage(pathname, child.slug));
  const hasChildren = chapter.children.length > 0;

  if (!hasChildren) {
    return (
      <Link href={href} className={navLinkClass(active)}>
        <FileText className="size-3.5 shrink-0" />
        <span className="min-w-0 truncate">{cleanTitle(chapter.page.title)}</span>
      </Link>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onToggle}
          aria-label={expanded ? 'Collapse chapter' : 'Expand chapter'}
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-accent-foreground"
        >
          <ChevronRight className={cn('size-3.5 transition-transform', expanded && 'rotate-90')} />
        </button>
        <Link
          href={href}
          className={cn(
            'min-w-0 flex-1 rounded-md border border-transparent px-2 py-1.5 text-[0.8125rem] font-semibold leading-5 transition-colors hover:border-fd-border hover:bg-fd-accent/60 hover:text-fd-accent-foreground',
            active || activeChild ? 'text-fd-foreground' : 'text-fd-muted-foreground',
            active && 'border-fd-primary/20 bg-fd-primary/10 text-fd-primary',
          )}
        >
          <span className="block truncate">{cleanTitle(chapter.page.title)}</span>
        </Link>
      </div>
      {expanded ? (
        <div className="ms-3 mt-0.5 space-y-px border-s border-dashed border-white/35 ps-4">
          {chapter.children.map((child) => (
            <Link key={child.slug.join('/')} href={`/docs/${child.slug.join('/')}`} className={navLinkClass(isActivePage(pathname, child.slug), true)}>
              {cleanTitle(child.title)}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function isActivePage(pathname: string, slug: string[]) {
  const href = `/docs/${slug.join('/')}`;
  return pathname === href || (pathname === '/docs' && slug.join('/') === 'overview');
}

function isActiveNode(pathname: string, node: ChapterNode) {
  return isActivePage(pathname, node.page.slug) || node.children.some((child) => isActivePage(pathname, child.slug));
}

function buildChapterTree(pages: typeof docPages): ChapterNode[] {
  const chapters = pages.filter((page) => !page.parentSlug);
  return chapters.map((page) => ({
    page,
    children: pages.filter((candidate) => candidate.parentSlug?.join('/') === page.slug.join('/')),
  }));
}

function navLinkClass(active: boolean, child = false) {
  return cn(
    'relative flex items-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-[0.8125rem] font-semibold leading-5 transition-colors hover:border-fd-border hover:bg-fd-accent/60 hover:text-fd-accent-foreground',
    child && 'py-0.5 text-[0.75rem] font-normal leading-5 hover:bg-fd-accent/40',
    active
      ? 'bg-fd-primary/10 text-fd-primary before:absolute before:inset-y-2 before:left-2 before:w-px before:bg-fd-primary ps-5'
      : 'text-fd-muted-foreground',
  );
}

function formatGroupTitle(group: string) {
  return group.replace(':', ' - ');
}

function cleanTitle(title: string) {
  return title.replace(/\s+-\s+Overview$/, '').replace(/^Chapter\s+(\d+)\s*[-:]\s*/, '$1. ');
}
