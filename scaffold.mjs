import fs from 'node:fs';
import path from 'node:path';

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

const listPath = path.resolve('../list.md');
const outDir = path.resolve('./content/docs/mdx');

if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true });
}
fs.mkdirSync(outDir, { recursive: true });

const content = fs.readFileSync(listPath, 'utf8');
const lines = content.split('\n');

let currentSection = null;
let currentChapter = null;
let currentSubchapter = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  
  if (line.startsWith('# Part ') || line.startsWith('# Appendix ')) {
    const title = line.replace(/^# /, '').trim();
    // Special handling for appendix since it doesn't have "Part X"
    let slug;
    if (title.startsWith('Appendix ')) {
      const parts = title.split('—');
      slug = 'appendix-' + slugify(parts[0].replace('Appendix', '').trim()) + '-' + slugify(parts[1] || '').replace(/^-+/, '');
    } else {
      // Part I — Foundations -> part-1-foundations (approx)
      slug = slugify(title);
    }
    
    currentSection = { title, slug, dir: path.join(outDir, slug), description: '' };
    fs.mkdirSync(currentSection.dir, { recursive: true });
    
    // Peek for description
    let desc = '';
    if (lines[i+1] && lines[i+1].trim() === '') {
      if (lines[i+2] && lines[i+2].trim().startsWith('>')) {
        desc = lines[i+2].replace(/^>\s*/, '').trim();
      }
    }
    
    const indexContent = `---
title: "${title}"
description: "${desc}"
isChapterOverview: true
---

# ${title}

${desc}
`;
    fs.writeFileSync(path.join(currentSection.dir, 'index.mdx'), indexContent);
    currentChapter = null;
    currentSubchapter = null;
  }
  else if (line.startsWith('## Chapter ')) {
    if (!currentSection) continue;
    const title = line.replace(/^## /, '').trim();
    const slug = slugify(title);
    
    currentChapter = { title, slug, dir: path.join(currentSection.dir, slug) };
    fs.mkdirSync(currentChapter.dir, { recursive: true });
    
    const indexContent = `---
title: "${title}"
isChapterOverview: true
---

# ${title}

Overview of ${title}.
`;
    fs.writeFileSync(path.join(currentChapter.dir, 'index.mdx'), indexContent);
    currentSubchapter = null;
  }
  else if (line.startsWith('### ')) {
    if (!currentChapter) continue;
    const title = line.replace(/^### /, '').trim();
    const slug = slugify(title);
    
    currentSubchapter = { title, slug, file: path.join(currentChapter.dir, `${slug}.mdx`), content: `---
title: "${title}"
---

# ${title}

This section covers the details of ${title}.

` };
    fs.writeFileSync(currentSubchapter.file, currentSubchapter.content);
  }
  else if (line.startsWith('- ') && currentSubchapter) {
    const topic = line.replace(/^- /, '').trim();
    fs.appendFileSync(currentSubchapter.file, `## ${topic}\n\nPlaceholder for ${topic}.\n\n`);
  }
}

console.log('Successfully scaffolded docs from list.md');
