import type { Meta, StoryObj } from '@storybook/react'

import { DotsLoader } from './DotsLoader'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof DotsLoader> = {
  title: 'Kyberswap/Shared Components/Loader/DotsLoader',
  component: DotsLoader,
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
type Story = StoryObj<typeof DotsLoader>

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const SmallLoader: Story = {
  args: {
    size: 8,
  },
}
export const BigLoader: Story = {
  args: {
    size: 50,
  },
}
