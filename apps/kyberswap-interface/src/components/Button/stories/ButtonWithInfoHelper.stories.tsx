import type { Meta, StoryObj } from '@storybook/react'

import { ButtonWithInfoHelper } from '../index'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof ButtonWithInfoHelper> = {
  title: 'Kyberswap/Shared Components/Buttons/ButtonWithInfoHelper',
  component: ButtonWithInfoHelper,
  decorators: Component => (
    <div style={{ minWidth: '400px' }}>
      <Component />
    </div>
  ),
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    text: { control: 'text' },
    tooltipMsg: { control: 'text' },
    onClick: { control: 'function' },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
    confirmed: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof ButtonWithInfoHelper>

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const ButtonWithInfoHelperEnable: Story = {
  args: {
    text: 'ButtonWithInfoHelper',
    tooltipMsg: 'Tooltip',
    disabled: false,
    loading: false,
    confirmed: false,
  },
}
export const ButtonWithInfoHelperLoading: Story = {
  args: {
    text: 'ButtonWithInfoHelper',
    tooltipMsg: 'Tooltip',
    disabled: false,
    loading: true,
    confirmed: false,
  },
}
export const ButtonWithInfoHelperConfirmed: Story = {
  args: {
    text: 'ButtonWithInfoHelper',
    tooltipMsg: 'Tooltip',
    disabled: false,
    loading: false,
    confirmed: true,
  },
}
export const ButtonWithInfoHelperDisblaed: Story = {
  args: {
    text: 'ButtonWithInfoHelper',
    tooltipMsg: 'Tooltip',
    disabled: true,
    loading: false,
    confirmed: false,
  },
}
