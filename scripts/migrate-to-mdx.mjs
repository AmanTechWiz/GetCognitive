import fs from 'node:fs';
import path from 'node:path';

// We will read the TS files as plain text to avoid TS execution complexity in Node scripts
const docsDir = path.join(process.cwd(), 'content', 'docs', 'chapters');
const appendicesDir = path.join(process.cwd(), 'content', 'docs', 'appendices');
const outDir = path.join(process.cwd(), 'content', 'docs', 'mdx');

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function processFile(filePath, isAppendix) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf-8');

  // Very hacky but effective regex to extract the slug, title, description, group, and body
  const pageRegex =
    /slug:\s*\[([^\]]+)\],[\s\S]*?title:\s*'([^']+)',[\s\S]*?description:\s*'([^']+)',[\s\S]*?group:\s*'([^']+)',[\s\S]*?body:\s*`([\s\S]+?)`,/g;

  let match;
  while ((match = pageRegex.exec(content)) !== null) {
    let rawSlugArray = match[1];
    let title = match[2];
    let description = match[3];
    let group = match[4];
    let body = match[5];

    // parse slug array e.g. "'part-01', 'foundations'"
    const slugs = rawSlugArray.split(',').map((s) => s.replace(/['"\s]/g, ''));
    const parentSlug = slugs.join('-'); // e.g. part-01-foundations

    const chapterDir = path.join(outDir, parentSlug);
    if (!fs.existsSync(chapterDir)) {
      fs.mkdirSync(chapterDir, { recursive: true });
    }

    // Now we split the body into subchapters just like pages.ts did
    const sections = [...body.matchAll(/^##\s+((?:\d+|[A-Z])\.\d+\s+.+)$/gm)].map((m) => ({
      title: m[1],
      index: m.index,
    }));

    if (sections.length === 0) {
      // Just write the whole thing
      const frontmatter = `---
title: "${title}"
description: "${description}"
category: "${group}"
date: "2026-08-01"
---`;
      fs.writeFileSync(path.join(chapterDir, 'index.mdx'), `${frontmatter}\n\n${body}`);
      continue;
    }

    // Write Overview
    const intro = body.slice(0, sections[0].index).trim();
    const overviewFrontmatter = `---
title: "${title} - Overview"
description: "${title}"
category: "${group}"
date: "2026-08-01"
---`;

    // For overview, we just list the sections
    const overviewBody =
      intro +
      '\n\n## Subchapters\n\n' +
      sections.map((s) => `- [${s.title}](./${slugify(s.title)})`).join('\n');
    fs.writeFileSync(
      path.join(chapterDir, '00-overview.mdx'),
      `${overviewFrontmatter}\n\n${overviewBody}`,
    );

    // Write Subchapters
    sections.forEach((section, index) => {
      const next = sections[index + 1]?.index ?? body.length;
      const rawBody = body.slice(section.index, next).trim();
      const childTitle = section.title.replace(/^#+\s*/, '').trim();
      const childBody = rawBody.replace(/^##\s+/, '# ');

      const childFrontmatter = `---
title: "${childTitle}"
description: "${title}"
category: "${group}"
date: "2026-08-01"
---`;
      fs.writeFileSync(
        path.join(chapterDir, `${slugify(childTitle)}.mdx`),
        `${childFrontmatter}\n\n${childBody}`,
      );
    });
  }
}

function run() {
  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
  fs.mkdirSync(outDir, { recursive: true });

  const chapters = fs.readdirSync(docsDir).filter((f) => f.endsWith('.ts'));
  for (const c of chapters) {
    processFile(path.join(docsDir, c), false);
  }

  const appendices = fs.readdirSync(appendicesDir).filter((f) => f.endsWith('.ts'));
  for (const a of appendices) {
    processFile(path.join(appendicesDir, a), true);
  }

  // Also process pages.ts to get the overview
  processFile(path.join(process.cwd(), 'content', 'docs', 'pages.ts'), false);
}

run();
