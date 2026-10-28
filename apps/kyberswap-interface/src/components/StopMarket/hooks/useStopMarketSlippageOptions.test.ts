import { ChainId } from '@kyberswap/ks-sdk-core'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { PAIR_CATEGORY } from 'constants/trade'
import { SLIPPAGE_STATUS } from 'utils/slippage'

import { useStopMarketSlippageOptions } from './useStopMarketSlippageOptions'

const mocks = vi.hoisted(() => ({ usePairCategory: vi.fn() }))
vi.mock('state/swap/hooks', () => ({ usePairCategory: mocks.usePairCategory }))

const readOptions = (category: string | undefined) => {
  mocks.usePairCategory.mockReturnValue(category)
  let result: ReturnType<typeof useStopMarketSlippageOptions> | undefined
  const Probe = () => {
    result = useStopMarketSlippageOptions(ChainId.MAINNET)
    return null
  }
  renderToStaticMarkup(createElement(Probe))
  if (!result) throw new Error('Slippage options did not render')
  return result
}

describe('Stop Market slippage options', () => {
  it.each(['commonPair', 'unknownPair', undefined])('falls back for category %s', category => {
    const result = readOptions(category)

    expect(result.defaultSlippage).toBe(100)
    expect(result.slippagePresets).toEqual([10, 20, 100, 200])
    expect([19, 20, 400, 401].map(result.getSlippageStatus)).toEqual([
      SLIPPAGE_STATUS.LOW,
      SLIPPAGE_STATUS.NORMAL,
      SLIPPAGE_STATUS.NORMAL,
      SLIPPAGE_STATUS.HIGH,
    ])
  })

  it.each([
    [PAIR_CATEGORY.STABLE, 5, 40],
    [PAIR_CATEGORY.CORRELATED, 10, 100],
  ])('keeps %s defaults and has no low warning', (category, defaultSlippage, highThreshold) => {
    const result = readOptions(category)

    expect(result.defaultSlippage).toBe(defaultSlippage)
    expect(result.getSlippageStatus(0)).toBe(SLIPPAGE_STATUS.NORMAL)
    expect(result.getSlippageStatus(highThreshold)).toBe(SLIPPAGE_STATUS.NORMAL)
    expect(result.getSlippageStatus(highThreshold + 1)).toBe(SLIPPAGE_STATUS.HIGH)
  })

  it('keeps high-volatility defaults and warning boundaries', () => {
    const result = readOptions(PAIR_CATEGORY.HIGH_VOLATILITY)

    expect(result.defaultSlippage).toBe(300)
    expect(result.slippagePresets).toEqual([100, 300, 600, 1000])
    expect([99, 100, 1000, 1001].map(result.getSlippageStatus)).toEqual([
      SLIPPAGE_STATUS.LOW,
      SLIPPAGE_STATUS.NORMAL,
      SLIPPAGE_STATUS.NORMAL,
      SLIPPAGE_STATUS.HIGH,
    ])
  })
})
