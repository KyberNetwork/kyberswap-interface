import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import ThemeProvider from 'theme'

import Search from './index'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof Search> = {
  title: 'Kyberswap/Shared Components/Search',
  component: Search,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    searchValue: { control: 'text', description: 'Controlled Search value' },
    onSearch: { type: 'function' },
    allowClear: { control: 'boolean' },
    minWidth: { control: 'text', description: 'Container min-width' },
    style: { control: 'json' },
  },
}

export default meta
type Story = StoryObj<typeof Search>

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Input: Story = {
  render: props => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [searchValue, setSearchValue] = useState('')
    return (
      <ThemeProvider>
        <Search {...props} onSearch={setSearchValue} searchValue={props.searchValue || searchValue} />
      </ThemeProvider>
    )
  },
  args: {
    allowClear: true,
  },
}
