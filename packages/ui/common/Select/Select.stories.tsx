import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
} from './Select';
import { Field, Label } from '../Field';

function Example({ disabled = false, invalid = false, controlled = false }) {
  const [value, setValue] = useState('');
  return (
    <Field>
      <Label htmlFor="language">Language</Label>
      <Select
        name="language"
        disabled={disabled}
        {...(controlled ? { value, onValueChange: setValue } : {})}
      >
        <SelectTrigger id="language" aria-invalid={invalid || undefined}>
          <SelectValue placeholder="Choose language" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Available languages</SelectLabel>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="vi">Vietnamese</SelectItem>
            <SelectItem value="fr" disabled>
              French (unavailable)
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  );
}
const meta = {
  title: 'Forms/Select',
  component: Example,
  parameters: {
    docs: {
      description: {
        component:
          'Single value selection with keyboard/typeahead support. Root accepts name, required, value/defaultValue and onValueChange. Item values must be non-empty strings. Use a native select for native mobile pickers or multiple selection.',
      },
    },
  },
} satisfies Meta<typeof Example>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
export const Invalid: Story = { args: { invalid: true } };
export const Controlled: Story = { args: { controlled: true } };
export const KeyboardSelection: Story = {
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('combobox', {
      name: 'Language',
    });
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    const body = within(canvasElement.ownerDocument.body);
    await expect(
      await body.findByRole('option', { name: 'English' }),
    ).toBeVisible();
    await userEvent.keyboard('{Home}{Enter}');
    await expect(trigger).toHaveTextContent('English');
  },
};
