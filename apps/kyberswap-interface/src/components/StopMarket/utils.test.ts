import { ChainId, Currency, Token, WETH } from '@kyberswap/ks-sdk-core'
import { describe, expect, it, vi } from 'vitest'

import {
  StopMarket,
  StopMarketDisplayStatus,
  StopMarketExecution,
  StopMarketExecutionStatus,
  StopMarketStatus,
} from 'components/StopMarket/types'
import {
  MAX_STOP_MARKET_DEADLINE,
  buildStopMarketPayload,
  clampStopMarketDeadline,
  formatDistanceMagnitude,
  formatTriggerPercentValue,
  formatTriggerPriceValue,
  getStopMarketCurrentPrice,
  getStopMarketDisplayStatus,
  getStopMarketExecutionTxHash,
  getStopMarketFills,
  getStopMarketFundingKey,
  getStopMarketFundingShortfalls,
  getStopMarketMinReceive,
  getStopMarketOrderTooSmall,
  getStopMarketPairKey,
  getStopMarketRecreateDraft,
  getStopMarketRetry,
  getStopMarketSellAmountUsd,
  getStopMarketServiceErrorMessage,
  getStopMarketWarnings,
  getTriggerDirection,
  getTriggerPercent,
  getTriggerProximity,
  groupStopMarketTokensByChain,
  hasReservedBalanceShortfall,
  isActiveStopMarketStatus,
  isStopMarketTriggerClose,
  matchExpiryPreset,
  parseRawAmount,
  parseStopMarket,
  parseStopMarkets,
  resolveExecutionAmountIn,
  resolveExecutionAmountOut,
  stripEmptyEip712Salt,
  summarizeStopMarketFills,
} from 'components/StopMarket/utils'
import { ETHER_ADDRESS } from 'constants/index'
import { NativeCurrencies } from 'constants/tokens'

