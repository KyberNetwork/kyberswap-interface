import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { StopMarketFee } from 'components/StopMarket/types'

import { useStopMarketFeeEstimate } from './useStopMarketFeeEstimate'

const mocks = vi.hoisted(() => ({ query: vi.fn(), refetch: vi.fn() }))
vi.mock('services/stopMarket', () => ({ useGetStopMarketFeeEstimateQuery: mocks.query }))
vi.mock('hooks', () => ({
  useActiveWeb3React: () => ({ account: '0x0000000000000000000000000000000000000001', chainId: 1 }),
}))

const fee: StopMarketFee = {
  protocol: { percentage: 0.15, category: 'commonPair' },
  gas: { percentage: 0, usd: 0, wei: 0 },
}
const params = {
  currencyIn: new Token(ChainId.MAINNET, '0x0000000000000000000000000000000000000002', 18),
  currencyOut: new Token(ChainId.MAINNET, '0x0000000000000000000000000000000000000003', 18),
  inputAmount: '1',
  triggerPrice: '100',
  slippage: 100,
  expiredAt: 1_900_000_000_000,
  pollingInterval: 30_000,
}

// Exercise the hook with real React hooks; the query boundary supplies each network outcome.
const readEstimate = (input = params) => {
  let result: ReturnType<typeof useStopMarketFeeEstimate> | undefined
  const Probe = () => {
    result = useStopMarketFeeEstimate(input)
    return null
  }
  renderToStaticMarkup(createElement(Probe))
  if (!result) throw new Error('Estimate did not render')
  return result
}

beforeEach(() => {
  mocks.query.mockReset()
  mocks.query.mockReturnValue({ currentData: fee, isFetching: false, refetch: mocks.refetch })
})

describe('creation form fee estimates', () => {
  it('subscribes with a 30 second interval and exposes the settled estimate', () => {
    const result = readEstimate()
    expect(result.fee).toBe(fee)
    expect(result.isLoading).toBe(false)
    expect(mocks.query.mock.calls[0][1]).toMatchObject({ skip: false, pollingInterval: 30_000 })
  })

  it('withholds cached fees during a poll so a new review cannot open with a pending estimate', () => {
    mocks.query.mockReturnValue({ currentData: fee, isFetching: true, refetch: mocks.refetch })
    const result = readEstimate()
    expect(result.isLoading).toBe(true)
    expect(result.fee).toBeUndefined()
  })

  it('reports a failed refresh even with cached data and exposes an explicit retry', () => {
    mocks.query.mockReturnValue({
      currentData: fee,
      isFetching: false,
      error: { data: { message: 'Fee service unavailable' } },
      refetch: mocks.refetch,
    })
    const result = readEstimate()
    expect(result.fee).toBeUndefined()
    expect(result.errorMessage).toBe('Fee service unavailable')
    result.refetch()
    expect(mocks.refetch).toHaveBeenCalledOnce()
  })

  it('does not query or expose cached fees for an empty amount', () => {
    const result = readEstimate({ ...params, inputAmount: '' })
    expect(mocks.query.mock.calls[0][1].skip).toBe(true)
    expect(result.fee).toBeUndefined()
    expect(result.isLoading).toBe(false)
  })
})
