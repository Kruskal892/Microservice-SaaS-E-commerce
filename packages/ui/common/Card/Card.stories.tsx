import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './Card';
import { Button } from '../Button';

const meta = {
  title: 'Layout/Card',
  component: Card,
  render: (args) => (
    <Card {...args} className="max-w-lg">
      <CardHeader>
        <CardTitle>Workspace</CardTitle>
        <CardDescription>Manage your team preferences.</CardDescription>
      </CardHeader>
      <CardContent>
        Compose any content here; the card does not fetch data or add click
        behavior.
      </CardContent>
      <CardFooter>
        <Button variant="secondary">Cancel</Button>
        <Button>Save changes</Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        component:
          'Composable surface with header/content/footer. CardTitle is h2; choose the correct heading hierarchy for the page. A card is not a clickable control.',
      },
    },
  },
} satisfies Meta<typeof Card>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
