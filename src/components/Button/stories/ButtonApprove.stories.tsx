import type { Meta, StoryObj } from '@storybook/react'

import { ApprovalState } from 'hooks/useApproveCallback'

import { ButtonApprove } from '../index'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof ButtonApprove> = {
  title: 'Kyberswap/Shared Components/Buttons/ButtonApprove',
  component: ButtonApprove,
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
    tooltipMsg: { control: 'text' },
    tokenSymbol: { control: 'text' },
    approval: { control: 'text' },
    approveCallback: { control: 'none' },
    disabled: { control: 'boolean' },
    forceApprove: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof ButtonApprove>

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const ButtonButtonApproveNotApproved: Story = {
  args: {
    tooltipMsg: 'tooltip',
    tokenSymbol: 'ETH',
    approval: ApprovalState.NOT_APPROVED,
    disabled: false,
    forceApprove: false,
  },
}

export const ButtonButtonApproveUnknown: Story = {
  args: {
    tooltipMsg: 'tooltip',
    tokenSymbol: 'ETH',
    approval: ApprovalState.UNKNOWN,
    disabled: false,
    forceApprove: false,
  },
}

export const ButtonButtonApprovePending: Story = {
  args: {
    tooltipMsg: 'tooltip',
    tokenSymbol: 'ETH',
    approval: ApprovalState.PENDING,
    disabled: false,
    forceApprove: false,
  },
}

export const ButtonButtonApproveApproved: Story = {
  args: {
    tooltipMsg: 'tooltip',
    tokenSymbol: 'ETH',
    approval: ApprovalState.APPROVED,
    disabled: false,
    forceApprove: false,
  },
}
