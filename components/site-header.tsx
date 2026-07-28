'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GitBranch, Search, SunMoon } from 'lucide-react';
import { cn } from '@/lib/cn';

const navItems = [
  { href: '/docs', label: 'Docs' },
  { href: '/docs/customize', label: 'Showcase' },
  { href: '/docs/getting-started', label: 'Blog' },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b bg-fd-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center gap-3 px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-medium">
          <span className="grid size-7 place-items-center rounded-lg bg-fd-primary text-fd-primary-foreground text-sm">
            F
          </span>
          <span>Fumadocs</span>
        </Link>
        <nav className="hidden items-center gap-1 text-sm text-fd-muted-foreground md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-lg px-2.5 py-1.5 transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground',
                pathname.startsWith(item.href) && 'text-fd-foreground',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button className="ms-auto hidden h-9 min-w-[260px] items-center gap-2 rounded-lg border bg-fd-secondary px-3 text-sm text-fd-muted-foreground md:flex">
          <Search className="size-4" />
          <span>Search</span>
          <kbd className="ms-auto rounded-md border bg-fd-background px-1.5 py-0.5 text-[11px]">
            Ctrl K
          </kbd>
        </button>
        <button className="grid size-9 place-items-center rounded-lg border bg-fd-secondary text-fd-muted-foreground md:hidden">
          <Search className="size-4" />
        </button>
        <a
          href="https://github.com/fuma-nama/fumadocs"
          aria-label="GitHub"
          className="grid size-9 place-items-center rounded-lg text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
        >
          <GitBranch className="size-4" />
        </a>
        <button
          aria-label="Theme"
          className="grid size-9 place-items-center rounded-lg text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
        >
          <SunMoon className="size-4" />
        </button>
      </div>
    </header>
  );
}
