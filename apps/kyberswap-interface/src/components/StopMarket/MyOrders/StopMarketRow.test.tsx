import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { setupI18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { StopMarket, StopMarketExecutionStatus, StopMarketStatus, StopMarketTokenInfo } from '../types'
import StopMarketRow from './StopMarketRow'

vi.mock('components/StopMarket/hooks/useStopMarketCurrency', () => ({
  useStopMarketCurrency: (info: StopMarketTokenInfo, chainId: ChainId) =>
    new Token(chainId, info.address, info.decimals, info.symbol),
}))
vi.mock('state/tokenPrices/hooks', () => ({ useTokenPricesWithLoading: () => ({ data: {}, loading: false }) }))
vi.mock('components/CurrencyLogo', () => ({ default: () => null }))
vi.mock('components/Tooltip', () => ({ MouseoverTooltip: ({ children }: { children: ReactNode }) => children }))

const order: StopMarket = {
  id: 1,
  chainId: ChainId.BASE,
  status: StopMarketStatus.CANCELLED,
  userWallet: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
  receiver: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
  tokenIn: '0x4200000000000000000000000000000000000006',
  tokenOut: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
  amountIn: '100000000000000000',
  tokenInInfo: { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', decimals: 18 },
  tokenOutInfo: { address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', symbol: 'USDC', decimals: 6 },
  slippage: 50,
  condition: { field: { type: 'oracle_price', value: { lte: '2400' } } },
  deadline: 1_900_000_000,
  hash: 'order-hash',
  signature: '',
  protocolFeePercentage: 0.15,
  category: 'commonPair',
  maxFeesPercentage: [1, 1],
  maxGasPercentage: 50,
  source: '',
  createdAt: 1_800_000_000,
}

const renderRow = (overrides: Partial<StopMarket>, isActiveTab = false) =>
  renderToStaticMarkup(
    <I18nProvider i18n={setupI18n({ locale: 'en', messages: { en: {} } })}>
      <StopMarketRow
        order={{ ...order, ...overrides }}
        isActiveTab={isActiveTab}
        isCancelling={false}
        onCancel={vi.fn()}
        onEdit={vi.fn()}
        onSelectPair={vi.fn()}
        onRecreate={vi.fn()}
      />
    </I18nProvider>,
  )

const sellAmountText = (overrides: Partial<StopMarket>, isActiveTab = false) => {
  const html = renderRow(overrides, isActiveTab)
  // Read the entire amount cell, including its nested coloured amount.
  const cell = html.match(/data-testid="stop-market-order-sell-amount">((?:<span[^>]*>.*?<\/span>)?.*?)<\/span>/)?.[1]
  return cell?.replace(/<[^>]*>/g, '')
}

describe('Stop Market sell amount', () => {
  it('shows zero sold when there are no fills', () => {
    expect(sellAmountText({})).toBe('0/0.1 WETH')
  })

  it('does not assume Done means fully filled before settlement details arrive', () => {
    expect(sellAmountText({ status: StopMarketStatus.DONE })).toBe('-/0.1 WETH')
  })

  it('shows only the total in active orders', () => {
    expect(sellAmountText({ status: StopMarketStatus.OPEN, filledAmountIn: '0' }, true)).toBe('0.1 WETH')
  })

  it.each([
    ['0', '0/0.1 WETH'],
    ['40000000000000000', '0.04/0.1 WETH'],
    ['100000000000000000', '0.1 WETH'],
  ])('uses the API filled total %s before settlement details arrive', (filledAmountIn, expected) => {
    expect(sellAmountText({ status: StopMarketStatus.DONE, filledAmountIn })).toBe(expected)
  })

  it('renders order 254 as partially filled despite its Done status', () => {
    const partialOrder: Partial<StopMarket> = {
      id: 254,
      chainId: ChainId.BSCMAINNET,
      status: StopMarketStatus.DONE,
      amountIn: '6000000000000000000',
      filledAmountIn: '5004441711139722231',
      tokenInInfo: { address: '0x40af3827f39d0eacbf4a168f8d4ee67c121d11c9', symbol: 'TUSD', decimals: 18 },
      executions: [
        {
          hash: '0x8055b527b58a366407826bfd609fb11bae5b556e50e1578a65d2d608d63116f3',
          executionNum: 0,
          operatorWallet: order.userWallet,
          status: StopMarketExecutionStatus.SUCCESS,
          extraData: {
            oraclePrice: '0.999588698591291924',
            amountIn: { amount: '5.004441711139722231' },
            received: { amount: '4.817294766387274429' },
          },
        },
      ],
    }
    expect(sellAmountText(partialOrder)).toBe('5.00444/6 TUSD')
    expect(renderRow(partialOrder)).toContain('data-partial="true"')
    expect(sellAmountText({ ...partialOrder, filledAmountIn: undefined })).toBe('5.00444/6 TUSD')
    expect(sellAmountText({ ...partialOrder, filledAmountIn: '5500000000000000000' })).toBe('5.5/6 TUSD')
  })

  it.each([
    [undefined, '-/0.1 WETH'],
    ['0.04', '0.04/0.1 WETH'],
    ['0.1', '0.1 WETH'],
  ])('renders a successful fill with amount %s', (amount, expected) => {
    expect(
      sellAmountText({
        status: StopMarketStatus.DONE,
        executions: [
          {
            hash: '0xabc',
            executionNum: 0,
            operatorWallet: order.userWallet,
            status: StopMarketExecutionStatus.SUCCESS,
            extraData: { amountIn: { amount } },
          },
        ],
      }),
    ).toBe(expected)
  })
})
