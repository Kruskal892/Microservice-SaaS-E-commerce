import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button } from './Button';
import { Icon } from '../../icons';

const meta = {
  title: 'Actions/Button',
  component: Button,
  args: {
    children: 'Save changes',
    onClick: fn(),
    disabled: false,
    loading: false,
    variant: 'primary',
    size: 'md',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger'],
    },
    size: { control: 'select', options: ['sm', 'md', 'lg', 'icon'] },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Native button. Defaults to type="button". Loading preserves its label and disables activation. Use type="submit" explicitly in forms. Icon-only buttons require aria-label. Hover, focus-visible, active and disabled styles are built in.',
      },
    },
  },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Hover: Story = { parameters: { pseudo: { hover: true } } };
export const FocusVisible: Story = {
  parameters: { pseudo: { focusVisible: true } },
};
export const Active: Story = { parameters: { pseudo: { active: true } } };
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button');
    await expect(button).toBeDisabled();
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};
export const Loading: Story = {
  args: { loading: true },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button');
    await expect(button).toBeDisabled();
    await expect(button).toHaveAttribute('aria-busy', 'true');
    await expect(button).toHaveAccessibleName('Save changes');
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};
export const Pressed: Story = {
  args: { 'aria-pressed': true, children: 'Bold' },
};
export const IconOnly: Story = {
  args: {
    size: 'icon',
    'aria-label': 'Search',
    children: <Icon name="SearchIcon" />,
  },
};
export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Icon name="SearchIcon" />
        Search
      </>
    ),
  },
};
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Button key={size} size={size}>
          {size}
        </Button>
      ))}
    </div>
  ),
};
export const StateMatrix: Story = {
  parameters: {
    pseudo: {
      hover: ['.state-hover'],
      focusVisible: ['.state-focus'],
      active: ['.state-active'],
    },
  },
  render: () => (
    <div className="flex flex-col gap-6">
      {(['primary', 'secondary', 'ghost', 'danger'] as const).map((variant) => (
        <div key={variant} className="flex flex-wrap items-center gap-4">
          <span className="w-24 text-sm">{variant}</span>
          <Button variant={variant}>Default</Button>
          <Button variant={variant} className="state-hover">
            Hover
          </Button>
          <Button variant={variant} className="state-focus">
            Focus
          </Button>
          <Button variant={variant} className="state-active">
            Active
          </Button>
          <Button variant={variant} disabled>
            Disabled
          </Button>
          <Button variant={variant} loading>
            Loading
          </Button>
        </div>
      ))}
    </div>
  ),
};

export const LoadingIconOnly: Story = {
  args: {
    size: 'icon',
    loading: true,
    'aria-label': 'Search',
    children: <Icon name="SearchIcon" />,
  },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', {
      name: 'Search',
    });
    await expect(button).toBeDisabled();
    await expect(button).toHaveAttribute('aria-busy', 'true');
    await expect(button.querySelector('.sr-only')).toBeInTheDocument();
  },
};
