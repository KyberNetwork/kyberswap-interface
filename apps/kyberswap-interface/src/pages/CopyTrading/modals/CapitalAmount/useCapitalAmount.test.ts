import type { PreparedAction } from 'services/copyTrading/types/preparedActions'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CopyTradingChain } from 'pages/CopyTrading/context'
import { useCapitalAmount } from 'pages/CopyTrading/modals/CapitalAmount/useCapitalAmount'

const harness = vi.hoisted(() => ({
  slots: [] as { current: unknown }[],
  index: 0,
  chains: [] as CopyTradingChain[],
}))
vi.mock('react', () => ({
  useMemo: (getValue: () => unknown) => getValue(),
  useRef: (value: unknown) => {
    const index = harness.index++
    return harness.slots[index] || (harness.slots[index] = { current: value })
  },
  useState: (value: unknown) => {
    const index = harness.index++
    const slot = harness.slots[index] || (harness.slots[index] = { current: value })
    return [
      slot.current,
      (next: unknown) => {
        slot.current = next
      },
    ]
  },
}))
vi.mock('pages/CopyTrading/context', () => ({
  useCopyTradingContext: () => ({ chains: harness.chains }),
}))
vi.mock('hooks/useTokenBalance', () => ({
  default: () => ({ value: 100000000000000000000n, isLoading: false }),
}))

