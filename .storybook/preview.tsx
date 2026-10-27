import type { Preview } from '@storybook/react-vite';
import { useEffect } from 'react';
import { Direction } from 'radix-ui';
import { TooltipProvider } from '../packages/ui/common/Tooltip';
import './preview.css';

const preview: Preview = {
  tags: ['autodocs'],
  globalTypes: {
    theme: {
      description: 'Color theme',
      toolbar: { icon: 'circlehollow', items: ['light', 'dark'] },
    },
    direction: {
      description: 'Reading direction',
      toolbar: { icon: 'transfer', items: ['ltr', 'rtl'] },
    },
  },
  initialGlobals: { theme: 'light', direction: 'ltr' },
  parameters: {
    layout: 'padded',
    controls: { expanded: true },
    a11y: { test: 'todo' },
    options: {
      storySort: {
        order: [
          'Introduction',
          'Foundations',
          'Actions',
          'Forms',
          'Overlays',
          'Layout',
        ],
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme === 'dark' ? 'dark' : 'light';
      const dir = context.globals.direction === 'rtl' ? 'rtl' : 'ltr';
      useEffect(() => {
        const root = document.documentElement;
        root.dataset.theme = theme;
        root.dir = dir;
        return () => {
          delete root.dataset.theme;
          root.removeAttribute('dir');
        };
      }, [theme, dir]);
      return (
        <Direction.Provider dir={dir}>
          <TooltipProvider delayDuration={300}>
            <Story />
          </TooltipProvider>
        </Direction.Provider>
      );
    },
  ],
};

export default preview;
