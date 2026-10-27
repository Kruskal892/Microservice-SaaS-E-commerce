import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './common/Badge';
import { Button } from './common/Button';

const meta = {
  title: 'Introduction/Getting started',
  parameters: {
    docs: {
      description: {
        component:
          'Shared React 19 + Tailwind v4 components. Import from @packages/ui. Apps own routing, data, validation and state. Use the theme/direction toolbar and each component’s controls and examples.',
      },
    },
  },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Overview: Story = {
  render: () => (
    <main className="flex max-w-3xl flex-col gap-6 p-6">
      <Badge>Shared UI / v1</Badge>
      <h1 className="text-4xl font-semibold">Build once. Compose anywhere.</h1>
      <p>
        Native props, composable Radix behavior, shared tokens and caller-owned
        styles. Start with the smallest component your screen needs.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button>Primary action</Button>
        <Button variant="secondary">Secondary</Button>
        <Button disabled>Disabled</Button>
      </div>
      <h2 className="text-xl font-semibold">Where to start</h2>
      <ol className="list-inside list-decimal">
        <li>Explore the component examples and Autodocs.</li>
        <li>Check default, focus, disabled, invalid and loading states.</li>
        <li>Switch between light/dark and LTR/RTL.</li>
        <li>
          Read docs/reference/common-components.md and
          docs/design/shared-ui-system.md.
        </li>
      </ol>
      <a
        className="text-action underline"
        href="https://www.figma.com/design/SXjnKoIBg4Laj7RqjVgQHo?node-id=7-110"
        target="_blank"
        rel="noreferrer"
      >
        Open the Figma library
      </a>
    </main>
  ),
};
