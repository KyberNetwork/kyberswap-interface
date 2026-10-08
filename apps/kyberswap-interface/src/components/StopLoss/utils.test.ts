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
  getStopLossFills,
  getStopLossRecreateDraft,
  getTriggerProximity,
  isActiveStopLossStatus,
  parseStopLossOrder,
  parseStopLossOrders,
  resolveExecutionAmountIn,
  resolveExecutionAmountOut,
  stripEmptyEip712Salt,
  summarizeStopLossFills,
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
    [StopLossExecutionStatus.FAILED, StopLossDisplayStatus.ACTIVE],
    [StopLossExecutionStatus.NOT_MINED, StopLossDisplayStatus.ACTIVE],
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
  it('keeps triggered orders in the active table and finished ones under history', () => {
    expect(isActiveStopLossStatus(StopLossDisplayStatus.ACTIVE)).toBe(true)
    expect(isActiveStopLossStatus(StopLossDisplayStatus.TRIGGERED)).toBe(true)
    expect(isActiveStopLossStatus(StopLossDisplayStatus.FAILED)).toBe(false)
    expect(isActiveStopLossStatus(StopLossDisplayStatus.EXECUTED)).toBe(false)
    expect(isActiveStopLossStatus(StopLossDisplayStatus.CANCELLED)).toBe(false)
    expect(isActiveStopLossStatus(StopLossDisplayStatus.EXPIRED)).toBe(false)
  })
})

describe('getTriggerProximity', () => {
  it('grades a trigger below the market by how far it sits', () => {
    expect(getTriggerProximity(-20)).toBe('far')
    expect(getTriggerProximity(-10)).toBe('far')
    expect(getTriggerProximity(-6.6)).toBe('near')
    expect(getTriggerProximity(-5)).toBe('near')
    expect(getTriggerProximity(-4.9)).toBe('imminent')
    expect(getTriggerProximity(-0.0001)).toBe('imminent')
  })

  it('judges the distance as displayed, so 9.96% reads and grades as 10.0%', () => {
    expect(getTriggerProximity(-9.96)).toBe('far')
    expect(getTriggerProximity(-4.96)).toBe('near')
  })

  it('treats a trigger at or above the market as imminent', () => {
    expect(getTriggerProximity(0)).toBe('imminent')
    expect(getTriggerProximity(25)).toBe('imminent')
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

describe('resolveExecutionAmountIn', () => {
  const WETH_IN = '0x4200000000000000000000000000000000000006'
  const sold = (amount: string, amountUsd?: string, priceUsd?: string): StopLossExecution => ({
    ...execution(StopLossExecutionStatus.SUCCESS),
    extraData: {
      amountIn: { amount, amountUsd },
      tokensInfo: priceUsd ? [{ address: WETH_IN, priceUsd, decimal: 18 }] : undefined,
    },
  })

  it('falls back to the documented human reading when there is nothing to check against', () => {
    expect(resolveExecutionAmountIn(sold('2'), WETH_IN, 18)).toBe(2)
  })

  it('reads a raw value as raw when the USD figure agrees', () => {
    expect(resolveExecutionAmountIn(sold('100000000000000000', '250', '2500'), WETH_IN, 18)).toBeCloseTo(0.1, 10)
  })

  it('reads a fraction as human, since no raw amount has one', () => {
    expect(resolveExecutionAmountIn(sold('0.25'), WETH_IN, 18)).toBe(0.25)
    expect(resolveExecutionAmountOut({ ...sold('0'), extraData: { amountOut: { amount: '12.5' } } }, WETH_IN, 6)).toBe(
      12.5,
    )
  })
})

describe('getStopLossFills', () => {
  const fill = (
    executionNum: number,
    status: StopLossExecutionStatus,
    amountIn: string,
    amountOut: string,
    price: string,
  ) => ({
    ...execution(status, executionNum),
    hash: `0xfill${executionNum}`,
    extraData: { amountIn: { amount: amountIn }, amountOut: { amount: amountOut }, oraclePrice: price },
  })

  it('keeps only the executions that went through, oldest first', () => {
    const order: StopLossOrder = {
      ...ORDER,
      executions: [
        fill(2, StopLossExecutionStatus.SUCCESS, '0.06', '144000000', '2400'),
        fill(0, StopLossExecutionStatus.SUCCESS, '0.04', '95200000', '2380'),
        fill(1, StopLossExecutionStatus.FAILED, '0.06', '0', '2390'),
      ],
    }
    expect(getStopLossFills(order, 18, 6)).toEqual([
      { hash: '0xfill0', amountIn: 0.04, amountOut: 95.2, price: 2380 },
      { hash: '0xfill2', amountIn: 0.06, amountOut: 144, price: 2400 },
    ])
  })

  it('has no fills before an execution succeeds', () => {
    expect(getStopLossFills(ORDER, 18, 6)).toEqual([])
    expect(getStopLossFills({ ...ORDER, executions: [execution(StopLossExecutionStatus.PENDING)] }, 18, 6)).toEqual([])
  })

  it('leaves a price the execution does not report unset', () => {
    const order = { ...ORDER, executions: [fill(0, StopLossExecutionStatus.SUCCESS, '0.1', '240000000', '')] }
    expect(getStopLossFills(order, 18, 6)[0].price).toBeUndefined()
  })
})

describe('summarizeStopLossFills', () => {
  it('reads a single fill as is', () => {
    expect(summarizeStopLossFills([{ hash: 'a', amountIn: 0.1, amountOut: 240, price: 2400 }])).toEqual({
      amountIn: 0.1,
      amountOut: 240,
      price: 2400,
    })
  })

  it('totals the fills and weighs their prices by what each sold', () => {
    const summary = summarizeStopLossFills([
      { hash: 'a', amountIn: 0.04, amountOut: 95.2, price: 2380 },
      { hash: 'b', amountIn: 0.06, amountOut: 144, price: 2400 },
    ])
    expect(summary.amountIn).toBeCloseTo(0.1, 10)
    expect(summary.amountOut).toBeCloseTo(239.2, 10)
    expect(summary.price).toBeCloseTo(2392, 10)
  })

  it("prefers the order's own amount for the total sold", () => {
    const fills = [
      { hash: 'a', amountIn: 0.04, amountOut: 95.2, price: 2380 },
      { hash: 'b', amountIn: 0.06, amountOut: 144, price: 2400 },
    ]
    expect(summarizeStopLossFills(fills, 0.1).amountIn).toBe(0.1)
  })

  it('gives no total when a fill does not report its part, rather than an understated one', () => {
    const summary = summarizeStopLossFills([
      { hash: 'a', amountOut: 95.2, price: 2380 },
      { hash: 'b', amountIn: 0.06, price: 2400 },
    ])
    expect(summary.amountIn).toBeUndefined()
    expect(summary.amountOut).toBeUndefined()
    // Sizes unknown, so the prices are averaged plainly.
    expect(summary.price).toBe(2390)
  })

  it('is empty without fills', () => {
    expect(summarizeStopLossFills([])).toEqual({})
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

  it("leaves the slippage unset when the order carries none, so the pair's suggestion applies", () => {
    expect(getStopLossRecreateDraft({ ...ORDER, slippage: 0 }, DEFAULT_EXPIRE).slippage).toBeUndefined()
  })

  it('yields an empty trigger when the condition is missing rather than throwing', () => {
    const noCondition = { ...ORDER, condition: undefined } as unknown as typeof ORDER
    expect(getStopLossRecreateDraft(noCondition, DEFAULT_EXPIRE).triggerPrice).toBe('')
  })
})
