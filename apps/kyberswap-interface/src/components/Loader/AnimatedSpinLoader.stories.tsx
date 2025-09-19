import type { Meta, StoryObj } from '@storybook/react'

import AnimatedSpinLoader from './AnimatedSpinLoader'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof AnimatedSpinLoader> = {
  title: 'Kyberswap/Shared Components/Loader/AnimatedSpinLoader',
  component: AnimatedSpinLoader,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    size: { control: 'number' },
  },
}

export default meta
type Story = StoryObj<typeof AnimatedSpinLoader>

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const SmallLoader: Story = {
  args: {
    size: 20,
  },
}
export const BigLoader: Story = {
  args: {
    size: 100,
  },
}
