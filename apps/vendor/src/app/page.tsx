import Link from 'next/link';

const STATS = [
  {
    label: 'Total Revenue',
    value: '$12,480.00',
    change: '+14.2% vs last month',
  },
  {
    label: 'Active Orders',
    value: '28',
    change: '6 awaiting fulfillment',
  },
  {
    label: 'Listed Products',
    value: '64',
    change: '3 low in stock',
  },
  {
    label: 'Store Rating',
    value: '4.9 / 5.0',
    change: 'Based on 142 reviews',
  },
];

const RECENT_ORDERS = [
  {
    id: 'ORD-8492',
    customer: 'Alex Rivera',
    item: 'Minimalist Wool Overshirt',
    total: '$148.00',
    status: 'Processing',
    date: 'Nov 17, 2026',
  },
  {
    id: 'ORD-8491',
    customer: 'Minh Nguyen',
    item: 'Structured Canvas Tote',
    total: '$65.00',
    status: 'Shipped',
    date: 'Nov 17, 2026',
  },
  {
    id: 'ORD-8488',
    customer: 'Elena Rostova',
    item: 'Monochrome Leather Loafer',
    total: '$210.00',
    status: 'Delivered',
    date: 'Nov 16, 2026',
  },
  {
    id: 'ORD-8485',
    customer: 'Marcus Vance',
    item: 'Heavyweight Cotton Tee (2x)',
    total: '$90.00',
    status: 'Delivered',
    date: 'Nov 15, 2026',
  },
];

const ONBOARDING_STEPS = [
  {
    title: '1. Complete seller profile',
    description: 'Verified business details and support contact email.',
    status: 'Completed',
  },
  {
    title: '2. Connect payout account',
    description: 'Link Stripe or bank settlement details for weekly payouts.',
    status: 'In review',
  },
  {
    title: '3. Publish your first catalog collection',
    description: 'Upload product photography, SKUs, and inventory counts.',
    status: 'Ready',
  },
];

const Page = () => {
  return (
    <div className="min-h-screen bg-background text-text">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold tracking-tight">ESHOP</span>
            <span className="rounded-sm border border-border px-2 py-0.5 text-xs font-medium text-muted">
              Seller Center
            </span>
          </div>

          <nav aria-label="Seller navigation" className="hidden items-center gap-6 text-sm md:flex">
            <Link href="/" className="font-medium text-text">
              Overview
            </Link>
            <span className="cursor-default text-muted">Products</span>
            <span className="cursor-default text-muted">Orders</span>
            <span className="cursor-default text-muted">Payouts</span>
            <span className="cursor-default text-muted">Settings</span>
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted sm:inline">
              Atelier Studio Official
            </span>
            <div
              aria-hidden="true"
              className="flex size-8 items-center justify-center rounded-full border border-border bg-background text-xs font-semibold"
            >
              AS
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        <section className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-medium tracking-wider text-muted uppercase">
              Merchant Workspace
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              Welcome back, Atelier Studio
            </h1>
            <p className="mt-1 text-sm text-muted">
              Monitor daily storefront activity, fulfill incoming orders, and manage your catalog.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80"
            >
              View Storefront
            </button>
            <button
              type="button"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary transition-opacity hover:opacity-90"
            >
              + New Product
            </button>
          </div>
        </section>

        <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat) => (
            <article
              key={stat.label}
              className="rounded-lg border border-border bg-surface p-5"
            >
              <p className="text-xs font-medium text-muted">{stat.label}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-muted">{stat.change}</p>
            </article>
          ))}
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <section
            aria-labelledby="recent-orders-heading"
            className="rounded-lg border border-border bg-surface p-6 lg:col-span-2"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 id="recent-orders-heading" className="text-base font-semibold">
                  Recent Orders
                </h2>
                <p className="text-xs text-muted">
                  Latest customer purchases across your active listings
                </p>
              </div>
              <span className="text-xs font-medium text-muted">
                Showing 4 of 28
              </span>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted">
                    <th className="pb-3 font-medium">Order</th>
                    <th className="pb-3 font-medium">Customer</th>
                    <th className="pb-3 font-medium">Item</th>
                    <th className="pb-3 font-medium">Total</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {RECENT_ORDERS.map((order) => (
                    <tr key={order.id}>
                      <td className="py-3.5 font-medium">{order.id}</td>
                      <td className="py-3.5 text-muted">{order.customer}</td>
                      <td className="py-3.5">{order.item}</td>
                      <td className="py-3.5 font-medium">{order.total}</td>
                      <td className="py-3.5">
                        <span className="inline-flex rounded-sm border border-border px-2 py-0.5 text-xs font-medium">
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section
            aria-labelledby="onboarding-heading"
            className="rounded-lg border border-border bg-surface p-6"
          >
            <h2 id="onboarding-heading" className="text-base font-semibold">
              Store Setup Checklist
            </h2>
            <p className="mt-1 text-xs text-muted">
              Finish configuring your merchant account before live checkout launches.
            </p>

            <ul className="mt-4 space-y-4">
              {ONBOARDING_STEPS.map((step) => (
                <li
                  key={step.title}
                  className="rounded-md border border-border bg-background p-3.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{step.title}</p>
                    <span className="text-xs font-medium text-muted">
                      {step.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">{step.description}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Page;
