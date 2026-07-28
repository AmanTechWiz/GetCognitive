import Link from 'next/link';
import { marked } from 'marked';
import { docPages, getDocBySlug } from '@/content/docs/pages';

export default async function DocsPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug = [] } = await params;
  const page = getDocBySlug(slug);
  if (!page) {
    return (
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Not found</h1>
        <p className="mt-2 text-sm text-fd-muted-foreground">
          This doc page doesn’t exist.
        </p>
        <div className="mt-6">
          <Link
            href="/docs/getting-started"
            className="inline-flex justify-center px-5 py-3 rounded-full font-medium tracking-tight transition-colors text-sm bg-brand text-brand-foreground hover:bg-brand-200"
          >
            Go to Getting Started
          </Link>
        </div>
      </div>
    );
  }

  const html = await marked.parse(page.body);
  const toc = page.toc ?? [];

  return (
    <div className="grid min-h-[calc(100vh-3.5rem)] grid-cols-1 xl:grid-cols-[minmax(0,1fr)_240px]">
      <main className="min-w-0 px-6 py-10 md:px-10 xl:px-14">
        <div className="mx-auto max-w-[760px]">
          <p className="mb-2 text-sm text-fd-muted-foreground">{page.title}</p>
          <article className="md">
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </article>
          <div className="mt-12 flex items-center justify-between border-t pt-6 text-sm">
            <button className="rounded-lg border px-3 py-2 text-fd-muted-foreground">Good</button>
            <button className="rounded-lg border px-3 py-2 text-fd-muted-foreground">Bad</button>
          </div>
        </div>
      </main>
      <aside className="hidden border-l px-6 py-10 xl:block">
        <div className="sticky top-24">
          <p className="mb-3 text-sm font-medium">On this page</p>
          <nav className="space-y-2">
            {toc.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replaceAll(' ', '-')}`}
                className="block text-sm text-fd-muted-foreground transition-colors hover:text-fd-foreground"
              >
                {item}
              </a>
            ))}
          </nav>
        </div>
      </aside>
      <button className="fixed bottom-5 right-5 rounded-2xl border bg-fd-card px-4 py-3 text-sm font-medium shadow-xl">
        Ask AI
      </button>
    </div>
  );
}

export function generateStaticParams() {
  return [{ slug: [] }, ...docPages.map((page) => ({ slug: page.slug }))];
}
