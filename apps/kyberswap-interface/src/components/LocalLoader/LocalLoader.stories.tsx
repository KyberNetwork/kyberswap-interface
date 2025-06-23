import type { Meta, StoryObj } from '@storybook/react'

import LocalLoader from './index'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof LocalLoader> = {
  title: 'Kyberswap/Shared Components/Loader/LocalLoader',
  component: LocalLoader,
  decorators: Component => (
    <div style={{ border: '1px solid #FF9901' }}>
      <Component />
    </div>
  ),
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    fill: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof LocalLoader>

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const LoaderFit: Story = {
  args: {
    fill: false,
  },
}

export const LoaderFill: Story = {
  args: {
    fill: true,
  },
}
