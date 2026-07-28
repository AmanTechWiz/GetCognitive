'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import { CodeInline } from '@/components/code-inline';
import { Marquee } from '@/components/marquee';

import Bg2Image from './assets/bg-2.png';
import CLIImage from './assets/cli.png';
import HeroPreviewImage from './assets/hero-preview.jpeg';

function Button({
  href,
  children,
  variant = 'primary',
}: {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}) {
  const className = cn(
    'inline-flex justify-center px-5 py-3 rounded-full font-medium tracking-tight transition-colors text-sm',
    variant === 'primary' && 'bg-brand text-brand-foreground hover:bg-brand-200',
    variant === 'secondary' &&
      'border bg-fd-secondary text-fd-secondary-foreground hover:bg-fd-accent',
  );

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export default function HomePage() {
  return (
    <main className="text-landing-foreground pt-4 pb-12 dark:text-landing-foreground-dark">
      <div className="relative flex min-h-[600px] h-[70vh] max-h-[900px] border rounded-2xl overflow-hidden mx-auto w-full max-w-[1400px] bg-origin-border">
        <Image
          src={HeroPreviewImage}
          alt=""
          priority
          className="absolute inset-0 size-full object-cover -z-10 opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/30 -z-10" />

        <div className="flex flex-col z-2 px-4 size-full md:p-12 max-md:items-center max-md:text-center">
          <p className="mt-12 text-xs text-brand font-medium rounded-full p-2 border border-brand/50 w-fit bg-white/40 backdrop-blur-sm">
            the React.js docs framework you love.
          </p>
          <h1 className="text-4xl my-8 leading-tighter font-medium xl:text-5xl xl:mb-12">
            Build excellent
            <br className="md:hidden" /> documentation,
            <br />
            your <span className="text-brand">style</span>.
          </h1>
          <div className="flex flex-row items-center justify-center gap-4 flex-wrap w-fit">
            <Button href="/docs">Getting Started</Button>
            <a
              href="https://stackblitz.com/"
              target="_blank"
              rel="noreferrer noopener"
              className={cn(
                'inline-flex justify-center px-5 py-3 rounded-full font-medium tracking-tight transition-colors text-sm',
                'border bg-fd-secondary text-fd-secondary-foreground hover:bg-fd-accent',
              )}
            >
              Open StackBlitz
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 mt-12 px-6 mx-auto w-full max-w-[1400px] md:px-12 lg:grid-cols-2 lg:mt-20">
        <p className="text-2xl tracking-tight leading-snug font-light col-span-full md:text-3xl xl:text-4xl">
          A lightweight docs site starter: landing + docs UI, built with{' '}
          <span className="text-brand font-medium">Next.js</span>,{' '}
          <span className="text-brand font-medium">React 19</span>, and{' '}
          <span className="text-brand font-medium">Tailwind v4</span>.
        </p>

        <div className="relative p-4 rounded-2xl col-span-full z-2 overflow-hidden md:p-8 border bg-fd-card shadow-lg">
          <Image
            src={Bg2Image}
            alt=""
            className="absolute inset-0 size-full object-top object-cover -z-10 opacity-50"
          />
          <div className="mx-auto w-full max-w-[900px] p-4 bg-fd-card text-fd-card-foreground border rounded-2xl shadow-lg">
            <div className="flex flex-row flex-wrap gap-2 items-center">
              <span className="text-brand content-center font-mono font-bold uppercase border-2 border-brand/50 px-2 rounded-xl">
                Try it out
              </span>
              <CodeInline className="flex-1 min-w-[260px]" code="npm create next-app@latest cognitive" />
            </div>
            <div className="mt-4 flex flex-row flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[260px] rounded-xl border bg-fd-secondary p-4">
                <p className="font-mono text-xs text-fd-muted-foreground">$ npm run dev</p>
                <p className="mt-2 text-sm">Landing page + docs, ready to customize.</p>
              </div>
              <Image
                src={CLIImage}
                alt=""
                className="w-[320px] max-w-full rounded-xl border shadow-md"
              />
            </div>
          </div>
        </div>

        <section className="col-span-full border rounded-2xl p-6 bg-fd-card shadow-lg">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-2xl font-medium tracking-tight">What’s inside</h2>
            <div className="flex gap-2 flex-wrap">
              <CodeInline code="/  landing" />
              <CodeInline code="/docs  docs UI" />
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border p-5 bg-fd-secondary">
              <h3 className="font-medium tracking-tight">Landing</h3>
              <p className="mt-2 text-sm text-fd-muted-foreground">
                Hero, CTA, and sections you can ship.
              </p>
            </div>
            <div className="rounded-2xl border p-5 bg-fd-secondary">
              <h3 className="font-medium tracking-tight">Docs</h3>
              <p className="mt-2 text-sm text-fd-muted-foreground">
                Sidebar + markdown pages (static export friendly).
              </p>
            </div>
            <div className="rounded-2xl border p-5 bg-fd-secondary">
              <h3 className="font-medium tracking-tight">Tailwind v4</h3>
              <p className="mt-2 text-sm text-fd-muted-foreground">
                Theme tokens via CSS-first `@theme`.
              </p>
            </div>
          </div>

          <div className="mt-8">
            <Marquee className="py-2">
              <div className="flex gap-4">
                {['Next.js', 'React 19', 'Tailwind v4', 'Static export', 'Docs'].map((t) => (
                  <span
                    key={t}
                    className="px-4 py-2 rounded-full border bg-fd-secondary text-fd-secondary-foreground text-sm"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </Marquee>
          </div>
        </section>
      </div>
    </main>
  );
}
