import { ChainId, Token, WETH } from '@kyberswap/ks-sdk-core'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { ETHER_ADDRESS } from 'constants/index'
import { NativeCurrencies } from 'constants/tokens'
import { getOracleLookupAddress, useOracleTokens } from 'hooks/useOracleTokens'

const mocks = vi.hoisted(() => ({ useGetStopMarketOracleTokensQuery: vi.fn() }))
vi.mock('services/stopMarket', () => mocks)

it('preserves token metadata and derives oracle membership independently of whitelist status', () => {
  const tokens = [
    {
      chainId: ChainId.BSCMAINNET,
      address: '0x55d398326f99059fF775485246999027B3197955',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 18,
      isWhitelisted: true,
    },
    {
      chainId: ChainId.BSCMAINNET,
      address: '0x8ff795a6f4d97e7887c79bea79aba5cc76444adf',
      symbol: 'BCH',
      name: 'Bitcoin Cash',
      decimals: 18,
      isWhitelisted: false,
    },
  ]
  mocks.useGetStopMarketOracleTokensQuery.mockReturnValue({
    currentData: { tokenFilter: 'hasChainlinkOracle', tokens },
    isError: false,
  })
  let result: ReturnType<typeof useOracleTokens> | undefined
  const Probe = () => {
    result = useOracleTokens(ChainId.BSCMAINNET)
    return null
  }
  renderToStaticMarkup(createElement(Probe))

  expect(result?.tokens).toBe(tokens)
  expect(result?.addresses).toEqual(new Set(tokens.map(token => token.address.toLowerCase())))
  tokens.forEach(token => {
    expect(result?.hasOracle(new Token(token.chainId, token.address, token.decimals))).toBe(true)
  })
})

describe('getOracleLookupAddress', () => {
  const WBNB = WETH[ChainId.BSCMAINNET].address.toLowerCase()

  it('looks a native coin up under its wrapped token', () => {
    expect(getOracleLookupAddress(NativeCurrencies[ChainId.BSCMAINNET])).toBe(WBNB)
  })

  it('treats the token list placeholder for the native coin the same way', () => {
    const listedNative = new Token(ChainId.BSCMAINNET, ETHER_ADDRESS, 18, 'BNB', 'BNB')
    expect(getOracleLookupAddress(listedNative)).toBe(WBNB)
  })

  it('looks any other token up under its own address', () => {
    const usdt = new Token(ChainId.BSCMAINNET, '0x55d398326f99059fF775485246999027B3197955', 18, 'USDT')
    expect(getOracleLookupAddress(usdt)).toBe('0x55d398326f99059ff775485246999027b3197955')
  })
})
