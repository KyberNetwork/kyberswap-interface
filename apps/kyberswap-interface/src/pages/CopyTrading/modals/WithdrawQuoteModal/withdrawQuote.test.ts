import { describe, expect, it } from 'vitest'

import {
  UINT256_MAX_RAW,
  getWithdrawRequestAmountRaw,
  validateWithdrawAmountRaw,
  validateWithdrawPreview,
} from './withdrawQuote'

describe('withdraw quote request', () => {
  it.each(['1', UINT256_MAX_RAW])('accepts canonical positive uint256 %s', amountRaw => {
    expect(validateWithdrawAmountRaw(amountRaw)).toBeUndefined()
  })

  it.each(['', '0', '-1', '+1', '01', '1.5', ' 1', `${UINT256_MAX_RAW}0`])('rejects invalid amount %s', amountRaw => {
    expect(validateWithdrawAmountRaw(amountRaw)).toBeTruthy()
  })

  it('uses uint256.max only after the Max preset is selected', () => {
    expect(getWithdrawRequestAmountRaw('42', false)).toBe('42')
    expect(getWithdrawRequestAmountRaw('42', true)).toBe(UINT256_MAX_RAW)
  })

  it('requires a ready preview to remain bound to the exact request', () => {
    const preview = {
      recipientAddress: '0x1111111111111111111111111111111111111111',
      sweepAmountRaw: '42',
      quoteBalance: { valueRaw: '100', status: 'METRIC_STATUS_CURRENT' as const },
    }

    expect(
      validateWithdrawPreview({
        amountRaw: '42',
        ownerAddress: '0x1111111111111111111111111111111111111111',
        preview,
      }),
    ).toBeUndefined()
    expect(
      validateWithdrawPreview({
        amountRaw: '41',
        ownerAddress: '0x1111111111111111111111111111111111111111',
        preview,
      }),
    ).toBe('The prepared withdrawal amount does not match the requested amount.')
  })

  it('rejects exact withdrawals above the prepared Smart Wallet balance', () => {
    expect(
      validateWithdrawPreview({
        amountRaw: '101',
        ownerAddress: '0x1111111111111111111111111111111111111111',
        preview: {
          recipientAddress: '0x1111111111111111111111111111111111111111',
          sweepAmountRaw: '101',
          quoteBalance: { valueRaw: '100', status: 'METRIC_STATUS_CURRENT' },
        },
      }),
    ).toBe('The Smart Wallet quote balance is lower than the requested amount.')
  })

  it('rejects unavailable balance evidence and a changed quote token', () => {
    const base = {
      amountRaw: '42',
      expectedQuoteToken: { address: '0x2222222222222222222222222222222222222222', decimals: 6 },
      ownerAddress: '0x1111111111111111111111111111111111111111',
    }
    expect(
      validateWithdrawPreview({
        ...base,
        preview: {
          recipientAddress: base.ownerAddress,
          sweepAmountRaw: '42',
          quoteBalance: { valueRaw: '100', status: 'METRIC_STATUS_UNAVAILABLE' },
        },
      }),
    ).toBe('The prepared withdrawal is missing its quote-balance evidence.')
    expect(
      validateWithdrawPreview({
        ...base,
        preview: {
          recipientAddress: base.ownerAddress,
          sweepAmountRaw: '42',
          quoteBalance: { valueRaw: '100', status: 'METRIC_STATUS_CURRENT' },
          quoteToken: { address: '0x3333333333333333333333333333333333333333', decimals: 6 },
        },
      }),
    ).toBe('The prepared quote token does not match the selected balance.')
  })
})
