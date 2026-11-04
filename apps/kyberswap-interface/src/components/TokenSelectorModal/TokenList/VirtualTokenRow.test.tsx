import { ChainId, Currency, Token, TokenAmount } from '@kyberswap/ks-sdk-core'
import { ReactNode, createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, expect, it, vi } from 'vitest'

import { tokenRowKey } from 'components/TokenSelectorModal/types'

import { VirtualRow, VirtualRowData } from './VirtualTokenRow'

const mocks = vi.hoisted(() => ({
  prices: vi.fn(),
  row: vi.fn(),
  balances: vi.fn(),
  inventory: vi.fn(),
  imports: vi.fn(),
  favorites: vi.fn(),
}))
vi.mock('framer-motion', () => ({ motion: { div: ({ children }: { children: ReactNode }) => <div>{children}</div> } }))
vi.mock('components/TokenSelectorModal/TokenList/TokenRow', () => ({ TokenRow: mocks.row }))
vi.mock('components/TokenSelectorModal/components', () => ({ Balance: () => null }))
vi.mock('hooks', () => ({ useActiveWeb3React: () => ({ account: 'wallet' }) }))
vi.mock('hooks/useBalanceWait', () => ({ useBalanceWait: () => false }))
vi.mock('hooks/useERC8056Token', () => ({
  useERC8056DisplayBalance: () => undefined,
  useERC8056TokenInfo: () => undefined,
}))
vi.mock('hooks/useRestrictedTokens', () => ({
  restrictedTokenKey: (chain: number, address: string) => `${chain}-${address}`,
}))
vi.mock('state/tokenPrices/hooks', () => ({ useTokenPrices: mocks.prices }))
vi.mock('state/user/hooks', () => ({
  useUserAddedTokens: mocks.imports,
  useUserFavoriteTokens: mocks.favorites,
}))
vi.mock('state/wallet/hooks', () => ({ useNativeBalance: () => undefined, useTokenBalances: mocks.balances }))
vi.mock('state/walletInventory/hooks', () => ({
  useWalletInventory: mocks.inventory,
  useInventoryTokenBalances: () => ({}),
}))
vi.mock('components/TokenSelectorModal/utils', () => ({
  isSameCurrency: (a: Currency | undefined, b: Currency) => a?.equals(b) ?? false,
  getNeedsImport: (token: Token, isImported: (address: string) => boolean, canImport: boolean) =>
    canImport && !isImported(token.address),
}))

const eth = new Token(ChainId.MAINNET, '0x0000000000000000000000000000000000000001', 18, 'TOKEN')
const bnb = new Token(ChainId.BSCMAINNET, eth.address, 18, 'TOKEN')
const data: VirtualRowData = {
  allNetworks: true,
  aggregateBalances: {
    [tokenRowKey(eth.chainId, eth.address)]: { balance: TokenAmount.fromRawAmount(eth, '10'), waiting: false },
    [tokenRowKey(bnb.chainId, bnb.address)]: { balance: TokenAmount.fromRawAmount(bnb, '20'), waiting: false },
  },
  currencies: [eth, bnb],
  currencyBalances: [TokenAmount.fromRawAmount(eth, '999')],
  itemStyle: {},
  importedAddressSet: new Set([eth.address]),
  favoriteAddressSet: new Set([eth.address.toLowerCase()]),
  tokenPrices: {},
  isTokenRestricted: () => false,
  warnedKeys: new Set(),
  onWarnRestricted: vi.fn(),
  onImportToken: vi.fn(),
  onRemoveImportedToken: vi.fn(),
  onToggleFavorite: vi.fn(),
  onCurrencySelect: vi.fn(),
  account: 'wallet',
}
const render = (index: number) => renderToStaticMarkup(createElement(VirtualRow, { index, style: {}, data }))

beforeEach(() => {
  vi.clearAllMocks()
  mocks.row.mockReturnValue(null)
  mocks.prices.mockReturnValue({ [eth.address]: 2 })
  mocks.inventory.mockReturnValue({ active: false, rows: {} })
  mocks.balances.mockImplementation((_tokens, chainId) => ({
    [eth.address]: TokenAmount.fromRawAmount(chainId === 1 ? eth : bnb, chainId === 1 ? '10' : '20'),
  }))
  mocks.imports.mockImplementation(chainId => (chainId === 1 ? [eth] : []))
  mocks.favorites.mockImplementation(chainId => ({
    favoriteTokens: chainId === 1 ? [eth.address.toLowerCase()] : [],
  }))
})

it('renders controller balances with chain-specific import and favorite membership', () => {
  render(0)
  expect(mocks.row.mock.lastCall?.[0]).toMatchObject({ isFavorite: true, rightColumn: 'balance', showNetwork: true })
  expect(mocks.row.mock.lastCall?.[0].currencyBalance.quotient.toString()).toBe('10')
  render(1)
  expect(mocks.inventory).not.toHaveBeenCalled()
  expect(mocks.balances).not.toHaveBeenCalled()
  expect(mocks.prices).not.toHaveBeenCalled()
  expect(mocks.row.mock.lastCall?.[0]).toMatchObject({ isFavorite: false, rightColumn: 'import' })
  expect(mocks.row.mock.lastCall?.[0].currencyBalance.quotient.toString()).toBe('20')
})

it('uses controller-provided held matches and preserves chain identity and import affordance', () => {
  const aggregateBalances = {
    [tokenRowKey(bnb.chainId, bnb.address)]: {
      balance: TokenAmount.fromRawAmount(bnb, '20'),
      price: 2,
      waiting: false,
    },
  }

  for (const heldAddresses of [
    undefined,
    new Set([tokenRowKey(eth.chainId, eth.address)]),
    new Set([tokenRowKey(bnb.chainId, bnb.address)]),
  ]) {
    const held = !!heldAddresses?.has(tokenRowKey(bnb.chainId, bnb.address))
    renderToStaticMarkup(
      createElement(VirtualRow, {
        index: 1,
        style: {},
        data: { ...data, aggregateBalances, heldAddresses },
      }),
    )
    expect(mocks.row.mock.lastCall?.[0]).toMatchObject({
      held,
      importOnClick: held,
      rightColumn: held ? 'balance' : 'import',
    })
    expect(mocks.row.mock.lastCall?.[0].currencyBalance.quotient.toString()).toBe('20')
  }
})
