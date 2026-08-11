import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Cognitive — AI Knowledge Base',
    template: '%s | Cognitive',
  },
  description:
    'Every AI concept, before it becomes mainstream. Community-maintained AI engineering knowledge.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="overflow-x-clip">
      <body className="overflow-x-clip max-w-full min-h-screen">
        <ThemeProvider>
          <SiteHeader />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
