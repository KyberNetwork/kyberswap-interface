import type { Chain } from 'services/copyTrading/types/agents'
import type { PreparedAction } from 'services/copyTrading/types/preparedActions'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCapitalAmount } from 'pages/CopyTrading/modals/CapitalAmount/useCapitalAmount'

const harness = vi.hoisted(() => ({
  slots: [] as { current: unknown }[],
  index: 0,
  chains: [] as Chain[],
  refreshChains: vi.fn(),
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
  useCopyTradingContext: () => ({ chains: harness.chains, refreshChains: harness.refreshChains, chainsLoading: false }),
}))
vi.mock('hooks/useTokenBalance', () => ({
  default: () => ({ value: 100000000000000000000n, isLoading: false }),
}))

const token = { chainId: 8453, address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', decimals: 6 } as const
const chain: Chain = { chainId: 8453, name: 'Base', slug: 'base', iconUrl: '', isEnabled: true, quoteToken: token }
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
  harness.refreshChains.mockClear()
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

  it('leaves missing funding information unknown', () => {
    harness.chains = [{ ...chain, quoteToken: undefined }]
    CapitalAmountHarness().setAmount('1.25')
    expect(CapitalAmountHarness()).toMatchObject({ quoteToken: undefined, amountRaw: undefined, amountIsValid: false })
  })

  it.each(['chain', 'address', 'decimals'] as const)(
    'clears the amount and rejects old preparations after changing %s',
    change => {
      CapitalAmountHarness().setAmount('1.25')
      const oldForm = CapitalAmountHarness()
      const nextChainId = change === 'chain' ? 56 : 8453
      harness.chains = [
        {
          ...chain,
          chainId: nextChainId,
          quoteToken: {
            ...token,
            chainId: nextChainId,
            address: change === 'address' ? '0x1111111111111111111111111111111111111111' : token.address,
            decimals: change === 'decimals' ? 18 : 6,
          },
        },
      ]
      expect(CapitalAmountHarness(nextChainId)).toMatchObject({ amount: '', amountRaw: undefined })
      expect(() => oldForm.validatePreparation(preparation('startCopy'))).toThrow('Funding token information changed')
      expect(harness.refreshChains).toHaveBeenCalledOnce()
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
