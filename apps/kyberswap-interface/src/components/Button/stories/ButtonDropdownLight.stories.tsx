import type { Meta, StoryObj } from '@storybook/react'

import { ButtonDropdownLight } from '../index'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof ButtonDropdownLight> = {
  title: 'Kyberswap/Shared Components/Buttons/ButtonDropdownLight',
  component: ButtonDropdownLight,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    children: { control: 'text' },
    disabled: { control: 'boolean' },
    onClick: { control: 'function' },
  },
}

export default meta
type Story = StoryObj<typeof ButtonDropdownLight>

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const ButtonDropdownLightEnable: Story = {
  args: {
    children: 'Button Dropdown Light',
    disabled: false,
  },
}
export const ButtonDropdownLightDisable: Story = {
  args: {
    children: 'Button Dropdown Light',
    disabled: true,
  },
}
