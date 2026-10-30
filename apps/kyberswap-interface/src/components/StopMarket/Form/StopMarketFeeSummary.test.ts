import { ChainId } from '@kyberswap/ks-sdk-core'
import { describe, expect, it } from 'vitest'

import {
  getStopMarketFeeLabel,
  getStopMarketFeeSummary,
  getStopMarketFeeWarningKind,
} from 'components/StopMarket/Form/StopMarketFeeSummary'
import { HIGH_FEE_SHARE_PERCENT } from 'components/StopMarket/constants'
import { StopMarketFee } from 'components/StopMarket/types'

// A 0.15%-tier pair on BSC, as estimate-fee returns it.
const TIER: StopMarketFee = {
  protocol: { percentage: 0.15, category: 'commonPair', tierPercentage: 0.15 },
  gas: { percentage: 0, usd: 0, wei: 0 },
  protocolFeeUsd: 29.93,
  minProtocolFeeApplied: false,
  minProtocolFeeNative: '300000000000000',
  minProtocolFeeUsd: 0.22117953,
}

// A small order on the same pair, where the 0.0003 BNB minimum takes over.
const MINIMUM: StopMarketFee = {
  ...TIER,
  protocol: { percentage: 1.3704, category: 'commonPair', tierPercentage: 0.15 },
  protocolFeeUsd: 0.22118711934269725,
  minProtocolFeeApplied: true,
}

describe('getStopMarketFeeLabel', () => {
  it('shows the rate while the tier applies', () => {
    expect(getStopMarketFeeLabel(TIER)).toBe('0.15%')
  })

  it('shows the dollar amount once the minimum applies', () => {
    expect(getStopMarketFeeLabel(MINIMUM)).toBe('~$0.2211')
  })

  it('falls back to whichever figure the service sent', () => {
    expect(getStopMarketFeeLabel({ ...MINIMUM, protocolFeeUsd: undefined })).toBe('1.37%')
    expect(getStopMarketFeeLabel({ ...TIER, protocol: undefined as never })).toBe('~$29.93')
  })
})

describe('getStopMarketFeeSummary', () => {
  it('gives the rate and what it comes to while the tier applies', () => {
    expect(getStopMarketFeeSummary(TIER, ChainId.BSCMAINNET)).toBe('0.15% (~$29.93)')
  })

  it('gives the tier rate and the minimum in the chain coin and dollars once the minimum applies', () => {
    expect(getStopMarketFeeSummary(MINIMUM, ChainId.BSCMAINNET)).toBe('0.15%, min 0.0003 BNB (~$0.2211)')
  })

  it('leaves out the coin amount without a chain to read it in', () => {
    expect(getStopMarketFeeSummary(MINIMUM)).toBe('0.15%, min ~$0.2211')
  })
})

describe('getStopMarketFeeWarningKind', () => {
  it('has no warning while the fee share is low', () => {
    expect(getStopMarketFeeWarningKind(TIER)).toBe('none')
  })

  it('warns about the share alone when the tier rate applies', () => {
    const highTier = { ...TIER, protocol: { ...TIER.protocol, percentage: HIGH_FEE_SHARE_PERCENT + 0.5 } }
    expect(getStopMarketFeeWarningKind(highTier)).toBe('highShare')
  })

  it('adds the gas-spike clause when the minimum applies and the share is high', () => {
    const highMinimum = { ...MINIMUM, protocol: { ...MINIMUM.protocol, percentage: HIGH_FEE_SHARE_PERCENT + 0.37 } }
    expect(getStopMarketFeeWarningKind(highMinimum)).toBe('highShareMinimum')
  })

  it('has no warning when the minimum applies at a share at or below the threshold', () => {
    const lowMinimum = { ...MINIMUM, protocol: { ...MINIMUM.protocol, percentage: HIGH_FEE_SHARE_PERCENT } }
    expect(getStopMarketFeeWarningKind(lowMinimum)).toBe('none')
  })
})
