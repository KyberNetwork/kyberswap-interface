import { describe, expect, it } from 'vitest'

import { isCancelledByNonce } from 'components/LimitOrder/CancelOrder/useCancellingOrders'
import { LimitOrderStatus } from 'components/LimitOrder/types'

const CONTRACT = '0xcab2fa2eeab7065b45cbcf6e3936dde2506b4f6c'
const order = (nonce: number, status = LimitOrderStatus.ACTIVE, contractAddress = CONTRACT) => ({
  nonce,
  status,
  contractAddress,
})

describe('isCancelledByNonce', () => {
  it('takes an active order signed below the maker nonce as cancelled', () => {
    expect(isCancelledByNonce(order(2), CONTRACT, 3n)).toBe(true)
  })

  it('keeps an order signed at the maker nonce', () => {
    expect(isCancelledByNonce(order(3), CONTRACT, 3n)).toBe(false)
  })

  it('matches the contract in any letter case', () => {
    expect(isCancelledByNonce(order(2), CONTRACT.toUpperCase().replace('0X', '0x'), 3n)).toBe(true)
  })

  it('ignores orders on another contract', () => {
    expect(
      isCancelledByNonce(order(2, LimitOrderStatus.ACTIVE, '0x0000000000000000000000000000000000000001'), CONTRACT, 3n),
    ).toBe(false)
  })

  it('ignores orders no longer active', () => {
    expect(isCancelledByNonce(order(2, LimitOrderStatus.CANCELLED), CONTRACT, 3n)).toBe(false)
  })

  it('decides nothing before the nonce is read', () => {
    expect(isCancelledByNonce(order(2), CONTRACT, undefined)).toBe(false)
    expect(isCancelledByNonce(order(2), '', 3n)).toBe(false)
  })
})
