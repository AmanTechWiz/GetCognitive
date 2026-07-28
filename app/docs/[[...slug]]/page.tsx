'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { marked } from 'marked';
import { getDocBySlug } from '@/content/docs/pages';

export default function DocsPage() {
  const params = useParams<{ slug?: string[] }>();
  const slug = params?.slug ?? [];
  const page = getDocBySlug(Array.isArray(slug) ? slug : [slug]);
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

  const html = marked.parse(page.body);

  return (
    <article className="md">
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  );
}
