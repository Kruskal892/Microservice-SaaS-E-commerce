import type { ReactNode } from 'react';
import './global.css';
import { Poppins, Roboto } from 'next/font/google';
import Header from '@/components/layout/Header';
import { ThemeProvider } from 'next-themes';

export const metadata = {
  title: 'MicroShop',
  description: 'Welcome to MicroShop',
};

const roboto = Roboto({
  subsets: ['latin'],
  variable: '--font-roboto-next',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700'],
  variable: '--font-poppins-next',
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${roboto.variable} ${poppins.variable}`}>
        <ThemeProvider attribute="data-theme" defaultTheme="system">
          <Header />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
