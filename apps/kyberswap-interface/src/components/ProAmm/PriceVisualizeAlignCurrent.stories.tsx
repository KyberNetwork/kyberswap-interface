import { Price, WETH } from '@kyberswap/ks-sdk-core'
import type { Meta, StoryObj } from '@storybook/react'

import { KNC } from 'constants/tokens'
import { Bound } from 'state/mint/proamm/type'
import ThemeProvider from 'theme'

import PriceVisualizeAlignCurrent from './PriceVisualizeAlignCurrent'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof PriceVisualizeAlignCurrent> = {
  title: 'Kyberswap/Elastic Components/PriceVisualizeAlignCurrent',
  component: PriceVisualizeAlignCurrent,
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
  },
}

export default meta

type PriceVisualizeAlignCurrentSimple = {
  priceLower: number
  priceUpper: number
  price: number
  center?: boolean
}
type Story = StoryObj<(props: PriceVisualizeAlignCurrentSimple) => JSX.Element>

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const PriceVisualizeAlignCurrentExample: Story = {
  render: props => {
    const { priceLower: priceLowerProp, priceUpper: priceUpperProp, price: priceProp } = props

    return (
      <div style={{ width: '300px' }}>
        <ThemeProvider>
          <PriceVisualizeAlignCurrent
            {...props}
            priceLower={new Price(WETH[1], KNC[1], 1000000000, ((priceLowerProp || 1) * 1000000000).toFixed(0))}
            priceUpper={new Price(WETH[1], KNC[1], 1000000000, ((priceUpperProp || 1) * 1000000000).toFixed(0))}
            price={new Price(WETH[1], KNC[1], 1000000000, ((priceProp || 1) * 1000000000).toFixed(0))}
          />
        </ThemeProvider>
      </div>
    )
  },
  args: {
    priceLower: 0.9,
    priceUpper: 1.1,
    price: 1,
    center: true,
  },
}
export const PriceVisualizeAlignCurrentZero: Story = {
  render: props => {
    const { priceLower: priceLowerProp, priceUpper: priceUpperProp, price: priceProp } = props

    return (
      <div style={{ width: '300px' }}>
        <ThemeProvider>
          <PriceVisualizeAlignCurrent
            {...props}
            priceLower={new Price(WETH[1], KNC[1], 1000000000, ((priceLowerProp || 1) * 1000000000).toFixed(0))}
            priceUpper={new Price(WETH[1], KNC[1], 1000000000, ((priceUpperProp || 1) * 1000000000).toFixed(0))}
            price={new Price(WETH[1], KNC[1], 1000000000, ((priceProp || 1) * 1000000000).toFixed(0))}
            ticksAtLimit={{
              [Bound.LOWER]: true,
              [Bound.UPPER]: undefined,
            }}
          />
        </ThemeProvider>
      </div>
    )
  },
  args: {
    priceUpper: 1.1,
    price: 1,
    center: true,
  },
}
export const PriceVisualizeAlignCurrentInfinity: Story = {
  render: props => {
    const { priceLower: priceLowerProp, priceUpper: priceUpperProp, price: priceProp } = props

    return (
      <div style={{ width: '300px' }}>
        <ThemeProvider>
          <PriceVisualizeAlignCurrent
            {...props}
            priceLower={new Price(WETH[1], KNC[1], 1000000000, ((priceLowerProp || 1) * 1000000000).toFixed(0))}
            priceUpper={new Price(WETH[1], KNC[1], 1000000000, ((priceUpperProp || 1) * 1000000000).toFixed(0))}
            price={new Price(WETH[1], KNC[1], 1000000000, ((priceProp || 1) * 1000000000).toFixed(0))}
            ticksAtLimit={{
              [Bound.LOWER]: undefined,
              [Bound.UPPER]: true,
            }}
          />
        </ThemeProvider>
      </div>
    )
  },
  args: {
    priceLower: 0.5,
    price: 1,
    center: true,
  },
}
export const PriceVisualizeAlignCurrentFullRange: Story = {
  render: props => {
    const { priceLower: priceLowerProp, priceUpper: priceUpperProp, price: priceProp } = props

    return (
      <div style={{ width: '300px' }}>
        <ThemeProvider>
          <PriceVisualizeAlignCurrent
            {...props}
            priceLower={new Price(WETH[1], KNC[1], 1000000000, ((priceLowerProp || 1) * 1000000000).toFixed(0))}
            priceUpper={new Price(WETH[1], KNC[1], 1000000000, ((priceUpperProp || 1) * 1000000000).toFixed(0))}
            price={new Price(WETH[1], KNC[1], 1000000000, ((priceProp || 1) * 1000000000).toFixed(0))}
            ticksAtLimit={{
              [Bound.LOWER]: true,
              [Bound.UPPER]: true,
            }}
          />
        </ThemeProvider>
      </div>
    )
  },
  args: {
    priceLower: 0.5,
    price: 1,
    center: true,
  },
}
