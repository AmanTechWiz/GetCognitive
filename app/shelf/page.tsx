import Link from 'next/link';

export const metadata = {
  title: 'Complete Shelf',
  description: 'Mint Playground — The Complete Shelf.',
};

export default function ShelfPage() {
  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 pt-6 pb-12 md:px-12">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
        <div className="space-y-1">
          <p className="text-xs text-brand font-medium rounded-full px-3 py-1 border border-brand/50 w-fit">
            Interactive demo
          </p>
          <h1 className="text-2xl font-medium tracking-tight">The Complete Shelf</h1>
          <p className="text-sm text-fd-muted-foreground">Embedded from Mint Playground.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href="https://play.mint.gg/complete-shelf"
            target="_blank"
            rel="noreferrer noopener"
            className="text-sm text-brand hover:underline"
          >
            Open in new tab
          </a>
          <Link href="/" className="text-sm text-fd-muted-foreground hover:underline">
            Back home
          </Link>
        </div>
      </div>

      <div className="relative w-full overflow-hidden rounded-2xl border bg-black shadow-lg">
        <div className="relative w-full min-h-[70vh]">
          <iframe
            title="Mint Playground — The Complete Shelf"
            src="https://play.mint.gg/complete-shelf"
            className="absolute inset-0 size-full"
            allow="autoplay; fullscreen; xr-spatial-tracking; clipboard-write; accelerometer; gyroscope"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-pointer-lock allow-downloads allow-popups-to-escape-sandbox"
          />
        </div>
      </div>
    </main>
  );
}

