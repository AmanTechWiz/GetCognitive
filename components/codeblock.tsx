'use client';

import { cn } from '@/lib/cn';

type CodeBlockOptions = {
  title?: string;
  className?: string;
};

export function ServerCodeBlock({
  code,
  lang,
  codeblock,
}: {
  code: string;
  lang?: string;
  codeblock?: CodeBlockOptions;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border bg-fd-secondary text-fd-secondary-foreground shadow-sm',
        codeblock?.className,
      )}
    >
      {codeblock?.title ? (
        <div className="border-b px-4 py-2 text-xs font-medium text-fd-muted-foreground">
          {codeblock.title}
        </div>
      ) : null}
      <pre className="overflow-auto p-4 text-sm leading-relaxed">
        <code data-lang={lang}>{code}</code>
      </pre>
    </div>
  );
}
