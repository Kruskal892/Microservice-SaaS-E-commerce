import type { StorybookConfig } from '@storybook/react-vite';
import { fileURLToPath } from 'node:url';
import { mergeConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import svgr from 'vite-plugin-svgr';

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../packages/ui/**/*.stories.tsx'],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    'storybook-addon-pseudo-states',
  ],
  core: { disableTelemetry: true },
  async viteFinal(config) {
    return mergeConfig(config, {
      resolve: {
        alias: {
          '@packages': fileURLToPath(new URL('../packages', import.meta.url)),
        },
        dedupe: ['react', 'react-dom'],
      },
      plugins: [tailwindcss(), svgr({ include: '**/*.svg' })],
    });
  },
};

export default config;
