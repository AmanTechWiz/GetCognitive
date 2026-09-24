import type { Metadata } from 'next';
import { cn } from '@/lib/cn';
import { cva } from 'class-variance-authority';
import { Download, Feather, Lock, PenTool, FileText, HardDrive, Heart } from 'lucide-react';
import { GithubMark } from '@/components/site-header';

export const metadata: Metadata = {
  title: 'Cognitive Notes',
  description:
    'Free, private, open source libre desktop notes app. Notion-style writing plus Excalidraw sketching in a 12 MB app.',
};

const REPO = 'https://github.com/FirePheonix/cognitive-notes';
const RELEASES = `${REPO}/releases/latest`;

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full font-medium tracking-tight transition-colors',
  {
    variants: {
      variant: {
        primary: 'bg-brand text-brand-foreground hover:bg-brand-200',
        secondary: 'border bg-fd-secondary text-fd-secondary-foreground hover:bg-fd-accent',
      },
    },
    defaultVariants: { variant: 'primary' },
  },
);

const features = [
  {
    icon: FileText,
    title: 'Notion-style writing',
    body: 'Clean block-based editor for notes, docs, and long-form thinking.',
  },
  {
    icon: PenTool,
    title: 'Excalidraw built in',
    body: 'Sketch diagrams and whiteboards right next to your writing.',
  },
  {
    icon: Feather,
    title: '12 MB, instant',
    body: 'Built on Tauri + Rust. No Electron bloat, launches in a blink.',
  },
  {
    icon: Lock,
    title: 'Private by default',
    body: 'No accounts, no telemetry, no cloud. Nothing leaves your machine.',
  },
  {
    icon: HardDrive,
    title: 'Local-first',
    body: 'Your notes live on your disk. Works fully offline.',
  },
  {
    icon: Heart,
    title: 'Free forever',
    body: 'Open source and libre. Read it, fork it, make it yours.',
  },
];

export default function CognitiveNotesPage() {
  return (
    <main className="px-4 pt-4 pb-6">
      <section className="relative mx-auto flex w-full max-w-[1400px] flex-col items-center overflow-hidden rounded-2xl border bg-fd-card px-6 pt-16 pb-12 text-center md:pt-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,var(--color-brand)_0%,transparent_65%)] opacity-15"
        />
        <p className="relative rounded-full border border-brand/50 p-2 px-3 text-xs font-medium text-brand">
          free, private, open source libre
        </p>
        <h1 className="relative mt-8 mb-4 text-4xl font-medium tracking-tight xl:text-6xl">
          Write it. Sketch it.
          <br />
          <span className="text-brand">Keep it yours.</span>
        </h1>
        <p className="relative mb-8 max-w-[600px] text-base leading-7 text-fd-muted-foreground">
          Cognitive Notes is a lightweight desktop app that puts Notion-style writing and
          Excalidraw drawing in one place. Local, private, and just 12 MB.
        </p>
        <div className="relative flex flex-wrap items-center justify-center gap-3">
          <a href={RELEASES} target="_blank" rel="noreferrer noopener" className={buttonVariants()}>
            <Download className="size-4" />
            Download for Windows
          </a>
          <a
            href={REPO}
            target="_blank"
            rel="noreferrer noopener"
            className={buttonVariants({ variant: 'secondary' })}
          >
            <GithubMark className="size-4" />
            Star on GitHub
          </a>
        </div>
        <p className="relative mt-4 text-xs text-fd-muted-foreground">
          Latest release on GitHub · macOS &amp; Linux: build from source
        </p>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://raw.githubusercontent.com/FirePheonix/cognitive-notes/main/image.png"
          alt="Cognitive Notes app screenshot"
          className="relative mt-14 w-full max-w-5xl rounded-xl border shadow-2xl"
        />
      </section>

      <section className="mx-auto mt-6 grid w-full max-w-[1400px] gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="rounded-2xl border bg-fd-card p-6 text-sm shadow-lg">
            <div className="mb-4 w-fit rounded-md border bg-fd-muted p-1.5">
              <f.icon className="size-4 text-brand" />
            </div>
            <h3 className="mb-1 text-base font-medium">{f.title}</h3>
            <p className="text-fd-muted-foreground">{f.body}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto mt-6 flex w-full max-w-[1400px] flex-col items-center gap-5 rounded-2xl border bg-fd-card px-6 py-12 text-center">
        <h2 className="text-3xl font-medium tracking-tight lg:text-4xl">
          Your notes, <span className="text-brand">on your machine.</span>
        </h2>
        <div className="flex flex-wrap justify-center gap-3">
          <a href={RELEASES} target="_blank" rel="noreferrer noopener" className={buttonVariants()}>
            <Download className="size-4" />
            Get the latest release
          </a>
          <a
            href={REPO}
            target="_blank"
            rel="noreferrer noopener"
            className={cn(buttonVariants({ variant: 'secondary' }))}
          >
            View source
          </a>
        </div>
      </section>
    </main>
  );
}
