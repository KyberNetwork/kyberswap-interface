import type { Meta, StoryObj } from '@storybook/react'

import { ButtonGray } from '../index'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof ButtonGray> = {
  title: 'Kyberswap/Shared Components/Buttons/ButtonGray',
  component: ButtonGray,
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
type Story = StoryObj<typeof ButtonGray>

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const ButtonGrayEnable: Story = {
  args: {
    children: 'Button Gray',
    $disabled: false,
  },
}
export const ButtonGrayDisable: Story = {
  args: {
    children: 'Button Gray',
    $disabled: true,
  },
}
