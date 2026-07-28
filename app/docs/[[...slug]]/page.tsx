import Link from 'next/link';
import { marked } from 'marked';
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  MessageCircle,
  MoreHorizontal,
  Text,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';
import { docPages, getDocBySlug, type DocPage } from '@/content/docs/pages';
import { cn } from '@/lib/cn';

export default async function DocsPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug = [] } = await params;
  const page = getDocBySlug(slug);

  if (!page) {
    return (
      <main className="min-w-0 px-6 py-10 md:px-10 xl:px-8">
        <div className="mx-auto max-w-[760px]">
          <h1 className="text-2xl font-medium tracking-tight">Not found</h1>
          <p className="mt-2 text-sm text-fd-muted-foreground">This doc page does not exist.</p>
          <Link
            href="/docs/getting-started"
            className="mt-6 inline-flex justify-center rounded-lg bg-fd-primary px-4 py-2 text-sm font-medium text-fd-primary-foreground"
          >
            Go to Getting Started
          </Link>
        </div>
      </main>
    );
  }

  const toc = page.toc ?? [];
  const html = await renderMarkdown(page.body);
  const { previous, next } = getSiblingPages(page);

  return (
    <>
      <div className="sticky top-0 z-20 border-b bg-fd-background/80 backdrop-blur-sm xl:hidden">
        <button className="flex h-10 w-full items-center gap-2.5 px-4 py-2.5 text-start text-sm text-fd-muted-foreground md:px-6">
          <ProgressCircle className="shrink-0" />
          <span className="flex-1 truncate">{toc[0] ?? 'On this page'}</span>
          <ChevronDown className="size-4 shrink-0" />
        </button>
      </div>

      <main className="min-w-0 px-6 py-10 md:px-10 xl:px-14">
        <article className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-[760px] flex-col">
          <nav className="mb-6 flex items-center gap-1.5 text-sm text-fd-muted-foreground">
            <Link href="/docs" className="transition-colors hover:text-fd-foreground">
              Docs
            </Link>
            <ChevronRight className="size-3.5" />
            <span>{page.group}</span>
          </nav>

          <h1 className="text-[1.75em] font-semibold tracking-tight">{page.title}</h1>
          {page.description ? (
            <p className="mb-8 mt-2 text-lg text-fd-muted-foreground">{page.description}</p>
          ) : null}

          <div className="mb-4 flex flex-row flex-wrap items-center gap-2 border-b pb-6">
            <ActionButton>
              <Copy className="size-3.5" />
              Copy Markdown
            </ActionButton>
            <ActionButton>
              <ExternalLink className="size-3.5" />
              View as Markdown
            </ActionButton>
            <ActionIcon label="More options">
              <MoreHorizontal className="size-4" />
            </ActionIcon>
          </div>

          <div className="md prose flex-1 text-fd-foreground/90">
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </div>

          <div className="mt-12 border-t pt-6">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-fd-muted-foreground">Question? Give us feedback</span>
              <button className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground">
                <ThumbsUp className="size-3.5" />
                Good
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground">
                <ThumbsDown className="size-3.5" />
                Bad
              </button>
            </div>
          </div>

          <FooterNav previous={previous} next={next} />
          <p className="mt-6 text-sm text-fd-muted-foreground">Last updated on July 28, 2026</p>
        </article>
      </main>

      <aside
        id="nd-toc"
        className="sticky top-0 hidden h-dvh w-[268px] flex-col border-s pe-4 ps-6 pt-12 pb-2 xl:flex"
      >
        <h3 className="inline-flex items-center gap-1.5 text-sm text-fd-muted-foreground">
          <Text className="size-4" />
          On this page
        </h3>
        <nav className="fd-scroll-container mt-3 ms-px flex flex-col overflow-y-auto">
          {toc.map((item, index) => (
            <a
              key={item}
              href={`#${slugify(item)}`}
              className={cn(
                'border-s py-1 ps-3 text-sm transition-colors hover:text-fd-foreground',
                index === 0
                  ? 'border-fd-primary text-fd-primary'
                  : 'border-fd-border text-fd-muted-foreground',
              )}
            >
              {item}
            </a>
          ))}
        </nav>
      </aside>

      <button className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 rounded-2xl border bg-fd-card px-4 py-3 text-sm font-medium shadow-xl transition-colors hover:bg-fd-accent">
        <MessageCircle className="size-4" />
        Ask AI
      </button>
    </>
  );
}

function ActionButton({ children }: { children: React.ReactNode }) {
  return (
    <button className="inline-flex items-center gap-1.5 rounded-lg border bg-fd-secondary px-3 py-2 text-sm text-fd-secondary-foreground transition-colors hover:bg-fd-accent">
      {children}
    </button>
  );
}

function ActionIcon({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <button
      aria-label={label}
      className="inline-flex size-9 items-center justify-center rounded-lg border bg-fd-secondary text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
    >
      {children}
    </button>
  );
}

function FooterNav({ previous, next }: { previous?: DocPage; next?: DocPage }) {
  if (!previous && !next) return null;

  return (
    <div className={cn('mt-10 grid gap-4', previous && next ? 'grid-cols-2' : 'grid-cols-1')}>
      {previous ? <FooterItem item={previous} direction="previous" /> : null}
      {next ? <FooterItem item={next} direction="next" /> : null}
    </div>
  );
}

function FooterItem({ item, direction }: { item: DocPage; direction: 'previous' | 'next' }) {
  const Icon = direction === 'previous' ? ChevronLeft : ChevronRight;

  return (
    <Link
      href={`/docs/${item.slug.join('/')}`}
      className={cn(
        'flex flex-col gap-2 rounded-lg border p-4 text-sm transition-colors hover:bg-fd-accent/80 hover:text-fd-accent-foreground max-sm:col-span-full',
        direction === 'next' && 'text-end',
      )}
    >
      <div
        className={cn(
          'inline-flex items-center gap-1.5 font-medium',
          direction === 'next' && 'flex-row-reverse',
        )}
      >
        <Icon className="-mx-1 size-4 shrink-0" />
        <p>{item.title}</p>
      </div>
      <p className="truncate text-fd-muted-foreground">
        {item.description ?? (direction === 'previous' ? 'Previous Page' : 'Next Page')}
      </p>
    </Link>
  );
}

function ProgressCircle({ className }: { className?: string }) {
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
        strokeDashoffset="28"
        strokeLinecap="round"
        transform="rotate(-90 9 9)"
      />
    </svg>
  );
}

function getSiblingPages(page: DocPage) {
  const index = docPages.findIndex((item) => item.slug.join('/') === page.slug.join('/'));

  return {
    previous: index > 0 ? docPages[index - 1] : undefined,
    next: index >= 0 ? docPages[index + 1] : undefined,
  };
}

async function renderMarkdown(markdown: string) {
  const renderer = new marked.Renderer();
  renderer.heading = ({ tokens, depth }) => {
    const text = tokens.map((token) => token.raw).join('');
    const id = slugify(text);
    return `<h${depth} id="${id}">${text}</h${depth}>`;
  };

  return marked.parse(markdown, { renderer });
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export function generateStaticParams() {
  return [{ slug: [] }, ...docPages.map((page) => ({ slug: page.slug }))];
}
