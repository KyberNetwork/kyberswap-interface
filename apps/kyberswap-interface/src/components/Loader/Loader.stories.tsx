import type { Meta, StoryObj } from '@storybook/react'

import LoaderComponent from './index'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof LoaderComponent> = {
  title: 'Kyberswap/Shared Components/Loader/Loader',
  component: LoaderComponent,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    size: { control: 'text' },
    stroke: { control: 'text' },
    strokeWidth: { control: 'text' },
  },
}

export default meta
type Story = StoryObj<typeof LoaderComponent>

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const ThinLoader: Story = {
  args: {
    size: '20px',
    stroke: '#FF9901',
    strokeWidth: '2',
  },
}
export const BigLoader: Story = {
  args: {
    size: '100px',
    stroke: '#31CB9E',
    strokeWidth: '5',
  },
}
