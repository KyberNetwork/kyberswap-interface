import type { Meta, StoryObj } from '@storybook/react'

import { ButtonSecondary } from '../index'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof ButtonSecondary> = {
  title: 'Kyberswap/Shared Components/Buttons/ButtonSecondary',
  component: ButtonSecondary,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    children: { control: 'text' },
    theme: { control: 'none' },
  },
}

export default meta
type Story = StoryObj<typeof ButtonSecondary>

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const ButtonSecondaryEnable: Story = {
  args: {
    children: 'Button Secondary',
    $disabled: false,
  },
}
export const ButtonSecondaryDisable: Story = {
  args: {
    children: 'Button Secondary',
    $disabled: true,
  },
}
