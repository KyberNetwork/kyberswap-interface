import type { Meta, StoryObj } from '@storybook/react'
import { Text } from 'rebass'

import Copy from './index'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof Copy> = {
  title: 'Kyberswap/Shared Components/Copy',
  component: Copy,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    toCopy: { control: 'text', description: 'Text to copy' },
    margin: { control: 'text', description: 'Margin in pixel' },
    style: { control: 'json', description: 'Custom style' },
    size: { control: 'number', description: 'Icon size in pixel' },
    text: { control: 'text', description: 'Display text' },
    color: { control: 'text', description: 'Custom copy color' },
  },
}

export default meta
type Story = StoryObj<typeof Copy>

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const AddressCopy: Story = {
  args: {
    toCopy: 'https://etherscan.io/address/0x0000000000000000000000000000000000000000',
    margin: '',
    size: '',
    text: '0x0000000000000000000000000000000000000000',
    color: 'red',
  },
}
export const StyledText: Story = {
  args: {
    toCopy: 'https://etherscan.io/address/0x0000000000000000000000000000000000000000',
    margin: '',
    size: '',
    text: (
      <Text fontSize={16} fontWeight={500} lineHeight="20px" color="#A9A9A9">
        0x0000000000000000000000000000000000000000
      </Text>
    ),
    color: '#A9A9A9',
  },
}
