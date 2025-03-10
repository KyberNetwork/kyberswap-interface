import type { Meta, StoryObj } from '@storybook/react'

import { ButtonLight } from '../index'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof ButtonLight> = {
  title: 'Kyberswap/Shared Components/Buttons/ButtonLight',
  component: ButtonLight,
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
    fontSize: { control: 'number' },
    theme: { control: 'none' },
  },
}

export default meta
type Story = StoryObj<typeof ButtonLight>

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const ButtonLightEnable: Story = {
  args: {
    children: 'Button Light',
    color: '',
    fontSize: 14,
    $disabled: false,
  },
}
export const ButtonLightDisable: Story = {
  args: {
    children: 'Button Light',
    color: '',
    fontSize: 14,
    $disabled: true,
  },
}
export const ButtonLightCustomColor: Story = {
  args: {
    children: 'Button Light',
    color: '#FF537B',
    fontSize: 20,
    $disabled: true,
  },
}
