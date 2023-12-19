import type { Meta, StoryObj } from '@storybook/react'

import { ButtonConfirmed } from '../index'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof ButtonConfirmed> = {
  title: 'Kyberswap/Shared Components/Buttons/ButtonConfirmed',
  component: ButtonConfirmed,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    children: { control: 'text' },
    confirmed: { control: 'boolean' },
    altDisabledStyle: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof ButtonConfirmed>

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const ButtonConfirmedEnable: Story = {
  args: {
    children: 'Button Comfirmed',
    confirmed: false,
    altDisabledStyle: false,
  },
}
export const ButtonConfirmedAlready: Story = {
  args: {
    children: 'Button Comfirmed',
    confirmed: true,
    altDisabledStyle: false,
  },
}
