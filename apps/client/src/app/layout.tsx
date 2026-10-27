import type { ReactNode } from 'react';
import './global.css';
import { Poppins, Roboto } from 'next/font/google';
import Header from '@/components/layout/Header';

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
    <html lang="en">
      <body className={`${roboto.variable} ${poppins.variable}`}>
        <Header />
        {children}
      </body>
    </html>
  );
}
