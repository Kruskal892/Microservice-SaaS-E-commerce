import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within, waitFor } from 'storybook/test';
import {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalClose,
} from './Modal';
import { Button } from '../Button';
import { Field, Label } from '../Field';
import { Input } from '../Input';

function Example({ controlled = false }: { controlled?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <Modal {...(controlled ? { open, onOpenChange: setOpen } : {})}>
      <ModalTrigger asChild>
        <Button>Edit profile</Button>
      </ModalTrigger>
      <ModalContent>
        <ModalTitle>Edit profile</ModalTitle>
        <ModalDescription>
          Update your display name. This example does not persist data.
        </ModalDescription>
        <Field>
          <Label htmlFor="display-name">Display name</Label>
          <Input id="display-name" defaultValue="Alex" />
        </Field>
        <ModalFooter>
          <ModalClose asChild>
            <Button variant="secondary">Cancel</Button>
          </ModalClose>
          <ModalClose asChild>
            <Button>Save changes</Button>
          </ModalClose>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
const meta = {
  title: 'Overlays/Modal',
  component: Example,
  parameters: {
    docs: {
      description: {
        component:
          'Radix Dialog composition. Supply ModalTitle, ModalDescription and a visible ModalClose action. Focus trapping, Escape and focus restoration belong to Radix. Use controlled state for async submit; only close after success. Not an irreversible-action confirmation dialog.',
      },
    },
  },
} satisfies Meta<typeof Example>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Controlled: Story = { args: { controlled: true } };
export const KeyboardAndFocus: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Edit profile' });
    await userEvent.click(trigger);
    const dialog = await body.findByRole('dialog', { name: 'Edit profile' });
    await expect(
      within(dialog).getByRole('textbox', { name: 'Display name' }),
    ).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(body.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    await expect(trigger).toHaveFocus();
  },
};
