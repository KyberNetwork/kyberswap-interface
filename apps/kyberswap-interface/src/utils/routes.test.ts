import { ChainId, WETH } from '@kyberswap/ks-sdk-core'
import { describe, expect, it } from 'vitest'

import { ETHER_ADDRESS, ZERO_ADDRESS } from 'constants/index'

import {
  SwapIntent,
  getSwapIntentFromPath,
  getSyncedNetworkPathname,
  isSwapLikePath,
  resolveSwapIntentPair,
} from './routes'

const STABLE_COUNTER = 'USDC'
const WRAPPED_NATIVE = WETH[ChainId.BASE]
const WRAPPED_NATIVE_SYMBOL = WRAPPED_NATIVE.symbol || 'WETH'
const NATIVE_ALIASES = [ETHER_ADDRESS, ZERO_ADDRESS]
const WRAPPED_NATIVE_ALIASES = [WRAPPED_NATIVE.address, WRAPPED_NATIVE_SYMBOL]
const PAIR_PARAMS = {
  nativeToken: 'ETH',
  stableCounterToken: STABLE_COUNTER,
  nativeTokenAliases: NATIVE_ALIASES,
  wrappedNativeAliases: WRAPPED_NATIVE_ALIASES,
}

describe('isSwapLikePath', () => {
  it.each(['/swap', '/swap/base', '/buy/base/wbtc', '/sell/base/wbtc'])('accepts %s', pathname => {
    expect(isSwapLikePath(pathname)).toBe(true)
  })

  it.each(['/limit/base', '/cross-chain', '/swapper', '/buyer/base/wbtc', '/seller/base/wbtc'])(
    'rejects %s',
    pathname => {
      expect(isSwapLikePath(pathname)).toBe(false)
    },
  )
})

describe('getSwapIntentFromPath', () => {
  it.each([
    ['/buy', SwapIntent.BUY],
    ['/buy/base/wbtc', SwapIntent.BUY],
    ['/sell', SwapIntent.SELL],
    ['/sell/base/wbtc', SwapIntent.SELL],
  ] as const)('returns the expected intent for %s', (pathname, expected) => {
    expect(getSwapIntentFromPath(pathname)).toBe(expected)
  })

  it.each(['/swap/base', '/buyer/base/wbtc', '/seller/base/wbtc'])('returns no intent for %s', pathname => {
    expect(getSwapIntentFromPath(pathname)).toBeUndefined()
  })
})

describe('getSyncedNetworkPathname', () => {
  it.each([
    ['/swap/ethereum/eth-to-usdc', '/swap/base'],
    ['/buy/ethereum/wbtc', '/swap/base'],
    ['/sell/ethereum/wbtc', '/swap/base'],
    ['/limit/ethereum/eth-to-usdc', '/limit/base'],
    ['/pools/ethereum', '/pools/base'],
  ] as const)('syncs %s to %s', (pathname, expected) => {
    expect(getSyncedNetworkPathname(pathname, 'ethereum', 'base')).toBe(expected)
  })
})

describe('resolveSwapIntentPair', () => {
  it('uses native as the counter for a regular token', () => {
    expect(resolveSwapIntentPair({ ...PAIR_PARAMS, intent: SwapIntent.BUY, subjectToken: 'WBTC' })).toEqual({
      fromCurrency: 'eth',
      toCurrency: 'wbtc',
    })
  })

  it('keeps the regular token first when selling', () => {
    expect(resolveSwapIntentPair({ ...PAIR_PARAMS, intent: SwapIntent.SELL, subjectToken: 'WBTC' })).toEqual({
      fromCurrency: 'wbtc',
      toCurrency: 'eth',
    })
  })

  it('uses stable first when buying a native alias', () => {
    expect(resolveSwapIntentPair({ ...PAIR_PARAMS, intent: SwapIntent.BUY, subjectToken: ETHER_ADDRESS })).toEqual({
      fromCurrency: STABLE_COUNTER.toLowerCase(),
      toCurrency: 'eth',
    })
  })

  it('uses stable as the counter and normalizes a native alias', () => {
    expect(resolveSwapIntentPair({ ...PAIR_PARAMS, intent: SwapIntent.SELL, subjectToken: ZERO_ADDRESS })).toEqual({
      fromCurrency: 'eth',
      toCurrency: STABLE_COUNTER.toLowerCase(),
    })
  })

  it('uses stable as the counter without unwrapping a wrapped-native address', () => {
    expect(
      resolveSwapIntentPair({ ...PAIR_PARAMS, intent: SwapIntent.BUY, subjectToken: WRAPPED_NATIVE.address }),
    ).toEqual({
      fromCurrency: STABLE_COUNTER.toLowerCase(),
      toCurrency: WRAPPED_NATIVE.address.toLowerCase(),
    })
  })

  it('matches wrapped-native symbols case-insensitively', () => {
    expect(
      resolveSwapIntentPair({
        ...PAIR_PARAMS,
        intent: SwapIntent.SELL,
        subjectToken: WRAPPED_NATIVE_SYMBOL.toLowerCase(),
      }),
    ).toEqual({ fromCurrency: WRAPPED_NATIVE_SYMBOL.toLowerCase(), toCurrency: STABLE_COUNTER.toLowerCase() })
  })
})
