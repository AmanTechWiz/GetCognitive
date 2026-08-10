import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// We test the pure helper functions extracted from docs-server.ts logic
// without importing the module itself (it has `import "server-only"` which
// would throw in a Vitest/jsdom environment).
// ---------------------------------------------------------------------------

// ---- Replicated helpers (same logic as docs-server.ts) -------------------

function titleCase(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getMarkdownHeadings(markdown: string): { title: string; depth: number }[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: { title: string; depth: number }[] = [];
  let match;
  while ((match = headingRegex.exec(markdown)) !== null) {
    headings.push({
      title: match[2].trim().replace(/\s+#+\s*$/, ''),
      depth: match[1].length,
    });
  }
  return headings;
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugifyHeading(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// --------------------------------------------------------------------------

describe('titleCase', () => {
  it('converts kebab-case to Title Case', () => {
    expect(titleCase('hello-world')).toBe('Hello World');
  });

  it('converts snake_case to Title Case', () => {
    expect(titleCase('hello_world')).toBe('Hello World');
  });

  it('handles a single word', () => {
    expect(titleCase('overview')).toBe('Overview');
  });

  it('handles empty string gracefully', () => {
    expect(titleCase('')).toBe('');
  });

  it('converts multi-word slug', () => {
    expect(titleCase('kv-cache-optimization')).toBe('Kv Cache Optimization');
  });
});

describe('getMarkdownHeadings', () => {
  it('extracts h2 and h3 headings', () => {
    const md = `
# H1 skipped

## Introduction

Some text.

### Details

More text.

## Conclusion
    `.trim();

    const headings = getMarkdownHeadings(md);
    expect(headings).toHaveLength(3);
    expect(headings[0]).toEqual({ title: 'Introduction', depth: 2 });
    expect(headings[1]).toEqual({ title: 'Details', depth: 3 });
    expect(headings[2]).toEqual({ title: 'Conclusion', depth: 2 });
  });

  it('returns empty array for content with no h2/h3', () => {
    expect(getMarkdownHeadings('# H1\nParagraph text.')).toEqual([]);
  });

  it('strips trailing hashes from headings', () => {
    const md = '## Heading with trail ##';
    const [h] = getMarkdownHeadings(md);
    expect(h.title).toBe('Heading with trail');
  });

  it('handles h4 and deeper (should be excluded)', () => {
    const md = '#### Deep heading';
    expect(getMarkdownHeadings(md)).toEqual([]);
  });
});

describe('normalizeSearchText', () => {
  it('lowercases text', () => {
    expect(normalizeSearchText('HELLO WORLD')).toBe('hello world');
  });

  it('removes special characters', () => {
    // Special chars are replaced by spaces, then multiple spaces collapsed to one
    expect(normalizeSearchText('foo! @bar# $baz')).toBe('foo bar baz');
  });

  it('collapses multiple spaces', () => {
    expect(normalizeSearchText('foo   bar')).toBe('foo bar');
  });

  it('trims leading and trailing whitespace', () => {
    expect(normalizeSearchText('  trimmed  ')).toBe('trimmed');
  });

  it('keeps hyphens', () => {
    expect(normalizeSearchText('kv-cache')).toBe('kv-cache');
  });
});

describe('slugifyHeading', () => {
  it('converts spaces to hyphens', () => {
    expect(slugifyHeading('Hello World')).toBe('hello-world');
  });

  it('removes special characters', () => {
    expect(slugifyHeading('What is KV-Cache?')).toBe('what-is-kv-cache');
  });

  it('lowercases the result', () => {
    expect(slugifyHeading('UPPER CASE')).toBe('upper-case');
  });

  it('trims surrounding whitespace', () => {
    expect(slugifyHeading('  spaced  ')).toBe('spaced');
  });

  it('collapses multiple spaces into single hyphen', () => {
    expect(slugifyHeading('a   b')).toBe('a-b');
  });
});
