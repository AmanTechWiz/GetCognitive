'use client';

import { useEffect } from 'react';
import mermaid from 'mermaid';
import { useTheme } from 'next-themes';

export function MermaidInitializer({ html }: { html: string }) {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: resolvedTheme === 'dark' ? 'dark' : 'default',
    });
    mermaid.run({ querySelector: '.mermaid' }).catch(console.error);
  }, [html, resolvedTheme]);

  return null;
}
