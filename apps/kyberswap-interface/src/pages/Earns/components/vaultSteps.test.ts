import { describe, expect, it } from 'vitest'

import { VAULT_ACTION_STEP, getVaultStepLabel, vaultApproveStep } from 'pages/Earns/components/vaultSteps'
import { formatVaultAmounts } from 'pages/Earns/utils/vaultFormat'

describe('formatVaultAmounts', () => {
  it('names one token with its amount', () => {
    expect(formatVaultAmounts([{ amount: '0.00030904', symbol: 'eBTC' }])).toBe('0.00030904 eBTC')
  })

  it('joins two tokens', () => {
    expect(
      formatVaultAmounts([
        { amount: '0.1', symbol: 'ETH' },
        { amount: '25', symbol: 'USDC' },
      ]),
    ).toBe('0.1 ETH + 25 USDC')
  })

  it('counts the tokens once naming them would outgrow the row', () => {
    expect(
      formatVaultAmounts([
        { amount: '0.1', symbol: 'ETH' },
        { amount: '25', symbol: 'USDC' },
        { amount: '3', symbol: 'DAI' },
      ]),
    ).toBe('3 tokens')
  })

  it('has nothing to say about nothing', () => {
    expect(formatVaultAmounts([])).toBe('')
  })
})

describe('getVaultStepLabel', () => {
  it('reports what a deposit moved', () => {
    const label = getVaultStepLabel({ kind: 'deposit', actionSummary: '0.00030904 eBTC' })
    expect(label(VAULT_ACTION_STEP, 'success')).toBe('Deposited 0.00030904 eBTC')
    expect(label(VAULT_ACTION_STEP, 'active')).toBe('Depositing')
  })

  it('reports what a withdrawal sold and what a request queued', () => {
    expect(
      getVaultStepLabel({ kind: 'withdraw', actionSummary: '0.0002 liquidBTC' })(VAULT_ACTION_STEP, 'success'),
    ).toBe('Withdrawn 0.0002 liquidBTC')
    expect(
      getVaultStepLabel({ kind: 'request', actionSummary: '0.0002 liquidBTC' })(VAULT_ACTION_STEP, 'success'),
    ).toBe('Requested 0.0002 liquidBTC')
  })

  it('falls back to the bare wording when the amounts are not known', () => {
    expect(getVaultStepLabel({ kind: 'deposit' })(VAULT_ACTION_STEP, 'success')).toBe('Deposited')
    expect(getVaultStepLabel({ kind: 'request' })(VAULT_ACTION_STEP, 'success')).toBe('Request submitted')
  })

  it('leaves the approval steps to their own wording', () => {
    const step = vaultApproveStep('0xabc')
    const label = getVaultStepLabel({ kind: 'deposit', approveSymbols: { [step]: 'USDC' }, actionSummary: '1 USDC' })
    expect(label(step, 'success')).not.toContain('Deposited')
  })
})
