import type { Meta, StoryObj } from '@storybook/react-vite';

const colors = {
  Background: 'bg-background text-text',
  Surface: 'bg-surface text-text',
  Raised: 'bg-surface-alt text-text',
  Action: 'bg-action text-on-action',
  Hover: 'bg-action-hover text-on-action',
  Active: 'bg-action-active text-on-action',
  Danger: 'bg-danger-action text-on-action',
  Focus: 'bg-focus text-text',
};
const meta = {
  title: 'Foundations/Theme',
  parameters: {
    docs: {
      description: {
        component:
          'Shared semantic color roles, spacing, radius and type. Set .dark or data-theme="dark" on the document root, including portaled content. Client Google fonts remain app-local.',
      },
    },
  },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Tokens: Story = {
  render: () => (
    <div className="flex max-w-4xl flex-col gap-6">
      <h1 className="text-3xl font-semibold">Shared foundations</h1>
      <div className="flex flex-wrap gap-4">
        {Object.entries(colors).map(([name, classes]) => (
          <div
            key={name}
            className={`flex h-20 w-40 items-center justify-center rounded-sm border border-border ${classes}`}
          >
            {name}
          </div>
        ))}
      </div>
      <h2 className="text-xl font-semibold">Type and shape</h2>
      <p className="text-base">Body: 16px / native Inter or system fallback</p>
      <p className="text-sm text-muted">Secondary: 14px</p>
      <div className="flex gap-4">
        <div className="rounded-sm border border-border bg-surface p-4">
          Radius sm / 8px
        </div>
        <div className="rounded-md border border-border bg-surface p-6">
          Radius md / 12px
        </div>
      </div>
    </div>
  ),
};
