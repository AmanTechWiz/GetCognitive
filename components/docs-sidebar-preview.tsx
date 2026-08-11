'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, ChevronRight, Sparkles, FileText, Search } from 'lucide-react';
import { cn } from '@/lib/cn';

type SubchapterNode = {
  page: any;
};

type ChapterNode = {
  page: any;
  children: SubchapterNode[];
};

type SectionNode = {
  page: any;
  chapters: ChapterNode[];
};

function buildSidebarTree(docs: any[]): SectionNode[] {
  if (!docs || docs.length === 0) return [];
  const sections = docs.filter((p) => p.slug && p.slug.length === 1);
  return sections.map((sectionPage) => {
    const chaptersForSection = docs.filter(
      (p) => p.slug && p.slug.length === 2 && p.slug[0] === sectionPage.slug[0],
    );

    return {
      page: sectionPage,
      chapters: chaptersForSection.map((chapterPage) => {
        const subchaptersForChapter = docs.filter(
          (p) =>
            p.slug &&
            p.slug.length === 3 &&
            p.slug[0] === chapterPage.slug[0] &&
            p.slug[1] === chapterPage.slug[1],
        );

        return {
          page: chapterPage,
          children: subchaptersForChapter.map((p) => ({ page: p })),
        };
      }),
    };
  });
}

function cleanTitle(title: string) {
  return title.replace(/\s+-\s+Overview$/, '').replace(/^Chapter\s+(\d+)\s*[-:]\s*/, '$1. ');
}

function formatGroupTitle(group: string) {
  return group.replace(':', ' - ');
}

