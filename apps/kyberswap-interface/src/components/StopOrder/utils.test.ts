import { ChainId, Currency, Token, WETH } from '@kyberswap/ks-sdk-core'
import { describe, expect, it, vi } from 'vitest'

import {
  StopOrder,
  StopOrderDisplayStatus,
  StopOrderExecution,
  StopOrderExecutionStatus,
  StopOrderStatus,
} from 'components/StopOrder/types'
import {
  MAX_STOP_ORDER_DEADLINE,
  buildStopOrderPayload,
  clampStopOrderDeadline,
  formatDistanceMagnitude,
  formatTriggerPriceValue,
  getStopOrderCurrentPrice,
  getStopOrderDisplayStatus,
  getStopOrderFills,
  getStopOrderFundingKey,
  getStopOrderFundingShortfalls,
  getStopOrderPairKey,
  getStopOrderRecreateDraft,
  getStopOrderSellAmountUsd,
  getStopOrderServiceErrorMessage,
  getStopOrderWarnings,
  getTriggerProximity,
  groupStopOrderTokensByChain,
  hasReservedBalanceShortfall,
  isActiveStopOrderStatus,
  matchExpiryPreset,
  parseRawAmount,
  parseStopOrder,
  parseStopOrders,
  resolveExecutionAmountIn,
  resolveExecutionAmountOut,
  stripEmptyEip712Salt,
  summarizeStopOrderFills,
} from 'components/StopOrder/utils'
import { NativeCurrencies } from 'constants/tokens'

