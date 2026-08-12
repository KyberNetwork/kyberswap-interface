import { ChainId, Currency, Token, WETH } from '@kyberswap/ks-sdk-core'
import { describe, expect, it, vi } from 'vitest'

import {
  StopLossDisplayStatus,
  StopLossExecution,
  StopLossExecutionStatus,
  StopLossOrder,
  StopLossOrderStatus,
} from 'components/StopLoss/types'
import {
  MAX_STOP_LOSS_DEADLINE,
  buildStopLossPayload,
  clampStopLossDeadline,
  getStopLossDisplayStatus,
  getStopLossRecreateDraft,
  isActiveStopLossStatus,
  parseStopLossOrder,
  parseStopLossOrders,
  resolveExecutionAmountOut,
  stripEmptyEip712Salt,
} from 'components/StopLoss/utils'
import { NativeCurrencies } from 'constants/tokens'

const ORDER: StopLossOrder = {
  id: 4,
  chainId: ChainId.BASE,
  status: StopLossOrderStatus.OPEN,
  userWallet: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
  receiver: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
  tokenIn: '0x4200000000000000000000000000000000000006',
  tokenOut: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  amountIn: '100000000000000000',
  slippage: 50,
  condition: { field: { type: 'oracle_price', value: { lte: '2400', maxStaleness: 60 } } },
  deadline: 1783344543,
  hash: '9d47cd41',
  signature: '808d0da6',
  protocolFeePercentage: 0.15,
  category: 'commonPair',
  maxFeesPercentage: [1, 1],
  maxGasPercentage: 50,
  source: '',
  createdAt: 1783258149,
}

const execution = (status: StopLossExecutionStatus, executionNum = 0): StopLossExecution => ({
  hash: '0xb73e5fd3',
  executionNum,
  operatorWallet: '0x9965',
  status,
})

describe('getStopLossDisplayStatus', () => {
  it.each([
    [StopLossOrderStatus.DONE, StopLossDisplayStatus.EXECUTED],
    [StopLossOrderStatus.CANCELLED, StopLossDisplayStatus.CANCELLED],
    [StopLossOrderStatus.EXPIRED, StopLossDisplayStatus.EXPIRED],
  ] as const)('maps the terminal order status %s to %s', (status, expected) => {
    expect(getStopLossDisplayStatus({ ...ORDER, status })).toBe(expected)
  })

  it('is Active while open with no settlement attempt', () => {
    expect(getStopLossDisplayStatus(ORDER)).toBe(StopLossDisplayStatus.ACTIVE)
  })

  it.each([
    [StopLossExecutionStatus.CREATED, StopLossDisplayStatus.TRIGGERED],
    [StopLossExecutionStatus.PENDING, StopLossDisplayStatus.TRIGGERED],
    [StopLossExecutionStatus.FAILED, StopLossDisplayStatus.FAILED],
    [StopLossExecutionStatus.NOT_MINED, StopLossDisplayStatus.FAILED],
  ] as const)('derives %s from the latest execution as %s', (status, expected) => {
    expect(getStopLossDisplayStatus({ ...ORDER, executions: [execution(status)] })).toBe(expected)
  })

  it('reads only the latest attempt when an earlier one failed', () => {
    const order = {
      ...ORDER,
      executions: [execution(StopLossExecutionStatus.FAILED, 0), execution(StopLossExecutionStatus.PENDING, 1)],
    }
    expect(getStopLossDisplayStatus(order)).toBe(StopLossDisplayStatus.TRIGGERED)
  })

  it('reads the highest executionNum even when the array arrives out of order', () => {
    const order = {
      ...ORDER,
      executions: [execution(StopLossExecutionStatus.PENDING, 1), execution(StopLossExecutionStatus.FAILED, 0)],
    }
    expect(getStopLossDisplayStatus(order)).toBe(StopLossDisplayStatus.TRIGGERED)
  })

  it('keeps a successful attempt on an order the service has not settled yet as Active', () => {
    const order = { ...ORDER, executions: [execution(StopLossExecutionStatus.SUCCESS)] }
    expect(getStopLossDisplayStatus(order)).toBe(StopLossDisplayStatus.ACTIVE)
  })
})

describe('isActiveStopLossStatus', () => {
  it('keeps triggered orders in the active table but files a failure under history', () => {
    expect(isActiveStopLossStatus(StopLossDisplayStatus.ACTIVE)).toBe(true)
    expect(isActiveStopLossStatus(StopLossDisplayStatus.TRIGGERED)).toBe(true)
    // The service still calls a failed order `Open`; Active has no status column to explain it.
    expect(isActiveStopLossStatus(StopLossDisplayStatus.FAILED)).toBe(false)
    expect(isActiveStopLossStatus(StopLossDisplayStatus.EXECUTED)).toBe(false)
    expect(isActiveStopLossStatus(StopLossDisplayStatus.CANCELLED)).toBe(false)
    expect(isActiveStopLossStatus(StopLossDisplayStatus.EXPIRED)).toBe(false)
  })
})

