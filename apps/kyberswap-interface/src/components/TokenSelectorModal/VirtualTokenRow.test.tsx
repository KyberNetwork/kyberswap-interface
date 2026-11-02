import { ChainId, Currency, Token, TokenAmount } from '@kyberswap/ks-sdk-core'
import { ReactNode, createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, expect, it, vi } from 'vitest'

import { VirtualRow, VirtualRowData } from './VirtualTokenRow'

const mocks = vi.hoisted(() => ({
  prices: vi.fn(),
  row: vi.fn(),
  balances: vi.fn(),
  inventory: vi.fn(),
  imports: vi.fn(),
  favorites: vi.fn(),
  toggle: vi.fn(),
  remove: vi.fn(),
}))
vi.mock('framer-motion', () => ({ motion: { div: ({ children }: { children: ReactNode }) => <div>{children}</div> } }))
vi.mock('components/TokenSelectorModal/TokenRow', () => ({ TokenRow: mocks.row }))
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
  useRemoveUserAddedToken: () => mocks.remove,
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
    toggleFavoriteToken: mocks.toggle,
  }))
})

it('reads balance, import and favorite state on each row chain, even for the same address', () => {
  render(0)
  expect(mocks.row.mock.lastCall?.[0]).toMatchObject({ isFavorite: true, rightColumn: 'balance', showNetwork: true })
  expect(mocks.row.mock.lastCall?.[0].currencyBalance.quotient.toString()).toBe('10')
  render(1)
  expect(mocks.inventory).toHaveBeenLastCalledWith(56)
  expect(mocks.balances).toHaveBeenLastCalledWith([bnb], 56)
  expect(mocks.row.mock.lastCall?.[0]).toMatchObject({ isFavorite: false, rightColumn: 'import' })
  expect(mocks.row.mock.lastCall?.[0].currencyBalance.quotient.toString()).toBe('20')
})

it('toggles and removes a token on its own chain', () => {
  render(1)
  const props = mocks.row.mock.lastCall?.[0]
  props.onToggleFavorite({ stopPropagation: vi.fn() }, bnb)
  expect(mocks.toggle).toHaveBeenCalledWith({ chainId: 56, address: bnb.address })
  props.onRemoveImportedToken(bnb)
  expect(mocks.remove).toHaveBeenCalledWith(56, bnb.address)
})
