import type { Meta, StoryObj } from '@storybook/react-vite';
import { Field, Label, FieldDescription, FieldError } from './Field';
import { Input } from '../Input';

const meta = {
  title: 'Forms/Field',
  component: Field,
  parameters: {
    docs: {
      description: {
        component:
          'Composable label/help/error layout with explicit native relationships. Set htmlFor/id and aria-describedby yourself; no cloneElement, context or form-library dependency. Use a fieldset/legend for groups.',
      },
    },
  },
} satisfies Meta<typeof Field>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  render: () => (
    <Field>
      <Label htmlFor="field-email">Email</Label>
      <Input id="field-email" type="email" aria-describedby="field-help" />
      <FieldDescription id="field-help">
        We only use this for account updates.
      </FieldDescription>
    </Field>
  ),
};
export const Invalid: Story = {
  render: () => (
    <Field>
      <Label htmlFor="invalid-email">Email</Label>
      <Input
        id="invalid-email"
        type="email"
        aria-invalid="true"
        aria-describedby="invalid-help invalid-error"
        defaultValue="invalid"
      />
      <FieldDescription id="invalid-help">
        Use your work address.
      </FieldDescription>
      <FieldError id="invalid-error">Enter a valid email address.</FieldError>
    </Field>
  ),
};
