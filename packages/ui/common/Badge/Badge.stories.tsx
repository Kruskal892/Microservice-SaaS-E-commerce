import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './Badge';

const meta = {
  title: 'Layout/Badge',
  component: Badge,
  args: { children: 'Draft', tone: 'neutral' },
  argTypes: {
    tone: {
      control: 'select',
      options: ['neutral', 'success', 'warning', 'danger'],
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Non-interactive status label. Always include status text; color alone cannot communicate meaning. Set role="status" only for live updates that should be announced.',
      },
    },
  },
} satisfies Meta<typeof Badge>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Tones: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge>Draft</Badge>
      <Badge tone="success">Published</Badge>
      <Badge tone="warning">Pending</Badge>
      <Badge tone="danger">Failed</Badge>
    </div>
  ),
};
