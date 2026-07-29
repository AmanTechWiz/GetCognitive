export type DocPage = {
  slug: string[];
  title: string;
  description?: string;
  group: string;
  toc?: string[];
  body: string;
  parentSlug?: string[];
  parentTitle?: string;
  isChapterOverview?: boolean;
};
