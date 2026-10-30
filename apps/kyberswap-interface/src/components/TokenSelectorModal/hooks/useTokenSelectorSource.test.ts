import { ChainId, WETH } from '@kyberswap/ks-sdk-core'
import { i18n } from '@lingui/core'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ETHER_ADDRESS } from 'constants/index'
import { NativeCurrencies } from 'constants/tokens'
import { TokenInfo, WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { filterTokens } from 'utils/filtering'
import { isTokenNative } from 'utils/tokenInfo'

import { buildOracleTokenMap, useTokenSelectorSource } from './useTokenSelectorSource'

const mocks = vi.hoisted(() => ({ query: vi.fn(), allTokens: vi.fn() }))
vi.mock('services/stopMarket', () => ({ useGetStopMarketOracleTokensQuery: mocks.query }))
vi.mock('hooks/useTokens', () => ({ useAllTokens: mocks.allTokens }))
vi.mock('hooks/useChainsConfig', () => ({
  default: () => ({ supportedChains: [{ chainId: 56 }, { chainId: 8453 }] }),
}))

const chainId = ChainId.BSCMAINNET
const wrappedNative: TokenInfo = {
  chainId,
  address: WETH[chainId].address,
  decimals: 18,
  symbol: 'WBNB',
  name: 'Wrapped BNB',
  isWhitelisted: true,
}
const bch: TokenInfo = {
  chainId,
  address: '0x8ff795a6f4d97e7887c79bea79aba5cc76444adf',
  decimals: 18,
  symbol: 'BCH',
  name: 'Bitcoin Cash',
  isWhitelisted: false,
}

const readSource = (selectedChainId = chainId, requireOracle = true) => {
  let result: ReturnType<typeof useTokenSelectorSource> | undefined
  const Probe = () => {
    result = useTokenSelectorSource(selectedChainId, requireOracle)
    return null
  }
  renderToStaticMarkup(createElement(Probe))
  if (!result) throw new Error('Source did not render')
  return result
}

beforeEach(() => {
  vi.clearAllMocks()
  i18n.loadAndActivate({ locale: 'en', messages: {} })
  mocks.allTokens.mockReturnValue({})
  mocks.query.mockReturnValue({
    currentData: { tokenFilter: 'hasChainlinkOracle', tokens: [wrappedNative, bch] },
    isError: false,
  })
})

describe('oracle selector source', () => {
  it('keeps native and wrapped as distinct rows and preserves the API whitelist flags', () => {
    const source = readSource()
    const rows = Object.values(source.defaultTokens)

    expect(rows.map(token => token.symbol)).toEqual(['WBNB', 'BCH', 'BNB'])
    expect(rows.filter(isTokenNative)).toHaveLength(1)
    expect(rows.find(token => token.symbol === 'BCH')?.isWhitelisted).toBe(false)
    expect(rows.find(token => token.symbol === 'WBNB')?.isWhitelisted).toBe(true)
    expect(rows.every(source.isListable)).toBe(true)
    expect(source.isListable(NativeCurrencies[chainId])).toBe(true)
    expect(source.searchFilters).toEqual({ oracleTokenFilter: 'hasChainlinkOracle' })
    expect(source.allowRpcSearch).toBe(false)
    expect(filterTokens(chainId, rows, 'BNB').some(isTokenNative)).toBe(true)
    expect(filterTokens(chainId, rows, ETHER_ADDRESS).map(token => token.symbol)).toEqual(['BNB'])
  })

  it('does not add native without its wrapped oracle feed or duplicate an API native entry', () => {
    expect(buildOracleTokenMap(chainId, [bch])[ETHER_ADDRESS]).toBeUndefined()
    const listedNative = { ...wrappedNative, address: ETHER_ADDRESS, symbol: 'BNB' }
    const tokens = Object.values(buildOracleTokenMap(chainId, [wrappedNative, listedNative]))
    expect(tokens.filter(isTokenNative)).toHaveLength(1)
    expect(tokens).toHaveLength(2)
  })

  it('does not reuse the previous chain list while the next chain loads', () => {
    const previous = { tokenFilter: 'hasChainlinkOracle', tokens: [wrappedNative] }
    mocks.query.mockReturnValue({ data: previous, currentData: undefined, isError: false })
    const source = readSource(ChainId.BASE)

    expect(source.defaultTokens).toEqual({})
    expect(source.isLoading).toBe(true)
    expect(source.searchFilters).toBeUndefined()
    expect(mocks.query).toHaveBeenLastCalledWith(ChainId.BASE, { skip: false })
  })

  it('retains the standard selector source and skips oracle queries outside Stop Market', () => {
    const tokens = { [wrappedNative.address]: new WrappedTokenInfo(wrappedNative) }
    mocks.allTokens.mockReturnValue(tokens)
    const source = readSource(chainId, false)

    expect(source.defaultTokens).toBe(tokens)
    expect(source.searchFilters).toBeUndefined()
    expect(source.allowRpcSearch).toBe(true)
    expect(source.isListable(new WrappedTokenInfo(bch))).toBe(true)
    expect(source.notice).toBeUndefined()
    expect(source.isLoading).toBe(false)
    expect(mocks.query).toHaveBeenLastCalledWith(chainId, { skip: true })
  })
})
