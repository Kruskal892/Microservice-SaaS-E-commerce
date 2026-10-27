import type { Meta, StoryObj } from '@storybook/react-vite';
import { Textarea } from './Textarea';

const meta = {
  title: 'Forms/Textarea',
  component: Textarea,
  args: { 'aria-label': 'Message', placeholder: 'Write a message', rows: 4 },
} satisfies Meta<typeof Textarea>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
export const Invalid: Story = { args: { 'aria-invalid': true } };
export const ReadOnly: Story = {
  args: { readOnly: true, defaultValue: 'Saved message' },
};
