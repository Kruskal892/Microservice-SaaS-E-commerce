import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
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
          'Native input with flex icon areas and an eye/eye-off control for type="password". className styles the wrapper; inputClassName styles the input. Field/Label provide visible labeling. Supports React 19 refs.',
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

export const Password: Story = {
  args: {
    'aria-label': 'Password',
    type: 'password',
    placeholder: 'Enter your password',
    defaultValue: 'example-password',
    icon: 'LockIcon',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText('Password');
    const revealButton = canvas.getByRole('button', { name: 'Show password' });

    await expect(input).toHaveAttribute('type', 'password');
    await expect(revealButton).toHaveAttribute('type', 'button');
    await expect(revealButton).toHaveAttribute('aria-controls', input.id);
    await userEvent.click(revealButton);
    await expect(input).toHaveAttribute('type', 'text');
    await expect(input).toHaveValue('example-password');
    await userEvent.click(
      canvas.getByRole('button', { name: 'Hide password' }),
    );
    await expect(input).toHaveAttribute('type', 'password');
    await expect(input).toHaveValue('example-password');
  },
};

export const DisabledPassword: Story = {
  args: {
    'aria-label': 'Password',
    type: 'password',
    placeholder: 'Enter your password',
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText('Password')).toBeDisabled();
    await expect(
      canvas.getByRole('button', { name: 'Show password' }),
    ).toBeDisabled();
  },
};
