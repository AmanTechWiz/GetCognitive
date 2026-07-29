import { appendixPages } from './appendices/appendices';
import { part01FoundationsPages } from './chapters/part-01-foundations';
import { part02HighPerformanceInferencePages } from './chapters/part-02-high-performance-inference';
import { part03BuildingAiApplicationsPages } from './chapters/part-03-building-ai-applications';
import { part04RetrievalSystemsPages } from './chapters/part-04-retrieval-systems';
import { part05EvaluationProductionEngineeringPages } from './chapters/part-05-evaluation-production-engineering';
import { part06AiSecurityPages } from './chapters/part-06-ai-security';
import { part07StrategyFailureCaseStudiesPages } from './chapters/part-07-strategy-failure-case-studies';
import type { DocPage } from './types';

export type { DocPage } from './types';

const overviewPage: DocPage = {
  slug: ['overview'],
  title: 'The AI Systems Handbook',
  description: 'From prompt to production: engineering reliable, scalable, and efficient AI systems.',
  group: 'Start Here',
  toc: ['What This Handbook Teaches', 'How To Read It', 'How The Handbook Is Organized'],
  body: `# The AI Systems Handbook

This handbook teaches how modern AI systems work from the first user request to production operations.

It is organized as a practical course for students and engineers. The goal is not to memorize isolated terms. The goal is to understand how prompts, context, model inference, tools, retrieval, evaluation, observability, security, and reliability fit together as one system.

## What This Handbook Teaches

You will learn how an AI request moves through an application, how context is built, how model servers generate tokens, how retrieval systems provide knowledge, how tools are called safely, how agents are controlled, how evaluations catch regressions, and how production systems are monitored and secured.

The chapters are intentionally long-form. Each major chapter is designed to work as a standalone tutorial with mental models, examples, tradeoffs, failure modes, and exercises.

## How To Read It

Read Part I first if you are new to AI systems. It gives you the vocabulary for the rest of the book.

After that, choose a path:

- Read the inference chapters if you care about latency, throughput, GPU memory, or serving cost.
- Read the application chapters if you are building AI products with structured outputs, tools, agents, and routing.
- Read the retrieval chapters if your system needs external knowledge.
- Read the evaluation and production chapters before shipping.
- Read the security chapters before connecting models to private data or powerful tools.

## How The Handbook Is Organized

The content follows the outline in \`list.md\` and is split into part modules under \`content/docs/chapters\`. The Fumadocs-style shell stays generic: chapter data controls routes, sidebar groups, previous/next navigation, and the right-side table of contents.
`,
};

const sourcePages: DocPage[] = [
  overviewPage,
  ...part01FoundationsPages,
  ...part02HighPerformanceInferencePages,
  ...part03BuildingAiApplicationsPages,
  ...part04RetrievalSystemsPages,
  ...part05EvaluationProductionEngineeringPages,
  ...part06AiSecurityPages,
  ...part07StrategyFailureCaseStudiesPages,
  ...appendixPages,
];

export const docPages: DocPage[] = sourcePages.flatMap((page) => expandSubchapters(page));

export const docGroups = [
  'Start Here',
  ...Array.from(new Set(docPages.map((page) => page.group))).filter((group) => group !== 'Start Here'),
];

export function getDocBySlug(slug: string[]) {
  const normalized = slug.length ? slug : ['overview'];
  return docPages.find((p) => p.slug.join('/') === normalized.join('/')) ?? null;
}

function expandSubchapters(page: DocPage): DocPage[] {
  const sections = findNumberedSections(page.body);
  if (sections.length === 0) return [page];

  const intro = page.body.slice(0, sections[0].index).trim();
  const children = sections.map((section, index) => {
    const next = sections[index + 1]?.index ?? page.body.length;
    const rawBody = page.body.slice(section.index, next).trim();
    const childTitle = section.title.replace(/^#+\s*/, '').trim();
    const childBody = rawBody.replace(/^##\s+/, '# ');

    return {
      slug: [...page.slug, slugify(childTitle)],
      title: childTitle,
      description: page.title,
      group: page.group,
      toc: getMarkdownHeadings(childBody),
      body: childBody,
      parentSlug: page.slug,
      parentTitle: page.title,
    } satisfies DocPage;
  });

  const overviewBody = [
    intro || `# ${page.title}`,
    '',
    '## Subchapters',
    '',
    ...children.flatMap((child) => [
      `### ${child.title}`,
      '',
      child.body
        .split('\n')
        .find((line) => line.trim() && !line.startsWith('#'))
        ?.trim() ?? 'Open this subchapter from the sidebar.',
      '',
    ]),
  ].join('\n');

  return [
    {
      ...page,
      title: `${page.title} - Overview`,
      toc: ['Subchapters', ...children.map((child) => child.title)],
      body: overviewBody,
      isChapterOverview: true,
    },
    ...children,
  ];
}

function findNumberedSections(markdown: string) {
  return [...markdown.matchAll(/^##\s+((?:\d+|[A-Z])\.\d+\s+.+)$/gm)].map((match) => ({
    title: match[1],
    index: match.index ?? 0,
  }));
}

function getMarkdownHeadings(markdown: string) {
  return [...markdown.matchAll(/^#{2,3}\s+(.+)$/gm)].map((match) => match[1].trim());
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}
