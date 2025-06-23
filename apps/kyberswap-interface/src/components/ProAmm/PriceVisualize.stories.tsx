import { Price, WETH } from '@kyberswap/ks-sdk-core'
import type { Meta, StoryObj } from '@storybook/react'

import { KNC } from 'constants/tokens'
import ThemeProvider from 'theme'

import PriceVisualize from './PriceVisualize'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof PriceVisualize> = {
  title: 'Kyberswap/Elastic Components/PriceVisualize',
  component: PriceVisualize,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    priceLower: { control: 'number' },
    priceUpper: { control: 'number' },
    price: { control: 'number' },
    showTooltip: { control: 'boolean' },
  },
}

export default meta

type PriceVisualizeSimple = {
  priceLower: number
  priceUpper: number
  price: number
  showTooltip?: boolean | undefined
  center?: boolean | undefined
  warning?: boolean | undefined
}
type Story = StoryObj<(props: PriceVisualizeSimple) => JSX.Element>

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const PriceVisualizeExample: Story = {
  render: props => {
    const { priceLower: priceLowerProp, priceUpper: priceUpperProp, price: priceProp } = props

    return (
      <div style={{ width: '300px' }}>
        <ThemeProvider>
          <PriceVisualize
            {...props}
            priceLower={new Price(KNC[1], WETH[1], 1000000000, String((priceLowerProp || 1) * 1000000000))}
            priceUpper={new Price(KNC[1], WETH[1], 1000000000, String((priceUpperProp || 1) * 1000000000))}
            price={new Price(KNC[1], WETH[1], 1000000000, String((priceProp || 1) * 1000000000))}
          />
        </ThemeProvider>
      </div>
    )
  },
  args: {
    priceLower: 0.9,
    priceUpper: 1.1,
    price: 1,
    showTooltip: true,
  },
}
