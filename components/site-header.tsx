'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  AlbumIcon,
  BookOpen,
  Boxes,
  ChevronDown,
  FileCode2,
  Heart,
  LayoutTemplate,
  Moon,
  Search,
  Sun,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { FumadocsIcon } from '@/components/fumadocs-icon';

const navItems = [
  { href: '/blog', label: 'Blog', icon: AlbumIcon },
  { href: '/showcase', label: 'Showcase', icon: LayoutTemplate },
  { href: 'https://fuma-nama.dev/sponsors', label: 'Sponsors', icon: Heart, external: true },
];

const documentationItems = [
  {
    href: '/docs',
    title: 'Framework',
    description: 'The docs framework',
    icon: BookOpen,
  },
  {
    href: '/docs/customize',
    title: 'UI',
    description: 'Default layouts, components, and theme tokens.',
    icon: LayoutTemplate,
  },
  {
    href: '/docs/writing/markdown',
    title: 'Markdown',
    description: 'Author docs with Markdown and MDX.',
    icon: FileCode2,
  },
  {
    href: '/docs/manual-installation',
    title: 'Integrations',
    description: 'Wire content, search, and frameworks together.',
    icon: Boxes,
  },
];

export function SiteHeader() {
  const pathname = usePathname();

  if (pathname.startsWith('/docs')) return null;

  return (
    <header id="nd-nav" className="sticky top-0 z-40 h-14">
      <div className="border-b bg-fd-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center px-4">
          <Link href="/" className="inline-flex items-center gap-2.5 font-semibold">
            <FumadocsIcon className="size-5" />
            <span>Fumadocs</span>
          </Link>

          <nav className="hidden flex-row items-center gap-2 px-6 text-sm sm:flex">
            <DocumentationMenu pathname={pathname} />
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                target={item.external ? '_blank' : undefined}
                rel={item.external ? 'noreferrer noopener' : undefined}
                className={cn(
                  'inline-flex items-center gap-1 p-2 text-fd-muted-foreground transition-colors hover:text-fd-accent-foreground',
                  pathname.startsWith(item.href) && 'text-fd-primary',
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ms-auto hidden flex-row items-center justify-end gap-1.5 lg:flex">
            <button className="flex h-9 w-full max-w-[240px] items-center gap-2 rounded-full border bg-fd-secondary px-3 text-sm text-fd-muted-foreground">
              <Search className="size-4" />
              <span>Search</span>
              <kbd className="ms-auto rounded-md border bg-fd-background px-1.5 py-0.5 text-[11px]">
                Ctrl K
              </kbd>
            </button>
            <ThemeToggle />
            <a
              href="https://github.com/fuma-nama/fumadocs"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Github"
              className="inline-flex size-9 items-center justify-center rounded-md p-2 text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
            >
              <GithubMark className="size-4" />
            </a>
          </div>

          <div className="ms-auto flex flex-row items-center -me-1.5 lg:hidden">
            <button className="inline-flex size-10 items-center justify-center rounded-md p-2 text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground">
              <Search className="size-4" />
            </button>
            <button className="inline-flex size-10 items-center justify-center rounded-md p-2 text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground">
              <ChevronDown className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function DocumentationMenu({ pathname }: { pathname: string }) {
  const active = pathname.startsWith('/docs');

  return (
    <div className="group relative">
      <Link
        href="/docs"
        className={cn(
          'inline-flex items-center gap-1 p-2 text-fd-muted-foreground transition-colors hover:text-fd-accent-foreground',
          active && 'text-fd-primary',
        )}
      >
        <BookOpen className="size-4" />
        Documentation
        <ChevronDown className="size-3 transition-transform group-hover:rotate-180" />
      </Link>
      <div className="invisible absolute left-0 top-full z-50 w-[620px] translate-y-2 pt-2 opacity-0 transition duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
        <div className="rounded-xl border bg-fd-popover/90 p-3 text-fd-popover-foreground shadow-lg backdrop-blur-md">
          <div className="grid grid-cols-2 gap-2">
            {documentationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col gap-2 rounded-lg border bg-fd-card p-3 transition-colors hover:bg-fd-accent/80 hover:text-fd-accent-foreground"
              >
                <div className="w-fit rounded-md border bg-fd-muted p-1">
                  <item.icon className="size-4" />
                </div>
                <p className="text-base font-medium">{item.title}</p>
                <p className="text-sm text-fd-muted-foreground">{item.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const value = mounted ? resolvedTheme : 'light';

  return (
    <div
      className={cn(
        'inline-flex h-9 items-center rounded-full border bg-fd-secondary p-1 text-fd-muted-foreground',
        className,
      )}
      data-theme-toggle=""
    >
      <button
        aria-label="Light"
        onClick={() => setTheme('light')}
        className={cn(
          'grid size-7 place-items-center rounded-full transition-colors',
          value === 'light' && 'bg-fd-background text-fd-foreground shadow-sm',
        )}
      >
        <Sun className="size-4" />
      </button>
      <button
        aria-label="Dark"
        onClick={() => setTheme('dark')}
        className={cn(
          'grid size-7 place-items-center rounded-full transition-colors',
          value === 'dark' && 'bg-fd-background text-fd-foreground shadow-sm',
        )}
      >
        <Moon className="size-4" />
      </button>
    </div>
  );
}

export function GithubMark({ className }: { className?: string }) {
  return (
    <svg role="img" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}
