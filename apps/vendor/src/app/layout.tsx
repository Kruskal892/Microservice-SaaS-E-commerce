import './global.css';
import Providers from './providers';

export const metadata = {
  title: 'Eshop Seller Center',
  description: 'Manage your storefront, products, orders, and payouts on Eshop.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <a
            href="#main-content"
            className="sr-only fixed top-3 left-3 z-100 rounded-sm bg-action px-4 py-3 text-on-action focus:not-sr-only focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            Skip to content
          </a>
          {children}
        </Providers>
      </body>
    </html>
  );
}
