import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { createRef, useState } from 'react';
import { Button } from '../Button';
import { OtpInput } from './OtpInput';

const meta = {
  title: 'Forms/OtpInput',
  component: OtpInput,
  args: { 'aria-label': 'Verification code', onValueChange: fn() },
  parameters: {
    docs: {
      description: {
        component:
          'Separate digit boxes powered by input-otp, with a single accessible control. Defaults to four digits with one-time-code autocomplete. Supports native refs, controlled/uncontrolled values, selection, paste, keyboard editing, and group/slot styling hooks. Label it with Field/Label or aria-label. Verification and resend behavior belong to the caller.',
      },
    },
  },
} satisfies Meta<typeof OtpInput>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const input = within(canvasElement).getByRole('textbox');
    const slots = canvasElement.querySelectorAll('[data-slot="otp-slot"]');
    await expect(slots).toHaveLength(4);
    await expect(input).toHaveAttribute('inputmode', 'numeric');
    await expect(input).toHaveAttribute('autocomplete', 'one-time-code');
    await expect(input).toHaveAttribute('maxlength', '4');
    await userEvent.type(input, '0a12b3');
    await expect(input).toHaveValue('0123');
    await expect(Array.from(slots, (slot) => slot.textContent).join('')).toBe(
      '0123',
    );
    await expect(args.onValueChange).toHaveBeenLastCalledWith('0123');
    await userEvent.keyboard('{Backspace}');
    await expect(input).toHaveValue('012');
    await userEvent.clear(input);
    await expect(input).toHaveValue('');
  },
};

export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = useState('');
    return <OtpInput {...args} value={value} onValueChange={setValue} />;
  },
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('textbox');
    await userEvent.click(input);
    await userEvent.paste('0123');
    await expect(input).toHaveValue('0123');
    await userEvent.clear(input);
    await userEvent.type(input, '56');
    await expect(input).toHaveValue('56');
    await expect(
      canvasElement.querySelectorAll('[data-slot="otp-slot"]'),
    ).toHaveLength(4);
  },
};

export const SixDigits: Story = {
  args: { length: 6, defaultValue: '001234', name: 'otp' },
  play: async ({ canvasElement }) => {
    await expect(
      canvasElement.querySelectorAll('[data-slot="otp-slot"]'),
    ).toHaveLength(6);
    await expect(within(canvasElement).getByRole('textbox')).toHaveValue(
      '001234',
    );
  },
};

export const KeyboardEditing: Story = {
  args: { defaultValue: '0123' },
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('textbox');
    await userEvent.click(input);
    await userEvent.keyboard('{ArrowLeft}9');
    await expect(input).toHaveValue('0193');
    await userEvent.clear(input);
    await userEvent.paste('4567');
    await expect(input).toHaveValue('4567');
    await expect(
      Array.from(
        canvasElement.querySelectorAll('[data-slot="otp-slot"]'),
        (slot) => slot.textContent,
      ).join(''),
    ).toBe('4567');
  },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: '0123' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('textbox')).toBeDisabled();
  },
};

export const ReadOnly: Story = {
  args: { readOnly: true, defaultValue: '0123' },
};

export const Invalid: Story = {
  args: { 'aria-invalid': true, defaultValue: '0123' },
};

export const NativeFormAndRef: Story = {
  render: (args) => {
    const inputRef = createRef<HTMLInputElement>();
    return (
      <form>
        <OtpInput
          {...args}
          ref={inputRef}
          name="otp"
          defaultValue="0123"
          required
        />
        <Button onClick={() => inputRef.current?.focus()}>Focus code</Button>
      </form>
    );
  },
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole(
      'textbox',
    ) as HTMLInputElement;
    await expect(input.checkValidity()).toBe(true);
    await expect(new FormData(input.form!).get('otp')).toBe('0123');
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Focus code' }),
    );
    await expect(input).toHaveFocus();
    await userEvent.clear(input);
    await expect(input.checkValidity()).toBe(false);
  },
};
