import { Pair } from '@kyberswap/ks-sdk-classic'
import { ChainId, Currency, CurrencyAmount, Fraction, Price } from '@kyberswap/ks-sdk-core'
import JSBI from 'jsbi'
import { useMemo } from 'react'

import { NativeCurrencies } from 'constants/tokens'
import { ClassicPoolData } from 'hooks/pool/classic/type'
import { UserLiquidityPosition } from 'state/pools/hooks'
import { tryParseAmount } from 'state/swap/hooks'
import { formatDisplayNumber } from 'utils/numbers'
import { isTokenNative } from 'utils/tokenInfo'
import { unwrappedToken } from 'utils/wrappedCurrency'

export function priceRangeCalc(
  price?: Price<Currency, Currency> | Fraction,
  amp?: Fraction,
): [Fraction | undefined, Fraction | undefined] {
  //Ex amp = 1.23456
  if (amp && (amp.equalTo(JSBI.BigInt(1)) || amp?.equalTo(JSBI.BigInt(0)))) return [undefined, undefined]
  const temp = amp?.divide(amp?.subtract(JSBI.BigInt(1)))
  if (!amp || !temp || !price) return [undefined, undefined]
  if (price instanceof Price) {
    return [
      price.asFraction.multiply(price.scalar).multiply(temp.multiply(temp)),
      price.asFraction.multiply(price.scalar).divide(temp.multiply(temp)),
    ]
  }
  return [price.asFraction.multiply(temp.multiply(temp)), price?.divide(temp.multiply(temp))]
}

export function parseSubgraphPoolData(
  poolData: ClassicPoolData,
  chainId: ChainId,
): {
  reserve0: CurrencyAmount<Currency> | undefined
  virtualReserve0: CurrencyAmount<Currency> | undefined
  reserve1: CurrencyAmount<Currency> | undefined
  virtualReserve1: CurrencyAmount<Currency> | undefined
  totalSupply: CurrencyAmount<Currency> | undefined
  currency0: Currency
  currency1: Currency
} {
  const currency0 = unwrappedToken(poolData.token0)
  const currency1 = unwrappedToken(poolData.token1)

  const reserve0 = tryParseAmount(poolData.reserve0, currency0)
  const virtualReserve0 = tryParseAmount(poolData.vReserve0, currency0)
  const reserve1 = tryParseAmount(poolData.reserve1, currency1)
  const virtualReserve1 = tryParseAmount(poolData.vReserve1, currency1)
  const totalSupply = tryParseAmount(poolData.totalSupply, NativeCurrencies[chainId]) // Only care about decimals 18

  return {
    reserve0,
    virtualReserve0,
    reserve1,
    virtualReserve1,
    totalSupply,
    currency0,
    currency1,
  }
}

// const temp = pool.virtualReserve1.subtract(pool.reserve1).divide(pool.reserve1.decimalScale).asFraction

function getToken0MinPrice(pool: Pair | ClassicPoolData): Fraction {
  if (pool instanceof Pair) {
    const temp = pool.virtualReserve1.subtract(pool.reserve1).divide(pool.reserve1.decimalScale).asFraction
    return temp
      .multiply(temp)
      .divide(
        pool.virtualReserve0
          .divide(pool.virtualReserve0.decimalScale)
          .asFraction.multiply(pool.virtualReserve1.divide(pool.virtualReserve1.decimalScale).asFraction),
      )
  } else {
    const { reserve0, virtualReserve0, reserve1, virtualReserve1 } = parseSubgraphPoolData(pool, 1) // chainId doesn't matter.
    if (reserve0 && virtualReserve0 && reserve1 && virtualReserve1) {
      const temp = virtualReserve1.subtract(reserve1).divide(reserve1.decimalScale).asFraction
      return temp
        .multiply(temp)
        .divide(
          virtualReserve0
            .divide(virtualReserve0.decimalScale)
            .asFraction.multiply(virtualReserve1.divide(virtualReserve1.decimalScale).asFraction),
        )
    } else {
      return new Fraction('-1')
    }
  }
}

function getToken0MaxPrice(pool: Pair | ClassicPoolData): Fraction {
  if (pool instanceof Pair) {
    const temp = pool.virtualReserve0.subtract(pool.reserve0).divide(pool.virtualReserve0.decimalScale).asFraction

    // Avoid error division by 0
    if (temp.equalTo(new Fraction('0'))) {
      return new Fraction('-1')
    }

    return pool.virtualReserve0
      .divide(pool.virtualReserve0.decimalScale)
      .asFraction.multiply(pool.virtualReserve1.divide(pool.virtualReserve1.decimalScale).asFraction)
      .divide(temp.multiply(temp))
  } else {
    const { reserve0, virtualReserve0, reserve1, virtualReserve1 } = parseSubgraphPoolData(pool, 1) // chainId doesn't matter.
    if (reserve0 && virtualReserve0 && reserve1 && virtualReserve1) {
      const temp = virtualReserve0.subtract(reserve0).divide(virtualReserve0.decimalScale).asFraction

      // Avoid error division by 0
      if (temp.equalTo(new Fraction('0'))) {
        return new Fraction('-1')
      }

      return virtualReserve0
        .divide(virtualReserve0.decimalScale)
        .asFraction.multiply(virtualReserve1.divide(virtualReserve1.decimalScale).asFraction)
        .divide(temp.multiply(temp))
    } else {
      return new Fraction('-1')
    }
  }
}