describe('clampStopLossDeadline', () => {
  it('passes through a deadline the service accepts', () => {
    expect(clampStopLossDeadline(1790000000)).toBe(1790000000)
    expect(clampStopLossDeadline(MAX_STOP_LOSS_DEADLINE)).toBe(MAX_STOP_LOSS_DEADLINE)
  })

  it('caps an expires-never choice that would otherwise be rejected', () => {
    // now + 36500 days, the sentinel a "Never Expires" option produces
    expect(clampStopLossDeadline(4939594415)).toBe(MAX_STOP_LOSS_DEADLINE)
  })

  it('floors fractional seconds', () => {
    expect(clampStopLossDeadline(1790000000.9)).toBe(1790000000)
  })
})

describe('stripEmptyEip712Salt', () => {
  const typedData = {
    domain: { name: 'KSSmartIntentRouter', version: '1', chainId: '0x2105', verifyingContract: '0xFec4', salt: '' },
    types: { EIP712Domain: [] },
    message: {},
    primaryType: 'IntentData',
  }

  it('drops the empty salt strict signers reject', () => {
    expect(stripEmptyEip712Salt(typedData).domain).not.toHaveProperty('salt')
  })

  it('leaves the rest of the domain untouched', () => {
    expect(stripEmptyEip712Salt(typedData).domain).toEqual({
      name: 'KSSmartIntentRouter',
      version: '1',
      chainId: '0x2105',
      verifyingContract: '0xFec4',
    })
  })

  it('keeps a real salt', () => {
    const withSalt = { ...typedData, domain: { ...typedData.domain, salt: '0xabc' } }
    expect(stripEmptyEip712Salt(withSalt).domain).toHaveProperty('salt', '0xabc')
  })
})

