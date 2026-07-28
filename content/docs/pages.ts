export type DocPage = {
  slug: string[]; // e.g. ["getting-started"]
  title: string;
  description?: string;
  body: string; // markdown
};

export const docPages: DocPage[] = [
  {
    slug: ['getting-started'],
    title: 'Getting Started',
    description: 'A quick start for the cognitive starter.',
    body: `# Getting Started

This project is a lightweight **Next.js + React 19 + Tailwind v4** starter with:

- a landing page at \`/\`
- docs at \`/docs\`
- static export via \`npm run export\`

## Run it

\`\`\`bash
npm install
npm run dev
\`\`\`

## Ship it

\`\`\`bash
npm run export
\`\`\`
`,
  },
  {
    slug: ['customize'],
    title: 'Customize',
    description: 'Where to tweak colors, layout, and content.',
    body: `# Customize

## Theme tokens

Edit \`styles/site/theme.css\` to adjust brand colors.

## Landing page

Edit \`app/(home)/page.tsx\`.

## Docs content

Edit \`content/docs/pages.ts\`.
`,
  },
];

export function getDocBySlug(slug: string[]) {
  const normalized = slug.length ? slug : ['getting-started'];
  return docPages.find((p) => p.slug.join('/') === normalized.join('/')) ?? null;
}

