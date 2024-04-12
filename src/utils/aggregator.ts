import {
  Currency,
  CurrencyAmount,
  Fraction,
  Percent,
  Price,
  Token,
  TokenAmount,
  TradeType,
} from '@kyberswap/ks-sdk-core'
import { captureException } from '@sentry/react'
import JSBI from 'jsbi'
import invariant from 'tiny-invariant'

import { ETHER_ADDRESS, KYBERSWAP_SOURCE, sentryRequestId } from 'constants/index'

import fetchWaiting from './fetchWaiting'

const toCurrencyAmount = function (value: string, currency: Currency): CurrencyAmount<Currency> {
  try {
    return TokenAmount.fromRawAmount(currency, JSBI.BigInt(value))
  } catch (e) {
    return TokenAmount.fromRawAmount(currency, 0)
  }
}

const isResultInvalid = (result: any) => {
  return (
    !result ||
    !result.inputAmount ||
    !result.outputAmount ||
    typeof result.swaps?.[0]?.[0].pool !== 'string' ||
    !result.tokens ||
    result.inputAmount === '0' ||
    result.outputAmount === '0'
  )
}

type Swap = {
  pool: string
  tokenIn: string
  tokenOut: string
  swapAmount: string
  amountOut: string
  limitReturnAmount: string
  maxPrice: string
  exchange: string
  poolLength: number
  poolType: string
  extra:
    | {
        poolLength: number
        tokenInIndex: number
        tokenOutIndex: number
      }
    | undefined
  collectAmount: string | undefined
  recipient: string | undefined
}
type Tokens = {
  [address: string]: (Token & { price: number }) | undefined
}
/**
 */
export class Aggregator {
  /**
   * The type of the trade, either exact in or exact out.
   */
  public readonly tradeType: TradeType
  /**
   * The input amount for the trade assuming no slippage.
   */
  public readonly inputAmount: CurrencyAmount<Currency>
  /**
   * The output amount for the trade assuming no slippage.
   */
  public readonly outputAmount: CurrencyAmount<Currency>
  /**
   */
  public readonly swaps: Swap[][]
  /**
   */
  public readonly tokens: Tokens
  /**
   * The price expressed in terms of output amount/input amount.
   */
  public readonly executionPrice: Price<Currency, Currency>

  public readonly amountInUsd: number
  public readonly amountOutUsd: number
  public readonly receivedUsd: number
  public readonly gasUsd: number | undefined
  // -1 mean can not get price of token => can not calculate price impact
  public readonly priceImpact: number
  public readonly encodedSwapData: string
  public readonly routerAddress: string
  public readonly to: string

  private constructor(
    inputAmount: CurrencyAmount<Currency>,
    outputAmount: CurrencyAmount<Currency>,
    amountInUsd: number,
    amountOutUsd: number,
    receivedUsd: number,
    swaps: any[][],
    tokens: any,
    tradeType: TradeType,
    gasUsd: number,
    priceImpact: number,
    encodedSwapData: string,
    routerAddress: string,
    to: string,
  ) {
    this.tradeType = tradeType
    this.inputAmount = inputAmount
    this.outputAmount = outputAmount
    this.amountInUsd = amountInUsd
    this.amountOutUsd = amountOutUsd
    this.receivedUsd = receivedUsd
    this.executionPrice = new Price(
      this.inputAmount.currency,
      this.outputAmount.currency,
      this.inputAmount.quotient,
      this.outputAmount.quotient,
    )
    try {
      this.swaps = swaps
    } catch (e) {
      this.swaps = [[]]
    }
    try {
      this.tokens = tokens
    } catch (e) {
      this.tokens = {}
    }
    this.gasUsd = gasUsd
    this.priceImpact = priceImpact
    this.encodedSwapData = encodedSwapData
    this.routerAddress = routerAddress
    this.to = to
  }

  /**
   * Get the minimum amount that must be received from this trade for the given slippage tolerance
   * @param slippageTolerance tolerance of unfavorable slippage from the execution price of this trade
   */
  public minimumAmountOut(slippageTolerance: Percent): CurrencyAmount<Currency> {
    invariant(!slippageTolerance.lessThan(JSBI.BigInt(0)), 'SLIPPAGE_TOLERANCE')
    if (this.tradeType === TradeType.EXACT_OUTPUT) {
      return this.outputAmount
    } else {
      const slippageAdjustedAmountOut = new Fraction(JSBI.BigInt(1))
        .add(slippageTolerance)
        .invert()
        .multiply(this.outputAmount.quotient).quotient
      return TokenAmount.fromRawAmount(this.outputAmount.currency, slippageAdjustedAmountOut)
    }
  }