describe('buildStopLossPayload', () => {
  const USDC = new Token(ChainId.BASE, '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 6, 'USDC')
  const WETH_BASE = WETH[ChainId.BASE]
  const NATIVE = NativeCurrencies[ChainId.BASE]

  const params = {
    chainId: ChainId.BASE,
    account: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
    currencyIn: WETH_BASE,
    currencyOut: USDC as Currency,
    inputAmount: '0.1',
    triggerPrice: '2400',
    slippage: 50,
    expiredAt: 1790000000_000,
    maxFeesPercentage: [1, 1],
    maxGasPercentage: 50,
  }

  it('converts the human amount to raw units of the sold token', () => {
    expect(buildStopLossPayload(params).amountIn).toBe('100000000000000000')
  })

  it('sells the wrapped token when the form holds native currency', () => {
    const payload = buildStopLossPayload({ ...params, currencyIn: NATIVE })
    expect(payload.tokenIn).toBe(WETH_BASE.address)
  })

  it('converts the expiry from milliseconds to seconds', () => {
    expect(buildStopLossPayload(params).deadline).toBe(1790000000)
  })

  it('caps an expires-never deadline the service would reject', () => {
    expect(buildStopLossPayload({ ...params, expiredAt: 4939594415_000 }).deadline).toBe(MAX_STOP_LOSS_DEADLINE)
  })

  it('carries the trigger as an lte condition and leaves staleness to the feed default', () => {
    expect(buildStopLossPayload(params).condition).toEqual({
      field: { type: 'oracle_price', value: { lte: '2400' } },
    })
  })

  it('omits the optional source field when unset', () => {
    expect(buildStopLossPayload(params)).not.toHaveProperty('source')
  })
})

describe('resolveExecutionAmountOut', () => {
  const USDC_OUT = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
  const withExtra = (amount: string, amountUsd?: string, priceUsd?: string): StopLossExecution => ({
    ...execution(StopLossExecutionStatus.SUCCESS),
    extraData: {
      amountOut: { amount, amountUsd },
      tokensInfo: priceUsd ? [{ address: USDC_OUT, priceUsd, decimal: 6 }] : undefined,
    },
  })

  it('reads a raw value as raw when the USD figure agrees', () => {
    // 176235015 raw USDC = 176.235 USDC ≈ $176.24
    expect(resolveExecutionAmountOut(withExtra('176235015', '176.24', '1.0'), USDC_OUT, 6)).toBeCloseTo(176.235015, 5)
  })

  it('reads a human value as human when the raw reading contradicts the USD figure', () => {
    // 1500 as raw would be 0.0015 USDC ≈ $0.0015, nowhere near the reported $1500
    expect(resolveExecutionAmountOut(withExtra('1500', '1500', '1.0'), USDC_OUT, 6)).toBe(1500)
  })

  it('falls back to the documented raw reading when there is nothing to check against', () => {
    expect(resolveExecutionAmountOut(withExtra('176235015'), USDC_OUT, 6)).toBeCloseTo(176.235015, 5)
  })

  it('ignores a token entry for a different address', () => {
    const wrongToken = withExtra('176235015', '176.24', '1.0')
    expect(resolveExecutionAmountOut(wrongToken, '0x0000000000000000000000000000000000000001', 6)).toBeCloseTo(
      176.235015,
      5,
    )
  })

  it.each([
    ['no execution', undefined],
    ['a missing amount', { ...execution(StopLossExecutionStatus.SUCCESS), extraData: {} }],
    [
      'a non-numeric amount',
      { ...execution(StopLossExecutionStatus.SUCCESS), extraData: { amountOut: { amount: 'n/a' } } },
    ],
  ])('returns nothing for %s', (_label, input) => {
    expect(resolveExecutionAmountOut(input as StopLossExecution | undefined, USDC_OUT, 6)).toBeUndefined()
  })

  it('returns nothing when the token decimals are unknown', () => {
    expect(resolveExecutionAmountOut(withExtra('176235015'), USDC_OUT, undefined)).toBeUndefined()
  })
})

describe('parseStopLossOrder', () => {
  it('accepts a well-formed order and coerces a string chainId', () => {
    expect(parseStopLossOrder({ ...ORDER, chainId: '8453' })?.chainId).toBe(ChainId.BASE)
  })

  it.each([
    ['a non-numeric amountIn', { amountIn: '0.1' }],
    ['a missing amountIn', { amountIn: undefined }],
    ['an unsupported chain', { chainId: 999999 }],
    ['an unknown status', { status: 'OrderStatusSomethingNew' }],
    ['a missing trigger price', { condition: { field: { type: 'oracle_price', value: {} } } }],
    ['a missing tokenOut', { tokenOut: '' }],
    ['a non-numeric slippage', { slippage: '50' }],
  ])('rejects %s', (_label, patch) => {
    expect(parseStopLossOrder({ ...ORDER, ...patch })).toBeNull()
  })

  it('rejects a non-object', () => {
    expect(parseStopLossOrder(null)).toBeNull()
    expect(parseStopLossOrder('order')).toBeNull()
  })
})

describe('parseStopLossOrders', () => {
  it('drops only the invalid rows and reports how many', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const orders = parseStopLossOrders([ORDER, { ...ORDER, amountIn: 'not-a-number' }, { ...ORDER, id: 5 }])

    expect(orders.map(order => order.id)).toEqual([4, 5])
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('Dropped 1 of 3'))
    consoleError.mockRestore()
  })

  it('returns an empty list for a missing orders array', () => {
    expect(parseStopLossOrders(undefined)).toEqual([])
  })
})

describe('getStopLossRecreateDraft', () => {
  const DEFAULT_EXPIRE = 30 * 24 * 60 * 60

  it('carries the trigger price and slippage of the original order', () => {
    expect(getStopLossRecreateDraft(ORDER, DEFAULT_EXPIRE)).toMatchObject({ triggerPrice: '2400', slippage: 50 })
  })

  it('carries expiry as the original duration, not its past deadline', () => {
    // The fixture ran 1783258149 → 1783344543, i.e. one day.
    expect(getStopLossRecreateDraft(ORDER, DEFAULT_EXPIRE).expire).toBe(ORDER.deadline - ORDER.createdAt)
    expect(getStopLossRecreateDraft(ORDER, DEFAULT_EXPIRE).expire).toBe(86394)
  })

  it('falls back to the default when the recorded window is not a positive duration', () => {
    const sameInstant = { ...ORDER, deadline: ORDER.createdAt }
    const reversed = { ...ORDER, deadline: ORDER.createdAt - 1000 }
    expect(getStopLossRecreateDraft(sameInstant, DEFAULT_EXPIRE).expire).toBe(DEFAULT_EXPIRE)
    expect(getStopLossRecreateDraft(reversed, DEFAULT_EXPIRE).expire).toBe(DEFAULT_EXPIRE)
  })

  it('falls back to the default slippage when the order carries none', () => {
    expect(getStopLossRecreateDraft({ ...ORDER, slippage: 0 }, DEFAULT_EXPIRE).slippage).toBe(50)
  })

  it('yields an empty trigger when the condition is missing rather than throwing', () => {
    const noCondition = { ...ORDER, condition: undefined } as unknown as typeof ORDER
    expect(getStopLossRecreateDraft(noCondition, DEFAULT_EXPIRE).triggerPrice).toBe('')
  })
})