function getToken1MinPrice(pool: Pair | ClassicPoolData): Fraction {
  if (pool instanceof Pair) {
    const temp = pool.virtualReserve0.subtract(pool.reserve0).divide(pool.reserve0.decimalScale).asFraction

    return temp
      .multiply(temp)
      .divide(
        pool.virtualReserve0
          .divide(pool.virtualReserve0.decimalScale)
          .asFraction.multiply(pool.virtualReserve1.divide(pool.virtualReserve1.decimalScale).asFraction),
      )
  } else {
    const { reserve0, virtualReserve0, reserve1, virtualReserve1 } = parseSubgraphPoolData(pool, 1) // chainId doesn't matter.
    if (reserve0 && virtualReserve0 && reserve1 && virtualReserve1) {
      const temp = virtualReserve0.subtract(reserve0).divide(reserve0.decimalScale).asFraction
      return temp
        .multiply(temp)
        .divide(
          virtualReserve0
            .divide(virtualReserve0.decimalScale)
            .asFraction.multiply(virtualReserve1.divide(virtualReserve1.decimalScale).asFraction),
        )
    } else {
      return new Fraction('-1')
    }
  }
}

function getToken1MaxPrice(pool: Pair | ClassicPoolData): Fraction {
  if (pool instanceof Pair) {
    const temp = pool.virtualReserve1.subtract(pool.reserve1).divide(pool.reserve1.decimalScale).asFraction

    // Avoid error division by 0
    if (temp.equalTo(new Fraction('0'))) {
      return new Fraction('-1')
    }

    return pool.virtualReserve0
      .divide(pool.virtualReserve0.decimalScale)
      .asFraction.multiply(pool.virtualReserve1.divide(pool.virtualReserve1.decimalScale).asFraction)
      .divide(temp)
      .divide(temp)
  } else {
    const { reserve0, virtualReserve0, reserve1, virtualReserve1 } = parseSubgraphPoolData(pool, 1) // chainId doesn't matter.
    if (reserve0 && virtualReserve0 && reserve1 && virtualReserve1) {
      const temp = virtualReserve1.subtract(reserve1).divide(reserve1.decimalScale).asFraction

      // Avoid error division by 0
      if (temp.equalTo(new Fraction('0'))) {
        return new Fraction('-1')
      }

      return virtualReserve0
        .divide(virtualReserve0.decimalScale)
        .asFraction.multiply(virtualReserve1.divide(virtualReserve1.decimalScale).asFraction)
        .divide(temp)
        .divide(temp)
    } else {
      return new Fraction('-1')
    }
  }
}

export const priceRangeCalcByPair = (pair?: Pair): [Fraction | undefined, Fraction | undefined][] => {
  //Ex amp = 1.23456
  if (!pair || new Fraction(JSBI.BigInt(pair.amp)).equalTo(JSBI.BigInt(10000)))
    return [
      [undefined, undefined],
      [undefined, undefined],
    ]
  return [
    [getToken0MinPrice(pair), getToken0MaxPrice(pair)],
    [getToken1MinPrice(pair), getToken1MaxPrice(pair)],
  ]
}

export const priceRangeCalcBySubgraphPool = (
  pool?: ClassicPoolData,
): [Fraction | undefined, Fraction | undefined][] => {
  if (!pool || new Fraction(pool.amp).equalTo(JSBI.BigInt(10000)))
    return [
      [undefined, undefined],
      [undefined, undefined],
    ]
  return [
    [getToken0MinPrice(pool), getToken0MaxPrice(pool)],
    [getToken1MinPrice(pool), getToken1MaxPrice(pool)],
  ]
}

export const feeRangeCalc = (amp: number): string => {
  let baseFee = 0
  if (amp > 20) baseFee = 4
  if (amp <= 20 && amp > 5) baseFee = 10
  if (amp <= 5 && amp > 2) baseFee = 20
  if (amp <= 2) baseFee = 30

  return `${(baseFee / 2 / 100).toPrecision()}% - ${((baseFee * 2) / 100).toPrecision()}%`
}

export const getTradingFeeAPR = (liquidity?: string, feeOneDay?: string): number => {
  return !feeOneDay || !liquidity || parseFloat(liquidity) === 0
    ? 0
    : (parseFloat(feeOneDay) * 365 * 100) / parseFloat(liquidity)
}

const DEFAULT_MY_LIQUIDITY = '--'

export const getMyLiquidity = (
  liquidityPosition?: UserLiquidityPosition,
  defaultValue = DEFAULT_MY_LIQUIDITY,
): string => {
  if (!liquidityPosition || parseFloat(liquidityPosition.pool.totalSupply) === 0) {
    return defaultValue
  }

  const myLiquidity =
    (parseFloat(liquidityPosition.liquidityTokenBalance) * parseFloat(liquidityPosition.pool.reserveUSD)) /
    parseFloat(liquidityPosition.pool.totalSupply)

  return formatDisplayNumber(myLiquidity, { style: 'currency', significantDigits: 4, allowDisplayZero: false })
}

export function useCurrencyConvertedToNative(currency?: Currency): Currency | undefined {
  return useMemo(() => {
    if (!!currency) {
      return isTokenNative(currency, currency.chainId) ? NativeCurrencies[currency.chainId] : currency
    }
    return undefined
  }, [currency])
}
