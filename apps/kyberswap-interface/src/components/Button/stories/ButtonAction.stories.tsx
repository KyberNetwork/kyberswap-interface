import type { Meta, StoryObj } from '@storybook/react'
import { X } from 'react-feather'
import { Flex } from 'rebass'

import { ButtonAction } from '../index'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof ButtonAction> = {
  title: 'Kyberswap/Shared Components/Buttons/ButtonAction',
  component: ButtonAction,
  decorators: Component => (
    <Flex style={{ minWidth: '400px' }} flexShrink={0}>
      <Component />
    </Flex>
  ),
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    children: { control: 'component' },
    color: { control: 'text' },
  },
}

export default meta
type Story = StoryObj<typeof ButtonAction>

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const ButtonActionExample: Story = {
  args: {
    children: <X size={16} color="#FF537B" strokeWidth="3px" />,
    color: '#31CB9E',
  },
}
