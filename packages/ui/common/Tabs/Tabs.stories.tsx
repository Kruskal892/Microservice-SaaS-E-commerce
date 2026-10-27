import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs';

const meta = {
  title: 'Layout/Tabs',
  component: Tabs,
  args: { defaultValue: 'overview' },
  render: (args) => (
    <Tabs {...args}>
      <TabsList aria-label="Account sections">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
        <TabsTrigger value="billing" disabled>
          Billing
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Your account summary.</TabsContent>
      <TabsContent value="settings">Your account settings.</TabsContent>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        component:
          'Related content panels with roving keyboard focus. Use activationMode="manual" for panels that perform expensive work. Root supports controlled value and orientation; pass dir="rtl" or use a Radix Direction.Provider for RTL.',
      },
    },
  },
} satisfies Meta<typeof Tabs>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const ManualActivation: Story = { args: { activationMode: 'manual' } };
export const Vertical: Story = { args: { orientation: 'vertical' } };
export const KeyboardNavigation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('tab', { name: 'Overview' }));
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('tab', { name: 'Settings' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent(
      'Your account settings.',
    );
  },
};
