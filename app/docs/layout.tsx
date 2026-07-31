import type { ReactNode } from 'react';
import { DocsSidebar } from '@/components/docs/sidebar';
import { docPages, docGroups, getSearchItems } from '@/content/docs/docs-server';

export default function DocsLayout({ children }: { children: ReactNode }) {
  const searchItems = getSearchItems(docPages);

  return (
    <div
      id="nd-docs-layout"
      className="mx-auto grid min-h-dvh w-full max-w-[1536px] grid-cols-1 overflow-x-clip lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_268px]"
    >
      <DocsSidebar docs={docPages} groups={docGroups} searchItems={searchItems} />
      {children}
    </div>
  );
}
