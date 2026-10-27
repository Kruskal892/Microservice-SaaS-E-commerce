import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tooltip, TooltipTrigger, TooltipContent } from './Tooltip';
import { Button } from '../Button';

function Example() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="secondary">Export report</Button>
      </TooltipTrigger>
      <TooltipContent>Download as a CSV file</TooltipContent>
    </Tooltip>
  );
}
const meta = {
  title: 'Overlays/Tooltip',
  component: Example,
  parameters: {
    docs: {
      description: {
        component:
          'Supplementary help on hover/focus. Add one TooltipProvider near the app root (Storybook already provides it). Never put required instructions or interactive controls in a tooltip. Disabled buttons cannot receive focus; use persistent help instead.',
      },
    },
  },
} satisfies Meta<typeof Example>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
