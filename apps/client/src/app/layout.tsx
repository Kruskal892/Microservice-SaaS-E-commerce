import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './global.css';
import Header from '@/components/layout/Header';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'Eshop',
  description: 'Thoughtful finds for everyday life.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <a
            href="#main-content"
            className="sr-only fixed top-3 left-3 z-100 rounded-sm bg-action px-4 py-3 text-on-action focus:not-sr-only focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            Skip to content
          </a>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