const token = { chainId: 8453, address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', decimals: 6 } as const
const chain: CopyTradingChain = {
  chainId: 8453,
  name: 'Base',
  slug: 'base',
  iconUrl: '',
  isEnabled: true,
  quoteToken: token,
}
const CapitalAmountHarness = (targetChainId = 8453) => {
  harness.index = 0
  return useCapitalAmount({
    targetChainId,
    connectedChainId: targetChainId,
    account: '0x1111111111111111111111111111111111111111',
  })
}
const preparation = (preview: 'startCopy' | 'addCapital'): PreparedAction => ({
  generationId: 'generation-v1',
  displayEnrichment: { status: 'ACTION_DISPLAY_ENRICHMENT_STATUS_NOT_APPLICABLE' },
  status: 'PREPARED_ACTION_STATUS_READY',
  chainId: '8453',
  [preview]: {
    quoteToken: { chainId: '8453', address: token.address },
    ...(preview === 'startCopy' ? { requestedTargetRaw: '1250000' } : { addedCapitalRaw: '1250000' }),
  },
})

beforeEach(() => {
  harness.slots = []
  harness.chains = [chain]
})

describe('funding amount discovery and validation', () => {
  it('allows tokens without display metadata and uses exact raw amounts with the temporary minimum', () => {
    CapitalAmountHarness().setAmount('1.25')
    expect(CapitalAmountHarness()).toMatchObject({ amountRaw: '1250000', amountIsValid: true })
    expect(CapitalAmountHarness().quoteCurrency?.symbol).toBe(token.address)
    CapitalAmountHarness().setAmount('0.000001')
    expect(CapitalAmountHarness()).toMatchObject({ amountRaw: '1', amountIsValid: false })
    expect(CapitalAmountHarness().amountError).toContain('Minimum amount is 1')
    CapitalAmountHarness().setAmount('1')
    expect(CapitalAmountHarness().amountIsValid).toBe(true)
  })

  it.each(['1.1234567', '0', '-1', '1e2'])('rejects invalid or overprecision amount %s', amount => {
    CapitalAmountHarness().setAmount(amount)
    expect(CapitalAmountHarness()).toMatchObject({ amountIsValid: false, amountRaw: undefined })
  })

  it('retains all 18 decimals without floating-point rounding', () => {
    harness.chains = [{ ...chain, quoteToken: { ...token, decimals: 18 } }]
    CapitalAmountHarness().setAmount('1.250000000000000001')
    expect(CapitalAmountHarness().amountRaw).toBe('1250000000000000001')
    CapitalAmountHarness().setAmount('0.999999999999999999')
    expect(CapitalAmountHarness().amountIsValid).toBe(false)
    CapitalAmountHarness().setAmount('1')
    expect(CapitalAmountHarness().amountIsValid).toBe(true)
  })

  it('rejects a stale preparation after the entered amount changes', () => {
    CapitalAmountHarness().setAmount('1.25')
    const form = CapitalAmountHarness()
    form.setAmount('2')
    CapitalAmountHarness()
    expect(() => form.validatePreparation(preparation('startCopy'))).toThrow('Review the amount and prepare again.')
  })

  it.each([
    'PREPARED_ACTION_STATUS_READY',
    'PREPARED_ACTION_STATUS_PARTIALLY_COMPLETED',
    'PREPARED_ACTION_STATUS_PENDING',
    'PREPARED_ACTION_STATUS_COMPLETED',
  ] as const)('rejects mismatched or missing Add Capital amounts for %s', status => {
    CapitalAmountHarness().setAmount('1.25')
    const form = CapitalAmountHarness()
    const action = { ...preparation('addCapital'), status }
    for (const addedCapitalRaw of ['2000000', undefined]) {
      expect(() =>
        form.validatePreparation({ ...action, addCapital: { ...action.addCapital, addedCapitalRaw } }),
      ).toThrow('Review the amount and prepare again.')
    }
    expect(() => form.validatePreparation({ ...action, addCapital: undefined })).toThrow(
      'Review the amount and prepare again.',
    )
  })

  it.each(['PREPARED_ACTION_STATUS_PENDING', 'PREPARED_ACTION_STATUS_COMPLETED'] as const)(
    'preserves %s funding results without requiring token metadata',
    status => {
      CapitalAmountHarness().setAmount('1.25')
      const form = CapitalAmountHarness()
      for (const preview of ['startCopy', 'addCapital'] as const) {
        const action = preparation(preview)
        const result = { ...action, status, [preview]: { ...action[preview], quoteToken: undefined } }
        expect(form.validatePreparation(result)).toBe(result)
        form.setAmount('2')
        CapitalAmountHarness()
        expect(() => form.validatePreparation(result)).toThrow('Review the amount and prepare again.')
        form.setAmount('1.25')
        CapitalAmountHarness()
      }
    },
  )

  it('keeps the amount when only display metadata changes', () => {
    CapitalAmountHarness().setAmount('1.25')
    harness.chains = [{ ...chain, quoteToken: { ...token, symbol: 'USDC' } }]
    expect(CapitalAmountHarness()).toMatchObject({ amount: '1.25', amountRaw: '1250000' })
  })

  it.each(['startCopy', 'addCapital'] as const)(
    'fills omitted preparation decimals only for matching %s tokens',
    preview => {
      CapitalAmountHarness().setAmount('1.25')
      const form = CapitalAmountHarness()
      const action = preparation(preview)
      expect(form.validatePreparation(action)[preview]?.quoteToken?.decimals).toBe(6)
      expect(action[preview]?.quoteToken?.decimals).toBeUndefined()
      for (const mismatch of [
        { chainId: '56' },
        { address: '0x1111111111111111111111111111111111111111' },
        { decimals: 18 },
      ]) {
        const invalid = {
          ...action,
          [preview]: { ...action[preview], quoteToken: { ...action[preview]?.quoteToken, ...mismatch } },
        }
        expect(() => form.validatePreparation(invalid)).toThrow('Funding token information changed')
      }
    },
  )

  it('validates allowance diagnostics before authorization but preserves other unavailable outcomes', () => {
    CapitalAmountHarness().setAmount('1.25')
    const form = CapitalAmountHarness()
    const unavailable: PreparedAction = {
      generationId: 'generation-v1',
      displayEnrichment: { status: 'ACTION_DISPLAY_ENRICHMENT_STATUS_NOT_APPLICABLE' },
      status: 'PREPARED_ACTION_STATUS_UNAVAILABLE',
      reason: 'PREPARED_ACTION_REASON_CONTROLLER_PAUSED',
    }
    expect(form.validatePreparation(unavailable)).toBe(unavailable)
    expect(() =>
      form.validatePreparation({ ...unavailable, reason: 'PREPARED_ACTION_REASON_INSUFFICIENT_QUOTE_ALLOWANCE' }),
    ).toThrow()
  })
})
