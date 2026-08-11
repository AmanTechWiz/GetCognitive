import { cn } from '@/lib/cn';
import { cva } from 'class-variance-authority';
import { Mail } from 'lucide-react';

const headingVariants = cva('font-medium tracking-tight', {
  variants: {
    variant: {
      h2: 'text-3xl lg:text-4xl',
      h3: 'text-xl lg:text-2xl',
    },
  },
});

export default function NewsletterPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="flex flex-col items-center gap-6 max-w-md w-full p-8 rounded-2xl border bg-fd-card/80 shadow-xl backdrop-blur-sm">
        <div className="size-12 rounded-full bg-brand/10 text-brand flex items-center justify-center">
          <Mail className="size-6" />
        </div>
        <div className="space-y-2">
          <h1 className={cn(headingVariants({ variant: 'h2' }))}>Newsletter</h1>
          <p className="text-fd-muted-foreground text-sm">
            Coming soon. Join the waitlist to get weekly updates on the latest AI concepts,
            diagrams, and architecture patterns.
          </p>
        </div>
      </div>
    </main>
  );
}
