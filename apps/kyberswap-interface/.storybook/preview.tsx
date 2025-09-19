import type { Preview } from '@storybook/react'
import React from 'react'

import ThemeProvider from '../src/theme'

const preview: Preview = {
  decorators: [
    Component => (
      <ThemeProvider>
        <Component />
      </ThemeProvider>
    ),
  ],
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      values: [
        { name: 'tabBackground', value: '#0F0F0F' },
        { name: 'background', value: '#1C1C1C' },
        { name: 'tableHeader', value: '#313131' },
        { name: 'black', value: '#000000' },
      ],
    },
  },
}

export default preview
