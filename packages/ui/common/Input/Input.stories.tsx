import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from './Input';

const meta = {
  title: 'Forms/Input',
  component: Input,
  args: {
    'aria-label': 'Email',
    placeholder: 'you@example.com',
    type: 'email',
  },
  parameters: {
    docs: {
      description: {
        component:
          'Existing native input with a flex icon area. className styles the wrapper; inputClassName styles the input. Field/Label provide visible labeling. Supports React 19 refs.',
      },
    },
  },
} satisfies Meta<typeof Input>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
export const Invalid: Story = {
  args: { 'aria-invalid': true, defaultValue: 'invalid' },
};
export const ReadOnly: Story = {
  args: { readOnly: true, defaultValue: 'you@example.com' },
};
export const EndIcon: Story = {
  args: { type: 'search', icon: 'SearchIcon', iconPosition: 'end' },
};
