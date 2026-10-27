import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon } from './Icon';
import * as icons from '../../assets/icons';

const meta = {
  title: 'Foundations/Icon',
  component: Icon,
  args: { name: 'SearchIcon' },
  argTypes: { name: { control: 'select', options: Object.keys(icons) } },
  parameters: {
    docs: {
      description: {
        component:
          'Typed asset registry, decorative by default. Label the surrounding control. Profile/heart/cart currently hardcode black; text-color overrides cannot recolor those SVGs.',
      },
    },
  },
} satisfies Meta<typeof Icon>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Gallery: Story = {
  render: () => (
    <div className="flex flex-wrap gap-6">
      {(Object.keys(icons) as (keyof typeof icons)[]).map((name) => (
        <div className="flex flex-col items-center gap-2" key={name}>
          <Icon name={name} className="size-8" />
          <span className="text-xs">{name}</span>
        </div>
      ))}
    </div>
  ),
};
