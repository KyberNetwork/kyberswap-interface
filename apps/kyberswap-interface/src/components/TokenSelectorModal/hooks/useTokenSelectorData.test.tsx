import { ChainId, Currency, Token } from '@kyberswap/ks-sdk-core'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, expect, it, vi } from 'vitest'

import { TokenSelectorTab } from 'components/TokenSelectorModal/constants'
import { NativeCurrencies } from 'constants/tokens'

import { useTokenSelectorData } from './useTokenSelectorData'

const mocks = vi.hoisted(() => ({ source: vi.fn(), search: vi.fn(), tabs: vi.fn() }))
vi.mock('react-use', () => ({ useMedia: () => false }))
vi.mock('hooks', () => ({ useActiveWeb3React: () => ({}) }))
vi.mock('hooks/useBalanceWait', () => ({ useBalanceWait: () => false }))
vi.mock('state/user/hooks', () => ({ useUserAddedTokens: () => [] }))
vi.mock('state/wallet/hooks', () => ({ useNativeBalance: () => undefined, useTokenBalances: () => ({}) }))
vi.mock('state/walletInventory/hooks', () => ({
  useWalletInventory: () => ({ active: false }),
  useInventoryTokenBalances: () => ({}),
}))
vi.mock('state/walletInventory/metadata', () => ({ ensureTokenMetadata: vi.fn() }))
vi.mock('components/TokenSelectorModal/hooks/useTokenSelectorSource', () => ({ useTokenSelectorSource: mocks.source }))
vi.mock('components/TokenSelectorModal/hooks/useTokenSearch', () => ({ useTokenSearch: mocks.search }))
vi.mock('components/TokenSelectorModal/hooks/useTokenTabData', () => ({ useTokenTabData: mocks.tabs }))
vi.mock('components/TokenSelectorModal/hooks/useTokenFavorites', () => ({
  useTokenFavorites: () => ({ pinnedTokens: [], favoriteAddressSet: new Set() }),
}))
vi.mock('components/TokenSelectorModal/hooks/useInventoryDiscoveries', () => ({
  useInventoryDiscoveries: () => ({ tokens: [], impersonators: new Set() }),
}))
vi.mock('components/TokenSelectorModal/utils', async importOriginal => ({
  ...(await importOriginal<typeof import('components/TokenSelectorModal/utils')>()),
  useTokenComparator: () => () => 0,
}))

const chainId = ChainId.BSCMAINNET
const allowed = new Token(chainId, '0x0000000000000000000000000000000000000001', 18, 'A')
const excluded = new Token(chainId, '0x0000000000000000000000000000000000000002', 18, 'B')
const searchFilters = { oracleTokenFilter: 'hasChainlinkOracle' }
const readData = (query = '', requireOracle = true) => {
  let result!: ReturnType<typeof useTokenSelectorData>
  const Probe = () => {
    result = useTokenSelectorData({
      primaryChainId: chainId,
      activeTab: TokenSelectorTab.All,
      debouncedQuery: query,
      sort: null,
      showDiscoveryTabs: true,
      filterWrap: false,
      requireOracle,
    })
    return null
  }
  renderToStaticMarkup(createElement(Probe))
  return result
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.source.mockReturnValue({
    defaultTokens: { [allowed.address]: allowed, [excluded.address]: excluded },
    searchFilters,
    isListable: (token: Currency | undefined) => token?.equals(allowed),
    allowRpcSearch: false,
    isLoading: false,
    isDefaultListLoading: false,
  })
  mocks.search.mockReturnValue({ tokenSearchResults: [allowed, excluded], otherChainTokens: [], loading: false })
  mocks.tabs.mockReturnValue({ currencies: [], extras: {}, loading: false })
})

it('uses oracle eligibility for both default and search lists and native quick selection', () => {
  expect(readData().visibleCurrencies).toEqual([allowed])
  expect(readData('token').visibleCurrencies).toEqual([allowed])
  expect(readData().quickSelectTokens).toEqual([])
  expect(mocks.source).toHaveBeenCalledWith(chainId, true)
  expect(mocks.search).toHaveBeenCalledWith(chainId, 'token', true, searchFilters, false)
  expect(mocks.tabs).toHaveBeenCalledWith(expect.objectContaining({ searchFilters }))
})

it('finds the native token locally when its oracle feed supports it', () => {
  const native = NativeCurrencies[chainId]
  mocks.source.mockReturnValue({
    defaultTokens: { native },
    searchFilters,
    isListable: () => true,
    allowRpcSearch: false,
    isLoading: false,
    isDefaultListLoading: false,
  })
  mocks.search.mockReturnValue({ tokenSearchResults: [], otherChainTokens: [], loading: false })
  expect(readData('bnb').visibleCurrencies).toEqual([native])
})

it('keeps the list loading until oracle eligibility resolves and passes standard mode through', () => {
  mocks.source.mockReturnValue({ ...mocks.source(), isLoading: true })
  expect(readData().isListLoading).toBe(true)
  readData('', false)
  expect(mocks.source).toHaveBeenLastCalledWith(chainId, false)
})