export function DocsSidebarPreview({ docs = [] }: { docs?: any[] }) {
  const pathname = usePathname();
  const [filter, setFilter] = useState('');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'part-i-foundations': true,
    'part-ii-agent-systems': true,
  });
  const [openChapters, setOpenChapters] = useState<Record<string, boolean>>({});

  const sidebarTree = useMemo(() => buildSidebarTree(docs), [docs]);

  const toggleGroup = (slug: string) => {
    setOpenGroups((prev) => ({ ...prev, [slug]: !(prev[slug] ?? true) }));
  };

  const toggleChapter = (slug: string) => {
    setOpenChapters((prev) => ({ ...prev, [slug]: !prev[slug] }));
  };

  const hasTree = sidebarTree.length > 0;

  return (
    <div className="w-[320px] max-w-[320px] overflow-hidden rounded-2xl border border-fd-border/80 bg-fd-card/95 p-4 shadow-2xl backdrop-blur-xl text-left select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-3 mb-3 border-fd-border/60">
        <div className="flex items-center gap-2">
          <BookOpen className="size-4 text-brand shrink-0" />
          <span className="text-xs font-semibold text-fd-foreground">Handbook Navigation</span>
        </div>
        <span className="text-[10px] rounded-full border border-brand/30 bg-brand/10 px-2 py-0.5 text-brand font-medium flex items-center gap-1 shrink-0">
          <Sparkles className="size-3" /> Live Docs
        </span>
      </div>

      {/* Quick Filter Bar */}
      <div className="mb-3 relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-fd-muted-foreground" />
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter chapters..."
          className="w-full rounded-lg border bg-fd-secondary/50 ps-8 pe-3 py-1.5 text-xs text-fd-foreground placeholder:text-fd-muted-foreground focus-visible:outline-none focus:border-brand/40 transition-colors"
        />
      </div>

      {/* Interactive Tree View with Overscroll Contain & Overflow-X Hidden */}
      <div className="space-y-3 text-xs max-h-[340px] overflow-y-auto overflow-x-hidden overscroll-contain pr-1">
        {hasTree ? (
          sidebarTree.map((sectionNode) => {
            const groupSlug = sectionNode.page.slug[0];
            const isGroupOpen = openGroups[groupSlug] ?? true;

            const matchingChapters = sectionNode.chapters.filter((ch) => {
              if (!filter.trim()) return true;
              const f = filter.toLowerCase();
              return (
                ch.page.title.toLowerCase().includes(f) ||
                ch.children.some((c) => c.page.title.toLowerCase().includes(f))
              );
            });

            if (filter.trim() && matchingChapters.length === 0) return null;

            return (
              <div key={groupSlug} className="rounded-lg overflow-hidden">
                {/* Section Header Button */}
                <button
                  type="button"
                  onClick={() => toggleGroup(groupSlug)}
                  className="flex min-h-7 w-full items-center gap-2 rounded-lg px-2 py-1 text-start text-[11px] font-bold uppercase tracking-wider text-fd-foreground hover:bg-fd-accent/70 transition-colors cursor-pointer overflow-hidden"
                >
                  <span className="size-1.5 rounded-full bg-brand shrink-0" />
                  <span className="min-w-0 flex-1 truncate text-ellipsis whitespace-nowrap">
                    {formatGroupTitle(sectionNode.page.title)}
                  </span>
                  <span className="rounded bg-fd-secondary px-1.5 py-0.5 text-[9px] font-semibold text-fd-muted-foreground normal-case shrink-0">
                    {sectionNode.chapters.length}
                  </span>
                  <ChevronRight
                    className={cn(
                      'size-3.5 text-fd-muted-foreground transition-transform duration-200 shrink-0',
                      isGroupOpen && 'rotate-90',
                    )}
                  />
                </button>

                {/* Chapters list */}
                {isGroupOpen && (
                  <div className="ms-2.5 mt-1 space-y-1 border-s border-fd-border/70 ps-2 overflow-hidden">
                    {matchingChapters.map((chapter) => {
                      const chapterSlugStr = chapter.page.slug.join('/');
                      const href = `/docs/${chapterSlugStr}`;
                      const hasChildren = chapter.children.length > 0;
                      const isChapterOpen = openChapters[chapterSlugStr] ?? false;
                      const isActive = pathname === href;

                      return (
                        <div key={chapterSlugStr} className="overflow-hidden">
                          <div className="flex items-center gap-1 min-w-0">
                            {hasChildren && (
                              <button
                                type="button"
                                onClick={() => toggleChapter(chapterSlugStr)}
                                className="inline-flex size-5 shrink-0 items-center justify-center rounded text-fd-muted-foreground hover:bg-fd-accent cursor-pointer"
                              >
                                <ChevronRight
                                  className={cn(
                                    'size-3 transition-transform duration-200 shrink-0',
                                    isChapterOpen && 'rotate-90',
                                  )}
                                />
                              </button>
                            )}
                            <Link
                              href={href}
                              className={cn(
                                'flex-1 min-w-0 rounded-md px-2 py-1 text-[11px] transition-colors flex items-center justify-between group overflow-hidden',
                                isActive
                                  ? 'bg-brand/10 text-brand font-medium border border-brand/20'
                                  : 'text-fd-muted-foreground hover:bg-fd-accent/60 hover:text-fd-foreground',
                              )}
                            >
                              <span className="min-w-0 flex-1 truncate text-ellipsis whitespace-nowrap">
                                {cleanTitle(chapter.page.title)}
                              </span>
                              <FileText className="size-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ms-1 text-fd-muted-foreground" />
                            </Link>
                          </div>

                          {/* Subchapters */}
                          {hasChildren && isChapterOpen && (
                            <div className="ms-3 mt-1 space-y-1 border-s border-dashed border-fd-border/60 ps-2 overflow-hidden">
                              {chapter.children.map((sub) => {
                                const subHref = `/docs/${sub.page.slug.join('/')}`;
                                const isSubActive = pathname === subHref;
                                return (
                                  <Link
                                    key={sub.page.slug.join('/')}
                                    href={subHref}
                                    className={cn(
                                      'block rounded px-2 py-0.5 text-[10.5px] transition-colors truncate text-ellipsis whitespace-nowrap overflow-hidden',
                                      isSubActive
                                        ? 'text-brand font-semibold'
                                        : 'text-fd-muted-foreground hover:text-fd-foreground hover:bg-fd-accent/40',
                                    )}
                                  >
                                    {cleanTitle(sub.page.title)}
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="py-6 text-center text-xs text-fd-muted-foreground">
            Loading handbook structure...
          </div>
        )}
      </div>
    </div>
  );
}
