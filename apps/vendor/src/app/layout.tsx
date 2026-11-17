import './global.css';

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
      <body>{children}</body>
    </html>
  );
}
