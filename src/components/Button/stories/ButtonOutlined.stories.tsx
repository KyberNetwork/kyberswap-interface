import type { Meta, StoryObj } from '@storybook/react'

import { ButtonOutlined } from '../index'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof ButtonOutlined> = {
  title: 'Kyberswap/Shared Components/Buttons/ButtonOutlined',
  component: ButtonOutlined,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    children: { control: 'text' },
    color: { control: 'text' },
    theme: { control: 'none' },
  },
}

export default meta
type Story = StoryObj<typeof ButtonOutlined>

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const ButtonOutlinedEnable: Story = {
  args: {
    children: 'Button Outlined',
    color: '',
    $disabled: false,
  },
}
export const ButtonOutlinedDisable: Story = {
  args: {
    children: 'Button Outlined',
    color: '',
    $disabled: true,
  },
}
export const ButtonOutlinedCustomColor: Story = {
  args: {
    children: 'Button Outlined',
    color: '#FF537B',
    $disabled: false,
  },
}
