// @vitest-environment happy-dom
import { CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { act, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'

import { VirtualRow, VirtualRowData } from './VirtualTokenRow'

const mocks = vi.hoisted(() => ({ renders: vi.fn(), mount: vi.fn(), unmount: vi.fn() }))
vi.mock('framer-motion', () => ({
  motion: { div: ({ children }: { children: React.ReactNode }) => <div>{children}</div> },
}))
vi.mock('hooks/useERC8056Token', () => ({
  useERC8056TokenInfo: () => undefined,
  useERC8056DisplayBalance: () => undefined,
}))
vi.mock('hooks/useRestrictedTokens', () => ({
  restrictedTokenKey: (chain: number, address: string) => `${chain}-${address}`,
}))
vi.mock('components/TokenSelectorModal/utils', () => ({
  getNeedsImport: (currency: Token, imported: (address: string) => boolean) => !imported(currency.address),
  isSameCurrency: (a?: Token, b?: Token) => !!a && !!b && a.equals(b),
}))
vi.mock('components/TokenSelectorModal/components', () => ({ Balance: () => null }))
vi.mock('components/TokenSelectorModal/TokenList/TokenRow', () => ({
  TokenRow: (props: {
    currencyBalance?: CurrencyAmount<Token>
    onSelect?: (token: Token) => void
    currency: Token
  }) => {
    mocks.renders(props)
    useEffect(() => {
      mocks.mount()
      return mocks.unmount
    }, [])
    return <button onClick={() => props.onSelect?.(props.currency)}>{props.currencyBalance?.toExact()}</button>
  },
}))
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const token = new Token(1, '0x0000000000000000000000000000000000000001', 6, 'AAA')
const key = `1-${token.address}`
const amount = CurrencyAmount.fromRawAmount(token, '1000000')
const style = { top: 0, height: 56 }
let root: ReturnType<typeof createRoot> | undefined
let container: HTMLDivElement
const render = async (data: VirtualRowData) => {
  if (!root) {
    container = document.createElement('div')
    root = createRoot(container)
  }
  await act(async () => root?.render(<VirtualRow index={0} style={style} data={data} />))
}
const rowData = (): VirtualRowData => ({
  currencies: [token],
  currencyBalances: [amount],
  itemStyle: {},
  importedAddressSet: new Set([key]),
  favoriteAddressSet: new Set([key]),
  tokenPrices: { [token.address]: 10 },
  warnedKeys: new Set(),
  isTokenRestricted: () => false,
  onWarnRestricted: vi.fn(),
  onCurrencySelect: vi.fn(),
  waitingForBalances: false,
  account: 'wallet',
  animateReorder: true,
})
afterEach(async () => {
  await act(async () => root?.unmount())
  root = undefined
  vi.clearAllMocks()
})

it('resets row identity across single-chain and All Networks views while preserving selection', async () => {
  const data = rowData()
  await render(data)
  const button = container.querySelector('button')
  await render({
    ...data,
    allNetworks: true,
    aggregateBalances: { [key]: { balance: amount, price: 10, waiting: false } },
  })
  const aggregateButton = container.querySelector('button')
  expect(aggregateButton).not.toBe(button)
  expect(mocks.mount).toHaveBeenCalledTimes(2)
  expect(mocks.unmount).toHaveBeenCalledTimes(1)
  expect(mocks.renders.mock.lastCall?.[0]).toMatchObject({ isFavorite: true, canFavorite: true, usdBalance: 10 })
  await act(async () => aggregateButton?.click())
  expect(data.onCurrencySelect).toHaveBeenCalledWith(token)
  await render(data)
  expect(container.querySelector('button')).not.toBe(aggregateButton)
  expect(mocks.mount).toHaveBeenCalledTimes(3)
  expect(mocks.unmount).toHaveBeenCalledTimes(2)
  await act(async () => container.querySelector('button')?.click())
  expect(data.onCurrencySelect).toHaveBeenCalledTimes(2)
})

it('skips unchanged rows when another holding updates but renders its own new balance', async () => {
  const data = rowData()
  const balances = { [key]: { balance: amount, price: 10, waiting: false } }
  await render({ ...data, allNetworks: true, aggregateBalances: balances })
  const button = container.querySelector('button')
  const renders = mocks.renders.mock.calls.length
  await render({ ...data, allNetworks: true, aggregateBalances: { ...balances, other: { price: 50, waiting: false } } })
  expect(mocks.renders).toHaveBeenCalledTimes(renders)
  await render({
    ...data,
    allNetworks: true,
    aggregateBalances: {
      [key]: { balance: CurrencyAmount.fromRawAmount(token, '2000000'), price: 10, waiting: false },
    },
  })
  expect(mocks.renders).toHaveBeenCalledTimes(renders + 1)
  expect(container.querySelector('button')).toBe(button)
  expect(mocks.unmount).not.toHaveBeenCalled()
  expect(container.textContent).toBe('2')
})
