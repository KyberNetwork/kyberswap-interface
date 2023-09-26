import { defaultAbiCoder } from '@ethersproject/abi'
import { keccak256 } from '@ethersproject/solidity'
import { Price, Token } from '@kyberswap/ks-sdk-core'
import {
  FeeAmount,
  Pool,
  TICK_SPACINGS,
  TickMath,
  encodeSqrtRatioX96,
  nearestUsableTick,
  priceToClosestTick,
} from '@kyberswap/ks-sdk-elastic'
import { getCreate2Address } from 'ethers/lib/utils'
import JSBI from 'jsbi'

import { NETWORKS_INFO } from 'constants/networks'
import { EVMNetworkInfo } from 'constants/networks/type'
import { rangeData } from 'pages/AddLiquidityV2/constants'
import { PairFactor } from 'state/topTokens/type'

import { RANGE } from './type'

export function tryParsePrice(baseToken?: Token, quoteToken?: Token, value?: string) {
  if (!baseToken || !quoteToken || !value) {
    return undefined
  }

  if (!value.match(/^\d*\.?\d+$/)) {
    return undefined
  }

  const [whole, fraction] = value.split('.')

  const decimals = fraction?.length ?? 0
  const withoutDecimals = JSBI.BigInt((whole ?? '') + (fraction ?? ''))

  return new Price(
    baseToken,
    quoteToken,
    JSBI.multiply(JSBI.BigInt(10 ** decimals), JSBI.BigInt(10 ** baseToken.decimals)), //denom
    JSBI.multiply(withoutDecimals, JSBI.BigInt(10 ** quoteToken.decimals)), //num
  )
}

export function tryParseTick(
  baseToken?: Token,
  quoteToken?: Token,
  feeAmount?: FeeAmount,
  value?: string,
): number | undefined {
  if (!baseToken || !quoteToken || !feeAmount || !value) {
    return undefined
  }

  const price = tryParsePrice(baseToken, quoteToken, value)

  if (!price) {
    return undefined
  }

  let tick: number

  // check price is within min/max bounds, if outside return min/max
  const sqrtRatioX96 = encodeSqrtRatioX96(price.numerator, price.denominator)

  if (JSBI.greaterThanOrEqual(sqrtRatioX96, TickMath.MAX_SQRT_RATIO)) {
    tick = TickMath.MAX_TICK
  } else if (JSBI.lessThanOrEqual(sqrtRatioX96, TickMath.MIN_SQRT_RATIO)) {
    tick = TickMath.MIN_TICK
  } else {
    // this function is agnostic to the base, will always return the correct tick
    tick = priceToClosestTick(price)
  }

  return nearestUsableTick(tick, TICK_SPACINGS[feeAmount])
}

const log10001 = (num: number) => Math.log(num) / Math.log(1.0001)

export const getRangeTicks = (
  range: RANGE,
  tokenA: Token,
  tokenB: Token,
  currentTick: number,
  pairFactor: PairFactor,
) => {
  const rangeFactor = rangeData[range].factor
  const leftRange = 1 - (pairFactor * rangeFactor) / 10000
  const rightRange = 1 + (pairFactor * rangeFactor) / 10000

  const result1 = [currentTick + Math.floor(log10001(leftRange)), currentTick + Math.ceil(log10001(rightRange))]
  const result2 = [currentTick + Math.floor(log10001(1 / leftRange)), currentTick + Math.ceil(log10001(1 / rightRange))]
  const result = tokenA.sortsBefore(tokenB) ? result1 : result2

  return result
}

export function getPoolAddress(pool: Pool): string {
  const networkInfo = NETWORKS_INFO[pool.token0.chainId] as EVMNetworkInfo
  return getCreate2Address(
    networkInfo.elastic.coreFactory,
    keccak256(
      ['bytes'],
      [defaultAbiCoder.encode(['address', 'address', 'uint24'], [pool.token0.address, pool.token1.address, pool.fee])],
    ),
    networkInfo.elastic.initCodeHash,
  )
}
