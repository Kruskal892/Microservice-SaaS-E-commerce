import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Checkbox } from './Checkbox';
import { Label } from '../Field';

const meta = {
  title: 'Forms/Checkbox',
  component: Checkbox,
  args: { 'aria-label': 'Receive updates' },
} satisfies Meta<typeof Checkbox>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const checkbox = within(canvasElement).getByRole('checkbox');
    await userEvent.click(checkbox);
    await expect(checkbox).toBeChecked();
    await userEvent.keyboard(' ');
    await expect(checkbox).not.toBeChecked();
  },
};
export const Checked: Story = { args: { defaultChecked: true } };
export const Indeterminate: Story = { args: { checked: 'indeterminate' } };
export const Disabled: Story = {
  args: { disabled: true, defaultChecked: true },
};
export const Invalid: Story = { args: { 'aria-invalid': true } };
export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="updates" name="updates" />
      <Label htmlFor="updates">Receive updates</Label>
    </div>
  ),
};
