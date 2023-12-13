import type { Meta, StoryObj } from '@storybook/react'

import { ButtonError } from '../index'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof ButtonError> = {
  title: 'Kyberswap/Shared Components/Buttons/ButtonError',
  component: ButtonError,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    children: { control: 'text' },
    error: { control: 'boolean' },
    warning: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof ButtonError>

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const ButtonErrorEnable: Story = {
  args: {
    children: 'Button Error',
    error: false,
    warning: false,
    disabled: false,
  },
}
export const ButtonErrorWarning: Story = {
  args: {
    children: 'Button Error',
    error: false,
    warning: true,
    disabled: false,
  },
}
export const ButtonErrorError: Story = {
  args: {
    children: 'Button Error',
    error: true,
    warning: false,
    disabled: false,
  },
}