  /**
   * Get the maximum amount in that can be spent via this trade for the given slippage tolerance
   * @param slippageTolerance tolerance of unfavorable slippage from the execution price of this trade
   */
  public maximumAmountIn(slippageTolerance: Percent): CurrencyAmount<Currency> {
    invariant(!slippageTolerance.lessThan(JSBI.BigInt(0)), 'SLIPPAGE_TOLERANCE')
    if (this.tradeType === TradeType.EXACT_INPUT) {
      return this.inputAmount
    } else {
      const slippageAdjustedAmountIn = new Fraction(JSBI.BigInt(1))
        .add(slippageTolerance)
        .multiply(this.inputAmount.quotient).quotient
      return TokenAmount.fromRawAmount(this.inputAmount.currency, slippageAdjustedAmountIn)
    }
  }

  /**
   * @param baseURL
   * @param currencyAmountIn exact amount of input currency to spend
   * @param currencyOut the desired currency out
   * @param dexes
   * @param slippageTolerance
   * @param deadline
   * @param to
   * @param signal
   * @param minimumLoadingTime
   */
  public static async bestTradeExactIn(
    baseURL: string,
    currencyAmountIn: CurrencyAmount<Currency>,
    currencyOut: Currency,
    dexes = '',
    slippageTolerance: number,
    deadline: number | undefined,
    to: string,
    signal: AbortSignal,
    minimumLoadingTime: number,
    permit?: string | null,
  ): Promise<Aggregator | null> {
    const amountIn = currencyAmountIn
    const tokenOut = currencyOut.wrapped

    const tokenInAddress = currencyAmountIn.currency.isNative ? ETHER_ADDRESS : amountIn.currency.wrapped.address
    const tokenOutAddress = currencyOut.isNative ? ETHER_ADDRESS : tokenOut.address
    if (tokenInAddress && tokenOutAddress) {
      const search = new URLSearchParams({
        // Trade config
        tokenIn: tokenInAddress,
        tokenOut: tokenOutAddress,
        amountIn: currencyAmountIn.quotient?.toString(),
        saveGas: '0',
        gasInclude: '1',
        ...(dexes ? { dexes } : {}),
        slippageTolerance: slippageTolerance?.toString() ?? '',
        deadline: deadline?.toString() ?? '',
        to,

        // Client data
        clientData: KYBERSWAP_SOURCE,
        permit: permit ?? '',
      })
      try {
        const response = await fetchWaiting(
          `${baseURL}?${search}`,
          {
            signal,
            headers: {
              'X-Request-Id': sentryRequestId,
              'Accept-Version': 'Latest',
            },
          },
          minimumLoadingTime,
        )
        if (Math.round(response.status / 100) !== 2) throw new Error('Aggregator status fail: ' + response.status)
        const result = await response.json()
        if (isResultInvalid(result)) {
          return null
        }

        const outputAmount = toCurrencyAmount(result?.outputAmount, currencyOut)

        const priceImpact = !result.amountOutUsd
          ? NaN
          : ((-result.amountOutUsd + result.amountInUsd) * 100) / result.amountInUsd

        return new Aggregator(
          currencyAmountIn,
          outputAmount,
          result.amountInUsd,
          result.amountOutUsd,
          result.receivedUsd,
          result.swaps || [],
          result.tokens || {},
          TradeType.EXACT_INPUT,
          result.gasUsd,
          priceImpact,
          result.encodedSwapData,
          result.routerAddress,
          to,
        )
      } catch (e) {
        // ignore aborted request error
        if (!e?.message?.includes('Fetch is aborted') && !e?.message?.includes('The user aborted a request')) {
          console.error('Aggregator error:', e?.stack || e)
          const sentryError = new Error('Aggregator API call failed', { cause: e })
          sentryError.name = 'AggregatorAPIError'
          captureException(sentryError, { level: 'error' })
        }
      }
    }

    return null
  }
}
