export type DocPage = {
  slug: string[]; // e.g. ["getting-started"]
  title: string;
  description?: string;
  group: string;
  toc?: string[];
  body: string; // markdown
};

export const docPages: DocPage[] = [
  {
    slug: ['getting-started'],
    title: 'Quick Start',
    description: 'Getting Started with Fumadocs',
    group: 'Introduction',
    toc: ['Introduction', 'Terminology', 'Automatic Installation', 'Enjoy!', 'FAQ', 'Learn More'],
    body: `# Quick Start

Getting Started with Fumadocs

## Introduction

Fumadocs (Foo-ma docs) is a documentation framework, designed to be fast, flexible, and composes seamlessly into your React framework. It consists of multiple layers:

- **Fumadocs Core** handles most of the logic, including document search, content source adapters, and Markdown extensions.
- **Fumadocs UI** offers a beautiful default theme for documentation sites and interactive components.
- **Content Source** can be a CMS or local data layer like Fumadocs MDX.
- **Fumadocs CLI** installs UI components and automates customization.

Want to learn more? Read the introduction and then customize the layout.

### Terminology

Markdown is a markup language for creating formatted text. MDX extends Markdown with JSX components.

Some basic knowledge of React.js is useful for deeper customization.

> Try Fumadocs with simpler DX. Fumapress manages routing, llms.txt, MCP, and other common features on top of Fumadocs.

## Automatic Installation

A minimum version of Node.js 22 is required.

## Run it

\`\`\`bash
npm create fumadocs-app
\`\`\`

It will ask you which framework and content source to use.

## Enjoy!

Create your first MDX file in the docs folder.

\`\`\`mdx
---
title: Hello World
---

## Yo what's up
\`\`\`

Run the app in development mode and open \`/docs\`.

\`\`\`bash
npm run dev
\`\`\`

## FAQ

### How do I change the base route?

Routing is handled by your React framework. Rename the route directory first, then update the base URL in your source config.

### Will dynamic routes be slow?

No. Next.js turns dynamic routes into static routes when \`generateStaticParams\` is configured.

## Learn More

For authoring docs, read the Markdown, Navigation, Page Tree, and Components pages.
`,
  },
  {
    slug: ['customize'],
    title: 'What is Fumadocs',
    description: 'Introducing the docs framework you can break.',
    group: 'Introduction',
    toc: ['Overview', 'Layers', 'Design Goals'],
    body: `# What is Fumadocs

## Overview

Fumadocs is split into composable layers so you can adopt only the pieces you need.

## Layers

- Content source
- Core routing/search/page-tree logic
- UI layouts and components

## Design Goals

The framework aims to stay flexible enough for engineers while providing a polished docs UI out of the box.
`,
  },
  {
    slug: ['manual-installation'],
    title: 'Manual Installation',
    description: 'Install the pieces by hand.',
    group: 'Introduction',
    toc: ['Install Packages', 'Configure Source', 'Add Layout'],
    body: `# Manual Installation

## Install Packages

\`\`\`bash
npm install fumadocs-core fumadocs-ui
\`\`\`

## Configure Source

Create a source loader that maps your content tree to docs routes.

## Add Layout

Wrap docs pages with a layout that receives the page tree.
`,
  },
  {
    slug: ['writing', 'markdown'],
    title: 'Markdown',
    description: 'Author rich content with Markdown and MDX.',
    group: 'Writing',
    toc: ['Markdown', 'Code Blocks', 'Components'],
    body: `# Markdown

## Markdown

Markdown stays readable in source control while still supporting rich docs pages.

## Code Blocks

\`\`\`tsx
export function Button() {
  return <button>Click</button>;
}
\`\`\`

## Components

MDX lets you use React components inside content where needed.
`,
  },
];

export const docGroups = ['Introduction', 'Writing', 'Configurations', 'Integrations'];

export function getDocBySlug(slug: string[]) {
  const normalized = slug.length ? slug : ['getting-started'];
  return docPages.find((p) => p.slug.join('/') === normalized.join('/')) ?? null;
}
