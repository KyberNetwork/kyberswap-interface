import { ChainId } from '@kyberswap/ks-sdk-core'
import { buildStopMarketListSearchParams } from 'services/stopMarket'
import { describe, expect, it } from 'vitest'

import { StopMarketStatus } from 'components/StopMarket/types'

const WALLET = '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc'

describe('buildStopMarketListSearchParams', () => {
  it('repeats a list filter once per value', () => {
    const params = buildStopMarketListSearchParams({
      userWallet: WALLET,
      chainIds: [ChainId.BASE, ChainId.BSCMAINNET],
      statuses: [StopMarketStatus.DONE, StopMarketStatus.CANCELLED, StopMarketStatus.EXPIRED],
      page: 2,
      pageSize: 10,
    })
    expect(params.getAll('statuses')).toEqual([
      StopMarketStatus.DONE,
      StopMarketStatus.CANCELLED,
      StopMarketStatus.EXPIRED,
    ])
    expect(params.getAll('chainIds')).toEqual(['8453', '56'])
    expect(params.get('page')).toBe('2')
    expect(params.get('pageSize')).toBe('10')
  })

  it('sends no chain filter at all for every chain, since an unknown id fails the whole request', () => {
    const params = buildStopMarketListSearchParams({ userWallet: WALLET })
    expect(params.has('chainIds')).toBe(false)
    expect(params.has('statuses')).toBe(false)
    expect(params.get('page')).toBe('1')
  })

  it('sends the search trimmed, and not at all when blank', () => {
    expect(buildStopMarketListSearchParams({ userWallet: WALLET, query: '  cbBTC ' }).get('query')).toBe('cbBTC')
    expect(buildStopMarketListSearchParams({ userWallet: WALLET, query: '   ' }).has('query')).toBe(false)
  })
})
