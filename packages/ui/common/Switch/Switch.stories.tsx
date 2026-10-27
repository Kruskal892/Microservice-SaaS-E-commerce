import type { Meta, StoryObj } from '@storybook/react-vite';
import { Switch } from './Switch';
import { Label } from '../Field';

const meta = {
  title: 'Forms/Switch',
  component: Switch,
  args: { 'aria-label': 'Notifications' },
} satisfies Meta<typeof Switch>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Checked: Story = { args: { defaultChecked: true } };
export const Disabled: Story = { args: { disabled: true } };
export const DisabledChecked: Story = {
  args: { disabled: true, defaultChecked: true },
};
export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Switch id="notifications" name="notifications" />
      <Label htmlFor="notifications">Notifications</Label>
    </div>
  ),
};