const ORDER: StopOrder = {
  id: 4,
  chainId: ChainId.BASE,
  status: StopOrderStatus.OPEN,
  userWallet: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
  receiver: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
  tokenIn: '0x4200000000000000000000000000000000000006',
  tokenOut: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  amountIn: '100000000000000000',
  tokenInInfo: { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', decimals: 18 },
  tokenOutInfo: { address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', symbol: 'USDC', decimals: 6 },
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

const execution = (status: StopOrderExecutionStatus, executionNum = 0): StopOrderExecution => ({
  hash: '0xb73e5fd3',
  executionNum,
  operatorWallet: '0x9965',
  status,
})

describe('getStopOrderDisplayStatus', () => {
  it.each([
    [StopOrderStatus.DONE, StopOrderDisplayStatus.EXECUTED],
    [StopOrderStatus.CANCELLED, StopOrderDisplayStatus.CANCELLED],
    [StopOrderStatus.EXPIRED, StopOrderDisplayStatus.EXPIRED],
  ] as const)('maps the terminal order status %s to %s', (status, expected) => {
    expect(getStopOrderDisplayStatus({ ...ORDER, status })).toBe(expected)
  })

  it('is Active while open with no settlement attempt', () => {
    expect(getStopOrderDisplayStatus(ORDER)).toBe(StopOrderDisplayStatus.ACTIVE)
  })

  it.each([
    [StopOrderExecutionStatus.CREATED, StopOrderDisplayStatus.TRIGGERED],
    [StopOrderExecutionStatus.PENDING, StopOrderDisplayStatus.TRIGGERED],
    [StopOrderExecutionStatus.FAILED, StopOrderDisplayStatus.ACTIVE],
    [StopOrderExecutionStatus.NOT_MINED, StopOrderDisplayStatus.ACTIVE],
  ] as const)('derives %s from the latest execution as %s', (status, expected) => {
    expect(getStopOrderDisplayStatus({ ...ORDER, executions: [execution(status)] })).toBe(expected)
  })

  it('reads only the latest attempt when an earlier one failed', () => {
    const order = {
      ...ORDER,
      executions: [execution(StopOrderExecutionStatus.FAILED, 0), execution(StopOrderExecutionStatus.PENDING, 1)],
    }
    expect(getStopOrderDisplayStatus(order)).toBe(StopOrderDisplayStatus.TRIGGERED)
  })

  it('reads the highest executionNum even when the array arrives out of order', () => {
    const order = {
      ...ORDER,
      executions: [execution(StopOrderExecutionStatus.PENDING, 1), execution(StopOrderExecutionStatus.FAILED, 0)],
    }
    expect(getStopOrderDisplayStatus(order)).toBe(StopOrderDisplayStatus.TRIGGERED)
  })

  it('keeps a successful attempt on an order the service has not settled yet as Active', () => {
    const order = { ...ORDER, executions: [execution(StopOrderExecutionStatus.SUCCESS)] }
    expect(getStopOrderDisplayStatus(order)).toBe(StopOrderDisplayStatus.ACTIVE)
  })
})

describe('isActiveStopOrderStatus', () => {
  it('keeps triggered orders in the active table and finished ones under history', () => {
    expect(isActiveStopOrderStatus(StopOrderDisplayStatus.ACTIVE)).toBe(true)
    expect(isActiveStopOrderStatus(StopOrderDisplayStatus.TRIGGERED)).toBe(true)
    expect(isActiveStopOrderStatus(StopOrderDisplayStatus.EXECUTED)).toBe(false)
    expect(isActiveStopOrderStatus(StopOrderDisplayStatus.CANCELLED)).toBe(false)
    expect(isActiveStopOrderStatus(StopOrderDisplayStatus.EXPIRED)).toBe(false)
  })
})

describe('formatDistanceMagnitude', () => {
  it('shows one decimal, keeping the trailing zero', () => {
    expect(formatDistanceMagnitude(-6.62)).toBe('6.6')
    expect(formatDistanceMagnitude(-10)).toBe('10.0')
    expect(formatDistanceMagnitude(-0.2858)).toBe('0.3')
    expect(formatDistanceMagnitude(0.1504)).toBe('0.2')
  })

  it('rounds a sub-1% distance rather than truncating it', () => {
    expect(formatDistanceMagnitude(-0.0941)).toBe('0.1')
    expect(formatDistanceMagnitude(-0.96)).toBe('1.0')
  })

  it('keeps the first significant digit of a distance that one decimal would round to zero', () => {
    expect(formatDistanceMagnitude(-0.023)).toBe('0.02')
    expect(formatDistanceMagnitude(-0.00344)).toBe('0.003')
    expect(formatDistanceMagnitude(-0.000092)).toBe('0.0₄9')
  })

  it('rounds to the requested decimals, as a fill gap uses two', () => {
    expect(formatDistanceMagnitude(0.1278, 2)).toBe('0.13')
    expect(formatDistanceMagnitude(-1.5, 2)).toBe('1.50')
    expect(formatDistanceMagnitude(0.0034, 2)).toBe('0.003')
  })

  it('reads zero only for a trigger exactly at the market', () => {
    expect(formatDistanceMagnitude(0)).toBe('0.0')
  })
})

describe('formatTriggerPriceValue', () => {
  it('writes a price with six significant digits, as the oracle price is shown', () => {
    expect(formatTriggerPriceValue(1.000363975)).toBe('1.00036')
    expect(formatTriggerPriceValue(2381.750123)).toBe('2381.75')
    expect(formatTriggerPriceValue(0.001378563)).toBe('0.00137856')
    expect(formatTriggerPriceValue(0.000000123456789)).toBe('0.000000123457')
  })

  it('keeps every integer digit and drops trailing zeros', () => {
    expect(formatTriggerPriceValue(123456789.4)).toBe('123456789')
    expect(formatTriggerPriceValue(2.5)).toBe('2.5')
    expect(formatTriggerPriceValue(0)).toBe('0')
  })

  it('writes nothing for a value that is not a price', () => {
    expect(formatTriggerPriceValue(undefined)).toBe('')
    expect(formatTriggerPriceValue(-1)).toBe('')
    expect(formatTriggerPriceValue(Number.NaN)).toBe('')
  })
})

describe('getTriggerProximity', () => {
  it('grades a trigger below the market by how far it sits', () => {
    expect(getTriggerProximity(-20)).toBe('far')
    expect(getTriggerProximity(-5.1)).toBe('far')
    expect(getTriggerProximity(-5)).toBe('near')
    expect(getTriggerProximity(-1)).toBe('near')
    expect(getTriggerProximity(-0.9)).toBe('imminent')
    expect(getTriggerProximity(-0.0001)).toBe('imminent')
  })

  it('judges the distance as displayed, so 5.04% grades as 5.0% and 0.96% as 1.0%', () => {
    expect(getTriggerProximity(-5.04)).toBe('near')
    expect(getTriggerProximity(-0.96)).toBe('near')
  })

  it('grades a trigger above the market by the same distances', () => {
    expect(getTriggerProximity(0)).toBe('imminent')
    expect(getTriggerProximity(3)).toBe('near')
    expect(getTriggerProximity(25)).toBe('far')
  })
})

describe('clampStopOrderDeadline', () => {
  it('passes through a deadline the service accepts', () => {
    expect(clampStopOrderDeadline(1790000000)).toBe(1790000000)
    expect(clampStopOrderDeadline(MAX_STOP_ORDER_DEADLINE)).toBe(MAX_STOP_ORDER_DEADLINE)
  })

  it('caps an expires-never choice that would otherwise be rejected', () => {
    // now + 36500 days, the sentinel a "Never Expires" option produces
    expect(clampStopOrderDeadline(4939594415)).toBe(MAX_STOP_ORDER_DEADLINE)
  })

  it('floors fractional seconds', () => {
    expect(clampStopOrderDeadline(1790000000.9)).toBe(1790000000)
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

describe('buildStopOrderPayload', () => {
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
    expect(buildStopOrderPayload(params).amountIn).toBe('100000000000000000')
  })

  it('sells the wrapped token when the form holds native currency', () => {
    const payload = buildStopOrderPayload({ ...params, currencyIn: NATIVE })
    expect(payload.tokenIn).toBe(WETH_BASE.address)
  })

  it('converts the expiry from milliseconds to seconds', () => {
    expect(buildStopOrderPayload(params).deadline).toBe(1790000000)
  })

  it('caps an expires-never deadline the service would reject', () => {
    expect(buildStopOrderPayload({ ...params, expiredAt: 4939594415_000 }).deadline).toBe(MAX_STOP_ORDER_DEADLINE)
  })

  it('carries the trigger as an lte condition and leaves staleness to the feed default', () => {
    expect(buildStopOrderPayload(params).condition).toEqual({
      field: { type: 'oracle_price', value: { lte: '2400' } },
    })
  })

  it('omits the optional source field when unset', () => {
    expect(buildStopOrderPayload(params)).not.toHaveProperty('source')
  })
})

describe('resolveExecutionAmountOut', () => {
  const withAmount = (amount?: string): StopOrderExecution => ({
    ...execution(StopOrderExecutionStatus.SUCCESS),
    extraData: { amountOut: { amount, amountWei: 1, amountUsd: '176.24' } },
  })

  it("reads the amount as the token's human units, whole or fractional", () => {
    expect(resolveExecutionAmountOut(withAmount('176.235015'))).toBeCloseTo(176.235015, 6)
    expect(resolveExecutionAmountOut(withAmount('1500'))).toBe(1500)
  })

  it.each([
    ['no execution', undefined],
    ['a missing amount', withAmount(undefined)],
    ['a non-numeric amount', withAmount('n/a')],
  ])('returns nothing for %s', (_label, input) => {
    expect(resolveExecutionAmountOut(input)).toBeUndefined()
  })
})

describe('resolveExecutionAmountIn', () => {
  it("reads the amount as the token's human units", () => {
    const sold: StopOrderExecution = {
      ...execution(StopOrderExecutionStatus.SUCCESS),
      extraData: { amountIn: { amount: '0.25', amountWei: 250000000000000000 } },
    }
    expect(resolveExecutionAmountIn(sold)).toBe(0.25)
  })
})

describe('getStopOrderFundingShortfalls', () => {
  const amountIn = '100000000000000000'

  it('names whichever holding falls short of the amount', () => {
    expect(getStopOrderFundingShortfalls(amountIn, 50000000000000000n, 200000000000000000n)).toEqual(['balance'])
    expect(getStopOrderFundingShortfalls(amountIn, 200000000000000000n, 0n)).toEqual(['allowance'])
    expect(getStopOrderFundingShortfalls(amountIn, 0n, 0n)).toEqual(['balance', 'allowance'])
  })

  it('is satisfied by holdings equal to the amount', () => {
    expect(getStopOrderFundingShortfalls(amountIn, 100000000000000000n, 100000000000000000n)).toEqual([])
  })

  it('does not count a figure that has not been read yet', () => {
    expect(getStopOrderFundingShortfalls(amountIn, undefined, undefined)).toEqual([])
    expect(getStopOrderFundingShortfalls(amountIn, undefined, 0n)).toEqual(['allowance'])
  })
})

describe('groupStopOrderTokensByChain', () => {
  const USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
  const BUSD = '0xe9e7cea3dedca5984780bafc599bd69add087d56'

  it('asks each chain once for its distinct sell tokens, in a stable order', () => {
    const orders = [
      { ...ORDER, id: 1, tokenIn: USDC },
      { ...ORDER, id: 2, chainId: ChainId.BSCMAINNET, tokenIn: BUSD },
      { ...ORDER, id: 3, tokenIn: ORDER.tokenIn },
      { ...ORDER, id: 4, tokenIn: USDC.toLowerCase() },
    ]
    expect(groupStopOrderTokensByChain(orders)).toEqual([
      { chainId: ChainId.BSCMAINNET, tokens: [BUSD] },
      { chainId: ChainId.BASE, tokens: [ORDER.tokenIn.toLowerCase(), USDC.toLowerCase()].sort() },
    ])
  })

  it('keys a token the same way whatever its case', () => {
    expect(getStopOrderFundingKey(ChainId.BASE, USDC)).toBe(getStopOrderFundingKey(ChainId.BASE, USDC.toLowerCase()))
  })
})

describe('parseRawAmount', () => {
  it('reads an integer string', () => {
    expect(parseRawAmount('3000000000000000000')).toBe(3000000000000000000n)
  })

  it('counts nothing for a missing or malformed figure', () => {
    expect(parseRawAmount(undefined)).toBe(0n)
    expect(parseRawAmount('')).toBe(0n)
    expect(parseRawAmount('1.5')).toBe(0n)
    expect(parseRawAmount('abc')).toBe(0n)
  })
})

describe('hasReservedBalanceShortfall', () => {
  it('is short when less is left than the open orders claim', () => {
    expect(hasReservedBalanceShortfall(2n, 3n)).toBe(true)
    expect(hasReservedBalanceShortfall(-1n, 3n)).toBe(true)
  })

  it('is covered by exactly what the orders claim', () => {
    expect(hasReservedBalanceShortfall(3n, 3n)).toBe(false)
  })

  it('is never short when nothing is claimed', () => {
    expect(hasReservedBalanceShortfall(0n, 0n)).toBe(false)
    expect(hasReservedBalanceShortfall(-5n, 0n)).toBe(false)
  })
})

describe('getStopOrderServiceErrorMessage', () => {
  it('reads the root cause out of a domain refusal', () => {
    const error = {
      status: 400,
      data: {
        code: 4004,
        message:
          'DOMAIN ERROR: {Code: DOMAIN:INVALID, Message: Domain error: Input is invalid , ErrorEntities: [slippage], RootCause: slippage must exceed the maximum fees charged on tokenOut: slippage 2 bps, needs more than 539 bps (protocol fee 2.5 + gas headroom 536.5)}',
        errorEntities: ['slippage'],
      },
    }
    expect(getStopOrderServiceErrorMessage(error)).toBe(
      'Slippage must exceed the maximum fees charged on tokenOut: slippage 2 bps, needs more than 539 bps (protocol fee 2.5 + gas headroom 536.5)',
    )
  })

  it('passes a plain refusal through', () => {
    const error = { status: 400, data: { code: 4004, message: 'Input is invalid: deadline' } }
    expect(getStopOrderServiceErrorMessage(error)).toBe('Input is invalid: deadline')
  })

  it('has nothing to say about errors that are not a service refusal', () => {
    expect(getStopOrderServiceErrorMessage(new Error('User rejected the request.'))).toBeUndefined()
    expect(
      getStopOrderServiceErrorMessage({ status: 'FETCH_ERROR', error: 'TypeError: Failed to fetch' }),
    ).toBeUndefined()
    expect(getStopOrderServiceErrorMessage({ status: 500, data: '<html>' })).toBeUndefined()
    expect(getStopOrderServiceErrorMessage(undefined)).toBeUndefined()
  })
})

describe('getStopOrderWarnings', () => {
  const warning = {
    orderId: 4,
    tokenIn: ORDER.tokenIn,
    tokenOut: ORDER.tokenOut,
    code: 'FEED_MISSING',
    canCancel: true,
  }

  it('keeps the warnings that carry a message', () => {
    const order = {
      ...ORDER,
      warnings: [
        { ...warning, message: 'The feed is gone.' },
        { ...warning, message: ' ' },
      ],
    }
    expect(getStopOrderWarnings(order).map(w => w.message)).toEqual(['The feed is gone.'])
  })

  it('reads none from an order without any, or with something that is not a list', () => {
    expect(getStopOrderWarnings(ORDER)).toEqual([])
    expect(getStopOrderWarnings({ ...ORDER, warnings: 'none' as never })).toEqual([])
  })
})

describe('getStopOrderCurrentPrice', () => {
  const estimate = {
    source: 'chainlink',
    updatedAt: 1783258149,
    tokenInPriceUsd: '2500',
    tokenOutPriceUsd: '1.0002',
    amountInUsd: '250',
    expectedAmountOut: '249950009',
    expectedAmountOutHuman: '249.950009',
    expectedAmountOutUsd: '250',
  }

  it('prices tokenIn in tokenOut from the two USD legs', () => {
    expect(getStopOrderCurrentPrice({ ...ORDER, oracleEstimate: estimate })).toBeCloseTo(2500 / 1.0002, 10)
  })

  it.each([
    ['no estimate', { ...ORDER }],
    ['a null estimate, as a closed order carries', { ...ORDER, oracleEstimate: null }],
    ['a leg without a price', { ...ORDER, oracleEstimate: { ...estimate, tokenOutPriceUsd: '0' } }],
    ['a non-numeric leg', { ...ORDER, oracleEstimate: { ...estimate, tokenInPriceUsd: 'n/a' } }],
  ])('has no price with %s', (_label, order) => {
    expect(getStopOrderCurrentPrice(order)).toBeUndefined()
  })
})

describe('getStopOrderSellAmountUsd', () => {
  const sold = (amountUsd: string | undefined, status = StopOrderExecutionStatus.SUCCESS): StopOrderExecution => ({
    ...execution(status),
    extraData: { amountIn: { amount: '0.05', amountUsd } },
  })
  const estimate = {
    source: 'chainlink',
    updatedAt: 1783258149,
    tokenInPriceUsd: '2500',
    tokenOutPriceUsd: '1',
    amountInUsd: '250',
    expectedAmountOut: '250000000',
    expectedAmountOutHuman: '250',
    expectedAmountOutUsd: '250',
  }

  it('reads the oracle estimate while the order is open', () => {
    expect(getStopOrderSellAmountUsd({ ...ORDER, oracleEstimate: estimate })).toBe(250)
  })

  it('totals what the settlements sold once the order executed', () => {
    const order = { ...ORDER, status: StopOrderStatus.DONE, executions: [sold('125'), sold('124.5')] }
    expect(getStopOrderSellAmountUsd(order)).toBeCloseTo(249.5, 10)
  })

  it('ignores an attempt that did not go through', () => {
    const order = { ...ORDER, executions: [sold('125', StopOrderExecutionStatus.FAILED)] }
    expect(getStopOrderSellAmountUsd(order)).toBeUndefined()
  })

  it('gives no total when a settlement does not report its value, rather than an understated one', () => {
    const order = { ...ORDER, status: StopOrderStatus.DONE, executions: [sold('125'), sold(undefined)] }
    expect(getStopOrderSellAmountUsd(order)).toBeUndefined()
  })

  it('has no figure for an order that neither runs nor executed', () => {
    expect(getStopOrderSellAmountUsd({ ...ORDER, status: StopOrderStatus.CANCELLED })).toBeUndefined()
  })
})

describe('getStopOrderFills', () => {
  const fill = (
    executionNum: number,
    status: StopOrderExecutionStatus,
    amountIn: string,
    amountOut: string,
    price: string,
  ) => ({
    ...execution(status, executionNum),
    hash: `0xfill${executionNum}`,
    extraData: { amountIn: { amount: amountIn }, amountOut: { amount: amountOut }, oraclePrice: price },
  })

  it('keeps only the executions that went through, oldest first', () => {
    const order: StopOrder = {
      ...ORDER,
      executions: [
        fill(2, StopOrderExecutionStatus.SUCCESS, '0.06', '144', '2400'),
        fill(0, StopOrderExecutionStatus.SUCCESS, '0.04', '95.2', '2380'),
        fill(1, StopOrderExecutionStatus.FAILED, '0.06', '0', '2390'),
      ],
    }
    expect(getStopOrderFills(order)).toEqual([
      { hash: '0xfill0', amountIn: 0.04, amountOut: 95.2, price: 2380 },
      { hash: '0xfill2', amountIn: 0.06, amountOut: 144, price: 2400 },
    ])
  })

  it('has no fills before an execution succeeds', () => {
    expect(getStopOrderFills(ORDER)).toEqual([])
    expect(getStopOrderFills({ ...ORDER, executions: [execution(StopOrderExecutionStatus.PENDING)] })).toEqual([])
  })

  it('leaves a price the execution does not report unset', () => {
    const order = { ...ORDER, executions: [fill(0, StopOrderExecutionStatus.SUCCESS, '0.1', '240', '')] }
    expect(getStopOrderFills(order)[0].price).toBeUndefined()
  })
})

describe('summarizeStopOrderFills', () => {
  it('reads a single fill as is', () => {
    expect(summarizeStopOrderFills([{ hash: 'a', amountIn: 0.1, amountOut: 240, price: 2400 }])).toEqual({
      amountIn: 0.1,
      amountOut: 240,
      price: 2400,
    })
  })

  it('totals the fills and weighs their prices by what each sold', () => {
    const summary = summarizeStopOrderFills([
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
    expect(summarizeStopOrderFills(fills, 0.1).amountIn).toBe(0.1)
  })

  it('gives no total when a fill does not report its part, rather than an understated one', () => {
    const summary = summarizeStopOrderFills([
      { hash: 'a', amountOut: 95.2, price: 2380 },
      { hash: 'b', amountIn: 0.06, price: 2400 },
    ])
    expect(summary.amountIn).toBeUndefined()
    expect(summary.amountOut).toBeUndefined()
    // Sizes unknown, so the prices are averaged plainly.
    expect(summary.price).toBe(2390)
  })

  it('is empty without fills', () => {
    expect(summarizeStopOrderFills([])).toEqual({})
  })
})

describe('parseStopOrder', () => {
  it('accepts a well-formed order and coerces a string chainId', () => {
    expect(parseStopOrder({ ...ORDER, chainId: '8453' })?.chainId).toBe(ChainId.BASE)
  })

  it('accepts the largest amount a token can hold', () => {
    expect(parseStopOrder({ ...ORDER, amountIn: (2n ** 256n - 1n).toString() })).not.toBeNull()
  })

  it.each([
    ['a non-numeric amountIn', { amountIn: '0.1' }],
    ['an amountIn past uint256', { amountIn: (2n ** 256n).toString() }],
    ['a missing creation time', { createdAt: undefined }],
    ['a creation time sent as a string', { createdAt: '1783258149' }],
    ['a missing amountIn', { amountIn: undefined }],
    ['an unsupported chain', { chainId: 999999 }],
    ['an unknown status', { status: 'OrderStatusSomethingNew' }],
    ['a missing trigger price', { condition: { field: { type: 'oracle_price', value: {} } } }],
    ['a missing tokenOut', { tokenOut: '' }],
    ['a missing token identity', { tokenInInfo: undefined }],
    ['a token identity without decimals', { tokenOutInfo: { address: ORDER.tokenOut, symbol: 'USDC' } }],
    ['a token identity with a malformed address', { tokenOutInfo: { ...ORDER.tokenOutInfo, address: 'usdc' } }],
    ['a non-numeric slippage', { slippage: '50' }],
  ])('rejects %s', (_label, patch) => {
    expect(parseStopOrder({ ...ORDER, ...patch })).toBeNull()
  })

  it('rejects a non-object', () => {
    expect(parseStopOrder(null)).toBeNull()
    expect(parseStopOrder('order')).toBeNull()
  })
})

describe('parseStopOrders', () => {
  it('drops only the invalid rows and reports how many', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const orders = parseStopOrders([ORDER, { ...ORDER, amountIn: 'not-a-number' }, { ...ORDER, id: 5 }])

    expect(orders.map(order => order.id)).toEqual([4, 5])
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('Dropped 1 of 3'))
    consoleError.mockRestore()
  })

  it('returns an empty list for a missing orders array', () => {
    expect(parseStopOrders(undefined)).toEqual([])
  })
})

describe('getStopOrderPairKey', () => {
  const USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

  it('names a pair by chain and lower-cased addresses, in direction', () => {
    expect(getStopOrderPairKey(ChainId.BASE, ORDER.tokenIn, USDC)).toBe(
      `${ChainId.BASE}:0x4200000000000000000000000000000000000006:${USDC.toLowerCase()}`,
    )
    expect(getStopOrderPairKey(ChainId.BASE, USDC, ORDER.tokenIn)).not.toBe(
      getStopOrderPairKey(ChainId.BASE, ORDER.tokenIn, USDC),
    )
  })

  it('gives a native coin the key of its wrapped token', () => {
    expect(getStopOrderPairKey(ChainId.BASE, '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', USDC)).toBe(
      getStopOrderPairKey(ChainId.BASE, WETH[ChainId.BASE].address, USDC),
    )
  })
})

describe('matchExpiryPreset', () => {
  const DAY = 24 * 60 * 60
  const PRESETS = [7 * DAY, 30 * DAY, 90 * DAY, 36500 * DAY]

  it('finds the preset a window trails by the time it took to review and sign', () => {
    expect(matchExpiryPreset(7 * DAY - 12, PRESETS)).toBe(7 * DAY)
    expect(matchExpiryPreset(30 * DAY - 15 * 60, PRESETS)).toBe(30 * DAY)
  })

  it('finds none for a window the user picked as a custom date', () => {
    expect(matchExpiryPreset(14 * DAY, PRESETS)).toBeUndefined()
    expect(matchExpiryPreset(7 * DAY - 2 * 60 * 60, PRESETS)).toBeUndefined()
  })
})

describe('getStopOrderRecreateDraft', () => {
  const DAY = 24 * 60 * 60
  const NOW = 1790000000000
  const EXPIRY = { expiryPresets: [7 * DAY, 30 * DAY, 90 * DAY, 36500 * DAY], defaultExpire: 7 * DAY, now: NOW }

  it('carries the trigger price and slippage of the original order', () => {
    expect(getStopOrderRecreateDraft(ORDER, EXPIRY)).toMatchObject({
      triggerPrice: '2400',
      triggerPair: getStopOrderPairKey(ORDER.chainId, ORDER.tokenIn, ORDER.tokenOut),
      slippage: 50,
    })
  })

  it('restores a window set from a preset as that preset', () => {
    const weekLong = { ...ORDER, deadline: ORDER.createdAt + 7 * DAY - 12 }
    expect(getStopOrderRecreateDraft(weekLong, EXPIRY)).toMatchObject({ expire: 7 * DAY, customDateExpire: undefined })
  })

  it('restores any other window as a custom date of the same length from now', () => {
    const twoWeeks = { ...ORDER, deadline: ORDER.createdAt + 14 * DAY }
    expect(getStopOrderRecreateDraft(twoWeeks, EXPIRY).customDateExpire).toBe(NOW + 14 * DAY * 1000)
    // The fixture ran 1783258149 → 1783344543, i.e. one day less six seconds.
    expect(getStopOrderRecreateDraft(ORDER, EXPIRY).customDateExpire).toBe(NOW + 86394 * 1000)
  })

  it('restores a deadline clamped to the service maximum as forever', () => {
    const forever = { ...ORDER, deadline: MAX_STOP_ORDER_DEADLINE }
    expect(getStopOrderRecreateDraft(forever, EXPIRY)).toMatchObject({
      expire: 36500 * DAY,
      customDateExpire: undefined,
    })
  })

  it('falls back to the default when the recorded window is not a positive duration', () => {
    const sameInstant = { ...ORDER, deadline: ORDER.createdAt }
    const reversed = { ...ORDER, deadline: ORDER.createdAt - 1000 }
    for (const order of [sameInstant, reversed]) {
      expect(getStopOrderRecreateDraft(order, EXPIRY)).toMatchObject({
        expire: EXPIRY.defaultExpire,
        customDateExpire: undefined,
      })
    }
  })

  it("leaves the slippage unset when the order carries none, so the pair's suggestion applies", () => {
    expect(getStopOrderRecreateDraft({ ...ORDER, slippage: 0 }, EXPIRY).slippage).toBeUndefined()
  })

  it('yields an empty trigger when the condition is missing rather than throwing', () => {
    const noCondition = { ...ORDER, condition: undefined } as unknown as typeof ORDER
    expect(getStopOrderRecreateDraft(noCondition, EXPIRY).triggerPrice).toBe('')
  })
})