const ORDER: StopMarket = {
  id: 4,
  chainId: ChainId.BASE,
  status: StopMarketStatus.OPEN,
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

const execution = (status: StopMarketExecutionStatus, executionNum = 0): StopMarketExecution => ({
  hash: '0xb73e5fd3',
  executionNum,
  operatorWallet: '0x9965',
  status,
})

describe('getStopMarketDisplayStatus', () => {
  it.each([
    [StopMarketStatus.DONE, StopMarketDisplayStatus.EXECUTED],
    [StopMarketStatus.CANCELLED, StopMarketDisplayStatus.CANCELLED],
    [StopMarketStatus.EXPIRED, StopMarketDisplayStatus.EXPIRED],
  ] as const)('maps the terminal order status %s to %s', (status, expected) => {
    expect(getStopMarketDisplayStatus({ ...ORDER, status })).toBe(expected)
  })

  it('is Active while open with no settlement attempt', () => {
    expect(getStopMarketDisplayStatus(ORDER)).toBe(StopMarketDisplayStatus.ACTIVE)
  })

  it.each([
    [StopMarketExecutionStatus.CREATED, StopMarketDisplayStatus.TRIGGERED],
    [StopMarketExecutionStatus.PENDING, StopMarketDisplayStatus.TRIGGERED],
    [StopMarketExecutionStatus.FAILED, StopMarketDisplayStatus.ACTIVE],
    [StopMarketExecutionStatus.NOT_MINED, StopMarketDisplayStatus.ACTIVE],
  ] as const)('derives %s from the latest execution as %s', (status, expected) => {
    expect(getStopMarketDisplayStatus({ ...ORDER, executions: [execution(status)] })).toBe(expected)
  })

  it('reads only the latest attempt when an earlier one failed', () => {
    const order = {
      ...ORDER,
      executions: [execution(StopMarketExecutionStatus.FAILED, 0), execution(StopMarketExecutionStatus.PENDING, 1)],
    }
    expect(getStopMarketDisplayStatus(order)).toBe(StopMarketDisplayStatus.TRIGGERED)
  })

  it('reads the highest executionNum even when the array arrives out of order', () => {
    const order = {
      ...ORDER,
      executions: [execution(StopMarketExecutionStatus.PENDING, 1), execution(StopMarketExecutionStatus.FAILED, 0)],
    }
    expect(getStopMarketDisplayStatus(order)).toBe(StopMarketDisplayStatus.TRIGGERED)
  })

  it('keeps a successful attempt on an order the service has not settled yet as Active', () => {
    const order = { ...ORDER, executions: [execution(StopMarketExecutionStatus.SUCCESS)] }
    expect(getStopMarketDisplayStatus(order)).toBe(StopMarketDisplayStatus.ACTIVE)
  })
})

describe('isActiveStopMarketStatus', () => {
  it('keeps triggered orders in the active table and finished ones under history', () => {
    expect(isActiveStopMarketStatus(StopMarketDisplayStatus.ACTIVE)).toBe(true)
    expect(isActiveStopMarketStatus(StopMarketDisplayStatus.TRIGGERED)).toBe(true)
    expect(isActiveStopMarketStatus(StopMarketDisplayStatus.EXECUTED)).toBe(false)
    expect(isActiveStopMarketStatus(StopMarketDisplayStatus.CANCELLED)).toBe(false)
    expect(isActiveStopMarketStatus(StopMarketDisplayStatus.EXPIRED)).toBe(false)
  })
})

describe('formatTriggerPercentValue', () => {
  it('keeps the sign and one decimal, as the distance shows it', () => {
    expect(formatTriggerPercentValue(-19.999999999999996)).toBe('-20.0')
    expect(formatTriggerPercentValue(6.62)).toBe('6.6')
    expect(formatTriggerPercentValue(1234.5)).toBe('1234.5')
    expect(formatTriggerPercentValue(0)).toBe('0.0')
  })

  it('keeps the rounded first significant digit of a distance one decimal would zero, in plain notation', () => {
    expect(formatTriggerPercentValue(-0.00899)).toBe('-0.009')
    expect(formatTriggerPercentValue(0.023)).toBe('0.02')
    expect(formatTriggerPercentValue(-0.0099)).toBe('-0.01')
    expect(formatTriggerPercentValue(-0.000092)).toBe('-0.00009')
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

  it('rounds that first significant digit rather than truncating it', () => {
    expect(formatDistanceMagnitude(-0.00899)).toBe('0.009')
    expect(formatDistanceMagnitude(0.0268)).toBe('0.03')
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

describe('getTriggerPercent', () => {
  it('reads a trigger written from the market price as at it', () => {
    const market = 0.6136193
    expect(getTriggerPercent(Number(formatTriggerPriceValue(market)), market)).toBe(0)
  })

  it('keeps a deliberate small distance and its sign', () => {
    expect(getTriggerPercent(99.991, 100)).toBeCloseTo(-0.009)
    expect(getTriggerPercent(102, 100)).toBeCloseTo(2)
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

describe('getTriggerDirection', () => {
  it('follows the sign of the distance', () => {
    expect(getTriggerDirection(-20)).toBe('below')
    expect(getTriggerDirection(0.4)).toBe('above')
  })

  it('keeps a tiny distance on its side rather than reading it as at the price', () => {
    expect(getTriggerDirection(-0.00001)).toBe('below')
    expect(getTriggerDirection(0.0003)).toBe('above')
  })

  it('has no side without a distance', () => {
    expect(getTriggerDirection(undefined)).toBe('none')
    expect(getTriggerDirection(0)).toBe('none')
    expect(getTriggerDirection(NaN)).toBe('none')
  })
})

describe('clampStopMarketDeadline', () => {
  it('passes through a deadline the service accepts', () => {
    expect(clampStopMarketDeadline(1790000000)).toBe(1790000000)
    expect(clampStopMarketDeadline(MAX_STOP_MARKET_DEADLINE)).toBe(MAX_STOP_MARKET_DEADLINE)
  })

  it('caps an expires-never choice that would otherwise be rejected', () => {
    // now + 36500 days, the sentinel a "Never Expires" option produces
    expect(clampStopMarketDeadline(4939594415)).toBe(MAX_STOP_MARKET_DEADLINE)
  })

  it('floors fractional seconds', () => {
    expect(clampStopMarketDeadline(1790000000.9)).toBe(1790000000)
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

describe('buildStopMarketPayload', () => {
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
    expect(buildStopMarketPayload(params).amountIn).toBe('100000000000000000')
  })

  it('sells the wrapped token when the form holds native currency', () => {
    const payload = buildStopMarketPayload({ ...params, currencyIn: NATIVE })
    expect(payload.tokenIn).toBe(WETH_BASE.address)
  })

  it('pays out native currency by the native placeholder address, and the wrapped token by its own', () => {
    const toNative = { ...params, currencyIn: USDC as Currency, currencyOut: NATIVE }
    expect(buildStopMarketPayload(toNative).tokenOut).toBe(ETHER_ADDRESS)
    expect(buildStopMarketPayload({ ...toNative, currencyOut: WETH_BASE }).tokenOut).toBe(WETH_BASE.address)
  })

  it('converts the expiry from milliseconds to seconds', () => {
    expect(buildStopMarketPayload(params).deadline).toBe(1790000000)
  })

  it('caps an expires-never deadline the service would reject', () => {
    expect(buildStopMarketPayload({ ...params, expiredAt: 4939594415_000 }).deadline).toBe(MAX_STOP_MARKET_DEADLINE)
  })

  it('carries the trigger as an lte condition and leaves staleness to the feed default', () => {
    expect(buildStopMarketPayload(params).condition).toEqual({
      field: { type: 'oracle_price', value: { lte: '2400' } },
    })
  })

  it('omits the optional source field when unset', () => {
    expect(buildStopMarketPayload(params)).not.toHaveProperty('source')
  })
})

describe('resolveExecutionAmountOut', () => {
  const withAmount = (amount?: string): StopMarketExecution => ({
    ...execution(StopMarketExecutionStatus.SUCCESS),
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
    const sold: StopMarketExecution = {
      ...execution(StopMarketExecutionStatus.SUCCESS),
      extraData: { amountIn: { amount: '0.25', amountWei: 250000000000000000 } },
    }
    expect(resolveExecutionAmountIn(sold)).toBe(0.25)
  })
})

describe('getStopMarketFundingShortfalls', () => {
  const amountIn = '100000000000000000'

  it('names whichever holding falls short of the amount', () => {
    expect(getStopMarketFundingShortfalls(amountIn, 50000000000000000n, 200000000000000000n)).toEqual(['balance'])
    expect(getStopMarketFundingShortfalls(amountIn, 200000000000000000n, 0n)).toEqual(['allowance'])
    expect(getStopMarketFundingShortfalls(amountIn, 0n, 0n)).toEqual(['balance', 'allowance'])
  })

  it('is satisfied by holdings equal to the amount', () => {
    expect(getStopMarketFundingShortfalls(amountIn, 100000000000000000n, 100000000000000000n)).toEqual([])
  })

  it('does not count a figure that has not been read yet', () => {
    expect(getStopMarketFundingShortfalls(amountIn, undefined, undefined)).toEqual([])
    expect(getStopMarketFundingShortfalls(amountIn, undefined, 0n)).toEqual(['allowance'])
  })
})

describe('groupStopMarketTokensByChain', () => {
  const USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
  const BUSD = '0xe9e7cea3dedca5984780bafc599bd69add087d56'

  it('asks each chain once for its distinct sell tokens, in a stable order', () => {
    const orders = [
      { ...ORDER, id: 1, tokenIn: USDC },
      { ...ORDER, id: 2, chainId: ChainId.BSCMAINNET, tokenIn: BUSD },
      { ...ORDER, id: 3, tokenIn: ORDER.tokenIn },
      { ...ORDER, id: 4, tokenIn: USDC.toLowerCase() },
    ]
    expect(groupStopMarketTokensByChain(orders)).toEqual([
      { chainId: ChainId.BSCMAINNET, tokens: [BUSD] },
      { chainId: ChainId.BASE, tokens: [ORDER.tokenIn.toLowerCase(), USDC.toLowerCase()].sort() },
    ])
  })

  it('keys a token the same way whatever its case', () => {
    expect(getStopMarketFundingKey(ChainId.BASE, USDC)).toBe(getStopMarketFundingKey(ChainId.BASE, USDC.toLowerCase()))
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

describe('getStopMarketServiceErrorMessage', () => {
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
    expect(getStopMarketServiceErrorMessage(error)).toBe(
      'Slippage must exceed the maximum fees charged on tokenOut: slippage 2 bps, needs more than 539 bps (protocol fee 2.5 + gas headroom 536.5)',
    )
  })

  it('passes a plain refusal through', () => {
    const error = { status: 400, data: { code: 4004, message: 'Input is invalid: deadline' } }
    expect(getStopMarketServiceErrorMessage(error)).toBe('Input is invalid: deadline')
  })

  it('prefers a reason the body sets apart over the one inside the message', () => {
    const error = {
      status: 400,
      data: {
        code: 4004,
        message: 'DOMAIN ERROR: {Code: DOMAIN:INVALID, RootCause: old wording}',
        rootCause: 'order too small',
      },
    }
    expect(getStopMarketServiceErrorMessage(error)).toBe('Order too small')
  })

  it('falls back to the domain message when a refusal carries no root cause', () => {
    const error = {
      status: 404,
      data: {
        code: 4040,
        message: 'DOMAIN ERROR: {Code: DOMAIN:NOT_FOUND, Message: Domain error: Not found, ErrorEntities: [feed]}',
      },
    }
    expect(getStopMarketServiceErrorMessage(error)).toBe('Domain error: Not found')
  })

  it('has nothing to say about errors that are not a service refusal', () => {
    expect(getStopMarketServiceErrorMessage(new Error('User rejected the request.'))).toBeUndefined()
    expect(
      getStopMarketServiceErrorMessage({ status: 'FETCH_ERROR', error: 'TypeError: Failed to fetch' }),
    ).toBeUndefined()
    expect(getStopMarketServiceErrorMessage({ status: 500, data: '<html>' })).toBeUndefined()
    expect(getStopMarketServiceErrorMessage(undefined)).toBeUndefined()
  })
})

describe('getStopMarketRetry', () => {
  const oracleAt = (tokenInPriceUsd: string) => ({
    source: 'CHAINLINK',
    updatedAt: 1783258149,
    tokenInPriceUsd,
    tokenOutPriceUsd: '1',
    amountInUsd: '230',
    expectedAmountOut: '230000000',
    expectedAmountOutHuman: '230',
    expectedAmountOutUsd: '230',
  })
  // The oracle at 2300 sits below the 2400 trigger.
  // The 2400 trigger with 0.5% slippage fills between 2388 and 2400; the oracle at 2395 sits inside that.
  const open = { ...ORDER, status: StopMarketStatus.OPEN, executions: [], logs: [], oracleEstimate: oracleAt('2395') }
  const log = (type: string, createdAt: number, detail: Record<string, string> | null = null) => ({
    id: createdAt,
    type,
    createdAt,
    detail,
  })

  it('is not retrying until an attempt has failed', () => {
    expect(getStopMarketRetry(open)).toBeUndefined()
    expect(
      getStopMarketRetry({
        ...open,
        logs: [log('LogTypeOrderStatusUpdate', 1, { reason: 'UpdateStatusReasonUserAPIUpdate' })],
      }),
    ).toBeUndefined()
  })

  it('reads the cause from a simulation that reverted, which leaves no execution', () => {
    const order = {
      ...open,
      logs: [
        log('LogTypePreSubmitRevert', 10, { error: 'execution reverted: ERC20: transfer amount exceeds balance' }),
      ],
    }
    expect(getStopMarketRetry(order)).toEqual({ cause: 'balance' })
    const allowance = { ...open, logs: [log('LogTypePreSubmitRevert', 10, { error: 'ERC20: insufficient allowance' })] }
    expect(getStopMarketRetry(allowance)).toEqual({ cause: 'allowance' })
  })

  it('goes by the latest failed attempt', () => {
    const order = {
      ...open,
      logs: [
        log('LogTypePreSubmitRevert', 20, { error: 'InsufficientOutput: min 1994.2, got 1988.7' }),
        log('LogTypePreSubmitRevert', 10, { error: 'ERC20: transfer amount exceeds balance' }),
      ],
    }
    expect(getStopMarketRetry(order)).toEqual({ cause: 'slippage' })
  })

  it('counts a reverted transaction and an attempt the service declined', () => {
    const reverted = {
      ...open,
      executions: [
        {
          ...execution(StopMarketExecutionStatus.FAILED),
          createdAt: 30,
          extraData: { error: 'InsufficientOutput: min 10, got 9' },
        },
      ],
    }
    expect(getStopMarketRetry(reverted)).toEqual({ cause: 'slippage' })
    const skipped = { ...open, logs: [log('LogTypeSkipped', 5, { reason: 'SkipReasonOracleStale', message: 'stale' })] }
    expect(getStopMarketRetry(skipped)).toEqual({ cause: 'unknown' })
  })

  it('is not retrying while an attempt is in flight or once the order has closed', () => {
    const failedLog = [log('LogTypePreSubmitRevert', 10, { error: 'x' })]
    const inFlight = {
      ...open,
      logs: failedLog,
      executions: [{ ...execution(StopMarketExecutionStatus.PENDING), createdAt: 20 }],
    }
    expect(getStopMarketRetry(inFlight)).toBeUndefined()
    expect(getStopMarketRetry({ ...open, status: StopMarketStatus.CANCELLED, logs: failedLog })).toBeUndefined()
  })

  it('is retrying with the oracle right at the trigger, which is where it fires', () => {
    const failedLog = [log('LogTypePreSubmitRevert', 10, { error: 'x' })]
    expect(getStopMarketRetry({ ...open, logs: failedLog, oracleEstimate: oracleAt('2400') })).toEqual({
      cause: 'unknown',
    })
  })

  it('is not retrying unless the oracle sits between the slippage floor and the trigger', () => {
    const failedLog = [log('LogTypePreSubmitRevert', 10, { error: 'x' })]
    expect(getStopMarketRetry({ ...open, logs: failedLog, oracleEstimate: oracleAt('2500') })).toBeUndefined()
    // Under the 2388 floor no fill can meet the order's minimum, so it is not being retried.
    expect(getStopMarketRetry({ ...open, logs: failedLog, oracleEstimate: oracleAt('2300') })).toBeUndefined()
    expect(getStopMarketRetry({ ...open, logs: failedLog, oracleEstimate: oracleAt('2388') })).toEqual({
      cause: 'unknown',
    })
    expect(getStopMarketRetry({ ...open, logs: failedLog, oracleEstimate: null })).toBeUndefined()
  })
})

describe('getStopMarketWarnings', () => {
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
    expect(getStopMarketWarnings(order).map(w => w.message)).toEqual(['The feed is gone.'])
  })

  it('reads none from an order without any, or with something that is not a list', () => {
    expect(getStopMarketWarnings(ORDER)).toEqual([])
    expect(getStopMarketWarnings({ ...ORDER, warnings: 'none' as never })).toEqual([])
  })
})

describe('getStopMarketCurrentPrice', () => {
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
    expect(getStopMarketCurrentPrice({ ...ORDER, oracleEstimate: estimate })).toBeCloseTo(2500 / 1.0002, 10)
  })

  it.each([
    ['no estimate', { ...ORDER }],
    ['a null estimate, as a closed order carries', { ...ORDER, oracleEstimate: null }],
    ['a leg without a price', { ...ORDER, oracleEstimate: { ...estimate, tokenOutPriceUsd: '0' } }],
    ['a non-numeric leg', { ...ORDER, oracleEstimate: { ...estimate, tokenInPriceUsd: 'n/a' } }],
  ])('has no price with %s', (_label, order) => {
    expect(getStopMarketCurrentPrice(order)).toBeUndefined()
  })
})

describe('getStopMarketSellAmountUsd', () => {
  const sold = (amountUsd: string | undefined, status = StopMarketExecutionStatus.SUCCESS): StopMarketExecution => ({
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
    expect(getStopMarketSellAmountUsd({ ...ORDER, oracleEstimate: estimate })).toBe(250)
  })

  it('totals what the settlements sold once the order executed', () => {
    const order = { ...ORDER, status: StopMarketStatus.DONE, executions: [sold('125'), sold('124.5')] }
    expect(getStopMarketSellAmountUsd(order)).toBeCloseTo(249.5, 10)
  })

  it('ignores an attempt that did not go through', () => {
    const order = { ...ORDER, executions: [sold('125', StopMarketExecutionStatus.FAILED)] }
    expect(getStopMarketSellAmountUsd(order)).toBeUndefined()
  })

  it('gives no total when a settlement does not report its value, rather than an understated one', () => {
    const order = { ...ORDER, status: StopMarketStatus.DONE, executions: [sold('125'), sold(undefined)] }
    expect(getStopMarketSellAmountUsd(order)).toBeUndefined()
  })

  it('has no figure for an order that neither runs nor executed', () => {
    expect(getStopMarketSellAmountUsd({ ...ORDER, status: StopMarketStatus.CANCELLED })).toBeUndefined()
  })
})

describe('getStopMarketExecutionTxHash', () => {
  const attempt = (executionNum: number, status: StopMarketExecutionStatus) => ({
    ...execution(status, executionNum),
    hash: `0xattempt${executionNum}`,
  })

  it('links the attempt that went through, not a failed one beside it', () => {
    const order: StopMarket = {
      ...ORDER,
      executions: [
        attempt(0, StopMarketExecutionStatus.FAILED),
        attempt(1, StopMarketExecutionStatus.SUCCESS),
        attempt(2, StopMarketExecutionStatus.FAILED),
      ],
    }
    expect(getStopMarketExecutionTxHash(order)).toBe('0xattempt1')
  })

  it('falls back to the latest attempt while none has gone through', () => {
    const order: StopMarket = {
      ...ORDER,
      executions: [attempt(0, StopMarketExecutionStatus.FAILED), attempt(1, StopMarketExecutionStatus.PENDING)],
    }
    expect(getStopMarketExecutionTxHash(order)).toBe('0xattempt1')
    expect(getStopMarketExecutionTxHash(ORDER)).toBeUndefined()
  })
})

describe('getStopMarketFills', () => {
  const fill = (
    executionNum: number,
    status: StopMarketExecutionStatus,
    amountIn: string,
    amountOut: string,
    price: string,
  ) => ({
    ...execution(status, executionNum),
    hash: `0xfill${executionNum}`,
    extraData: { amountIn: { amount: amountIn }, amountOut: { amount: amountOut }, oraclePrice: price },
  })

  it('keeps only the executions that went through, oldest first', () => {
    const order: StopMarket = {
      ...ORDER,
      executions: [
        fill(2, StopMarketExecutionStatus.SUCCESS, '0.06', '144', '2400'),
        fill(0, StopMarketExecutionStatus.SUCCESS, '0.04', '95.2', '2380'),
        fill(1, StopMarketExecutionStatus.FAILED, '0.06', '0', '2390'),
      ],
    }
    expect(getStopMarketFills(order)).toEqual([
      { hash: '0xfill0', amountIn: 0.04, amountOut: 95.2, received: 95.2, price: 2380 },
      { hash: '0xfill2', amountIn: 0.06, amountOut: 144, received: 144, price: 2400 },
    ])
  })

  it('has no fills before an execution succeeds', () => {
    expect(getStopMarketFills(ORDER)).toEqual([])
    expect(getStopMarketFills({ ...ORDER, executions: [execution(StopMarketExecutionStatus.PENDING)] })).toEqual([])
  })

  it('reads what the fill received and the fee it paid', () => {
    const settled = fill(0, StopMarketExecutionStatus.SUCCESS, '0.01', '7.4448', '744.46')
    const order = {
      ...ORDER,
      executions: [
        {
          ...settled,
          extraData: { ...settled.extraData, fee: { amount: '0.2234' }, received: { amount: '7.2214' } },
        },
      ],
    }
    expect(getStopMarketFills(order)[0]).toMatchObject({ amountOut: 7.4448, received: 7.2214, fee: 0.2234 })
  })

  it('falls back to the amount out for a fill that does not report what it received', () => {
    const order = { ...ORDER, executions: [fill(0, StopMarketExecutionStatus.SUCCESS, '0.1', '240', '2400')] }
    expect(getStopMarketFills(order)[0].received).toBe(240)
  })

  it('leaves a price the execution does not report unset', () => {
    const order = { ...ORDER, executions: [fill(0, StopMarketExecutionStatus.SUCCESS, '0.1', '240', '')] }
    expect(getStopMarketFills(order)[0].price).toBeUndefined()
  })
})

describe('summarizeStopMarketFills', () => {
  it('reads a single fill as is', () => {
    expect(summarizeStopMarketFills([{ hash: 'a', amountIn: 0.1, amountOut: 240, price: 2400 }])).toEqual({
      amountIn: 0.1,
      amountOut: 240,
      price: 2400,
    })
  })

  it('totals the fills and weighs their prices by what each sold', () => {
    const summary = summarizeStopMarketFills([
      { hash: 'a', amountIn: 0.04, amountOut: 95.2, price: 2380 },
      { hash: 'b', amountIn: 0.06, amountOut: 144, price: 2400 },
    ])
    expect(summary.amountIn).toBeCloseTo(0.1, 10)
    expect(summary.amountOut).toBeCloseTo(239.2, 10)
    expect(summary.price).toBeCloseTo(2392, 10)
    // Neither fill reports what it received, so there is no total for it.
    expect(summary.received).toBeUndefined()
  })

  it('totals what the fills received and paid in fees', () => {
    const summary = summarizeStopMarketFills([
      { hash: 'a', amountIn: 0.04, amountOut: 95.2, received: 92.3, fee: 2.9, price: 2380 },
      { hash: 'b', amountIn: 0.06, amountOut: 144, received: 139.7, fee: 4.3, price: 2400 },
    ])
    expect(summary.received).toBeCloseTo(232, 10)
    expect(summary.fee).toBeCloseTo(7.2, 10)
  })

  it("prefers the order's own amount for the total sold", () => {
    const fills = [
      { hash: 'a', amountIn: 0.04, amountOut: 95.2, price: 2380 },
      { hash: 'b', amountIn: 0.06, amountOut: 144, price: 2400 },
    ]
    expect(summarizeStopMarketFills(fills, 0.1).amountIn).toBe(0.1)
  })

  it('gives no total when a fill does not report its part, rather than an understated one', () => {
    const summary = summarizeStopMarketFills([
      { hash: 'a', amountOut: 95.2, price: 2380 },
      { hash: 'b', amountIn: 0.06, price: 2400 },
    ])
    expect(summary.amountIn).toBeUndefined()
    expect(summary.amountOut).toBeUndefined()
    // Sizes unknown, so the prices are averaged plainly.
    expect(summary.price).toBe(2390)
  })

  it('is empty without fills', () => {
    expect(summarizeStopMarketFills([])).toEqual({})
  })
})

describe('parseStopMarket', () => {
  it('accepts a well-formed order and coerces a string chainId', () => {
    expect(parseStopMarket({ ...ORDER, chainId: '8453' })?.chainId).toBe(ChainId.BASE)
  })

  it('accepts an order paying out native currency', () => {
    const tokenOutInfo = { address: ETHER_ADDRESS, symbol: 'ETH', decimals: 18 }
    expect(parseStopMarket({ ...ORDER, tokenOut: ETHER_ADDRESS, tokenOutInfo })?.tokenOut).toBe(ETHER_ADDRESS)
  })

  it('accepts the largest amount a token can hold', () => {
    expect(parseStopMarket({ ...ORDER, amountIn: (2n ** 256n - 1n).toString() })).not.toBeNull()
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
    expect(parseStopMarket({ ...ORDER, ...patch })).toBeNull()
  })

  it('rejects a non-object', () => {
    expect(parseStopMarket(null)).toBeNull()
    expect(parseStopMarket('order')).toBeNull()
  })
})

describe('parseStopMarkets', () => {
  it('drops only the invalid rows and reports how many', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const orders = parseStopMarkets([ORDER, { ...ORDER, amountIn: 'not-a-number' }, { ...ORDER, id: 5 }])

    expect(orders.map(order => order.id)).toEqual([4, 5])
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('Dropped 1 of 3'))
    consoleError.mockRestore()
  })

  it('returns an empty list for a missing orders array', () => {
    expect(parseStopMarkets(undefined)).toEqual([])
  })
})

describe('getStopMarketPairKey', () => {
  const USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

  it('names a pair by chain and lower-cased addresses, in direction', () => {
    expect(getStopMarketPairKey(ChainId.BASE, ORDER.tokenIn, USDC)).toBe(
      `${ChainId.BASE}:0x4200000000000000000000000000000000000006:${USDC.toLowerCase()}`,
    )
    expect(getStopMarketPairKey(ChainId.BASE, USDC, ORDER.tokenIn)).not.toBe(
      getStopMarketPairKey(ChainId.BASE, ORDER.tokenIn, USDC),
    )
  })

  it('gives a native coin the key of its wrapped token', () => {
    expect(getStopMarketPairKey(ChainId.BASE, '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', USDC)).toBe(
      getStopMarketPairKey(ChainId.BASE, WETH[ChainId.BASE].address, USDC),
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

describe('getStopMarketRecreateDraft', () => {
  const DAY = 24 * 60 * 60
  const NOW = 1790000000000
  const EXPIRY = { expiryPresets: [7 * DAY, 30 * DAY, 90 * DAY, 36500 * DAY], defaultExpire: 7 * DAY, now: NOW }

  it('carries the trigger price and slippage of the original order', () => {
    expect(getStopMarketRecreateDraft(ORDER, EXPIRY)).toMatchObject({
      triggerPrice: '2400',
      triggerPair: getStopMarketPairKey(ORDER.chainId, ORDER.tokenIn, ORDER.tokenOut),
      slippage: 50,
    })
  })

  it('restores a window set from a preset as that preset', () => {
    const weekLong = { ...ORDER, deadline: ORDER.createdAt + 7 * DAY - 12 }
    expect(getStopMarketRecreateDraft(weekLong, EXPIRY)).toMatchObject({ expire: 7 * DAY, customDateExpire: undefined })
  })

  it('restores any other window as a custom date of the same length from now', () => {
    const twoWeeks = { ...ORDER, deadline: ORDER.createdAt + 14 * DAY }
    expect(getStopMarketRecreateDraft(twoWeeks, EXPIRY).customDateExpire).toBe(NOW + 14 * DAY * 1000)
    // The fixture ran 1783258149 → 1783344543, i.e. one day less six seconds.
    expect(getStopMarketRecreateDraft(ORDER, EXPIRY).customDateExpire).toBe(NOW + 86394 * 1000)
  })

  it('restores a deadline clamped to the service maximum as forever', () => {
    const forever = { ...ORDER, deadline: MAX_STOP_MARKET_DEADLINE }
    expect(getStopMarketRecreateDraft(forever, EXPIRY)).toMatchObject({
      expire: 36500 * DAY,
      customDateExpire: undefined,
    })
  })

  it('falls back to the default when the recorded window is not a positive duration', () => {
    const sameInstant = { ...ORDER, deadline: ORDER.createdAt }
    const reversed = { ...ORDER, deadline: ORDER.createdAt - 1000 }
    for (const order of [sameInstant, reversed]) {
      expect(getStopMarketRecreateDraft(order, EXPIRY)).toMatchObject({
        expire: EXPIRY.defaultExpire,
        customDateExpire: undefined,
      })
    }
  })

  it("leaves the slippage unset when the order carries none, so the pair's suggestion applies", () => {
    expect(getStopMarketRecreateDraft({ ...ORDER, slippage: 0 }, EXPIRY).slippage).toBeUndefined()
  })

  it('yields an empty trigger when the condition is missing rather than throwing', () => {
    const noCondition = { ...ORDER, condition: undefined } as unknown as typeof ORDER
    expect(getStopMarketRecreateDraft(noCondition, EXPIRY).triggerPrice).toBe('')
  })
})

describe('getStopMarketMinReceive', () => {
  it('takes the slippage allowed off the output at the trigger', () => {
    // 1,000 at the trigger with 0.5% slippage (50 bps).
    expect(getStopMarketMinReceive({ estimatedOutput: 1000, slippage: 50 })).toBeCloseTo(995)
  })

  it('takes the fee off the floor, so an executed order never received less than its minimum', () => {
    // Order 183: 0.01 WBNB at a 745 trigger, 1% slippage; it paid 0.22334406 USDT and received 7.22145798.
    const min = getStopMarketMinReceive({ estimatedOutput: 0.01 * 745, slippage: 100, fee: 0.223344061141 })
    expect(min).toBeCloseTo(7.15215594, 8)
    expect(min).toBeLessThanOrEqual(7.221457976892)
  })

  it('never goes below nothing', () => {
    expect(getStopMarketMinReceive({ estimatedOutput: 10, slippage: 20_000 })).toBe(0)
  })

  it('has no floor without an output to take it from', () => {
    expect(getStopMarketMinReceive({ estimatedOutput: 0, slippage: 50 })).toBeUndefined()
    expect(getStopMarketMinReceive({ estimatedOutput: Number.NaN, slippage: 50 })).toBeUndefined()
  })
})

describe('isStopMarketTriggerClose', () => {
  it('is close when the trigger is within 1% of the oracle price', () => {
    expect(isStopMarketTriggerClose({ triggerPrice: '99.5', marketPrice: 100, slippage: 0 })).toBe(true)
  })

  it('is not close when the trigger is 5% below the oracle price', () => {
    expect(isStopMarketTriggerClose({ triggerPrice: '95', marketPrice: 100, slippage: 50 })).toBe(false)
  })

  it('is close when the oracle price is inside the fill band, however far the trigger is', () => {
    // 50% slippage (5000 bps) makes the band 45 to 90.
    expect(isStopMarketTriggerClose({ triggerPrice: '90', marketPrice: 50, slippage: 5000 })).toBe(true)
    expect(isStopMarketTriggerClose({ triggerPrice: '90', marketPrice: 90, slippage: 5000 })).toBe(true)
  })

  it('is not close just under the floor', () => {
    expect(isStopMarketTriggerClose({ triggerPrice: '90', marketPrice: 44.99, slippage: 5000 })).toBe(false)
  })

  it('is not close above the trigger unless within 1%', () => {
    expect(isStopMarketTriggerClose({ triggerPrice: '90', marketPrice: 100, slippage: 5000 })).toBe(false)
  })

  it('is not close without a trigger or an oracle price', () => {
    expect(isStopMarketTriggerClose({ triggerPrice: '90', marketPrice: undefined, slippage: 50 })).toBe(false)
    expect(isStopMarketTriggerClose({ triggerPrice: '', marketPrice: 100, slippage: 50 })).toBe(false)
    expect(isStopMarketTriggerClose({ triggerPrice: '0', marketPrice: 100, slippage: 50 })).toBe(false)
  })
})

describe('getStopMarketOrderTooSmall', () => {
  it('reads the fee share from a too-small refusal', () => {
    expect(
      getStopMarketOrderTooSmall(
        'Order too small: protocol fee exceeds the maximum rate: fee would be 1000.0000%, max 10000 bps (minimum fee 0.001 ETH on this chain); increase the amount',
      ),
    ).toEqual({ feeShare: 1000 })
  })

  it('still flags the refusal when it names no share', () => {
    expect(getStopMarketOrderTooSmall('order too small; increase the amount')).toEqual({ feeShare: undefined })
  })

  it('ignores any other reason', () => {
    expect(getStopMarketOrderTooSmall('Slippage must exceed the maximum fees')).toBeUndefined()
    expect(getStopMarketOrderTooSmall(undefined)).toBeUndefined()
  })
})
