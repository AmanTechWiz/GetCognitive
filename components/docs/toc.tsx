'use client';

import { ChevronDown, Text } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/cn';

export type TOCItem = { title: string; depth: number };

export function DocsMobileToc({ items }: { items: TOCItem[] }) {
  const links = useMemo(
    () => items.map((item) => ({ title: item.title, id: slugify(item.title), depth: item.depth })),
    [items],
  );
  const [activeId, setActiveId] = useState(links[0]?.id ?? '');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (links.length === 0) return;

    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.set(entry.target.id, entry.boundingClientRect.top);
          else visible.delete(entry.target.id);
        }

        const next = [...visible.entries()].sort((a, b) => a[1] - b[1])[0]?.[0];
        if (next) setActiveId(next);
      },
      {
        rootMargin: '-88px 0px -70% 0px',
        threshold: [0, 1],
      },
    );

    for (const link of links) {
      const element = document.getElementById(link.id);
      if (element) observer.observe(element);
    }

    return () => observer.disconnect();
  }, [links]);

  const activeTitle = links.find((link) => link.id === activeId)?.title ?? links[0]?.title;

  return (
    <div className="sticky top-0 z-20 border-b bg-fd-background/80 backdrop-blur-sm xl:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 w-full items-center gap-2.5 px-4 py-2.5 text-start text-sm text-fd-muted-foreground md:px-6"
      >
        <ProgressCircle className="shrink-0" value={getProgress(links, activeId)} />
        <span className="flex-1 truncate">{activeTitle ?? 'On this page'}</span>
        <ChevronDown className={cn('size-4 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      {open ? (
        <nav className="fd-scroll-container max-h-[55vh] overflow-y-auto border-t px-4 py-3 md:px-6">
          <TocLinks links={links} activeId={activeId} onClick={() => setOpen(false)} />
        </nav>
      ) : null}
    </div>
  );
}

export function DocsDesktopToc({ items }: { items: TOCItem[] }) {
  const links = useMemo(
    () => items.map((item) => ({ title: item.title, id: slugify(item.title), depth: item.depth })),
    [items],
  );
  const [activeId, setActiveId] = useState(links[0]?.id ?? '');

  useEffect(() => {
    if (links.length === 0) return;

    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.set(entry.target.id, entry.boundingClientRect.top);
          else visible.delete(entry.target.id);
        }

        const next = [...visible.entries()].sort((a, b) => a[1] - b[1])[0]?.[0];
        if (next) setActiveId(next);
      },
      {
        rootMargin: '-88px 0px -70% 0px',
        threshold: [0, 1],
      },
    );

    for (const link of links) {
      const element = document.getElementById(link.id);
      if (element) observer.observe(element);
    }

    return () => observer.disconnect();
  }, [links]);

  return (
    <aside
      id="nd-toc"
      className="sticky top-0 hidden h-dvh w-[268px] flex-col border-s pe-4 ps-6 pt-12 pb-2 xl:flex"
    >
      <h3 className="inline-flex items-center gap-1.5 text-sm text-fd-muted-foreground">
        <Text className="size-4" />
        On this page
      </h3>
      <nav className="fd-scroll-container mt-3 ms-px flex flex-col overflow-y-auto">
        <TocLinks links={links} activeId={activeId} />
      </nav>
    </aside>
  );
}

function TocLinks({
  links,
  activeId,
  onClick,
}: {
  links: { title: string; id: string; depth: number }[];
  activeId: string;
  onClick?: () => void;
}) {
  if (links.length === 0) {
    return <p className="py-1 ps-3 text-sm text-fd-muted-foreground">No headings</p>;
  }

  return (
    <div className="relative flex flex-col border-s border-fd-border/70 py-1">
      {links.map((link) => (
        <a
          key={link.id}
          href={`#${link.id}`}
          onClick={onClick}
          className={cn(
            'relative py-1.5 text-sm transition-colors hover:text-fd-foreground block',
            link.depth === 3 ? 'ps-6 text-[0.8125rem]' : 'ps-4 text-[0.875rem]',
            activeId === link.id
              ? 'text-brand font-medium before:absolute before:left-[-1px] before:top-0 before:bottom-0 before:w-px before:bg-brand'
              : 'text-fd-muted-foreground',
          )}
        >
          {link.title}
        </a>
      ))}
    </div>
  );
}

function ProgressCircle({ className, value }: { className?: string; value: number }) {
  const offset = 45.55 - 45.55 * value;

  return (
    <svg viewBox="0 0 18 18" className={cn('size-[18px] text-fd-primary', className)}>
      <circle cx="9" cy="9" r="7.25" fill="none" strokeWidth="1.5" className="stroke-current/25" />
      <circle
        cx="9"
        cy="9"
        r="7.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="45.55"
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 9 9)"
      />
    </svg>
  );
}

function getProgress(links: { id: string }[], activeId: string) {
  const index = links.findIndex((link) => link.id === activeId);
  return (index + 1) / Math.max(1, links.length);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}
