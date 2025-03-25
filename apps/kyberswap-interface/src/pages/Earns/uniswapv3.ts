const MaxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')

// The minimum tick that can be used on any pool.
export const MIN_TICK = -887272
// The maximum tick that can be used on any pool.
export const MAX_TICK: number = -MIN_TICK
const MIN_SQRT_RATIO = 4295128739n
const MAX_SQRT_RATIO = 1461446703485210103287273052203988822378723970342n

const Q96: bigint = 2n ** 96n // 2^96 as BigInt
const Q32: bigint = 2n ** 32n
const Q192: bigint = Q96 ** 2n

export function priceToClosestTick(
  value: string,
  token0Decimal: number,
  token1Decimal: number,
  revert = false,
): number | undefined {
  if (!value.match(/^\d*\.?\d+$/)) return
  const [whole, fraction] = value.split('.')

  const decimals = fraction?.length ?? 0
  const withoutDecimals = BigInt((whole ?? '') + (fraction ?? ''))

  const denominator = BigInt(10 ** decimals) * 10n ** BigInt(revert ? token1Decimal : token0Decimal)
  const numerator = withoutDecimals * 10n ** BigInt(revert ? token0Decimal : token1Decimal)

  //const sqrtRatioX96 = encodeSqrtRatioX96(numerator, denominator);
  const sqrtRatioX96 = !revert ? encodeSqrtRatioX96(numerator, denominator) : encodeSqrtRatioX96(denominator, numerator)
  if (sqrtRatioX96 > MAX_SQRT_RATIO) return MAX_TICK
  if (sqrtRatioX96 < MIN_SQRT_RATIO) return MIN_TICK

  let tick
  try {
    tick = getTickAtSqrtRatio(sqrtRatioX96)
  } catch (error) {
    console.log(error)
  }
  if (tick === undefined) return

  const tickPrice = tickToPrice(tick, token0Decimal, token1Decimal, revert)
  const nextTickPrice = tickToPrice(tick + 1, token0Decimal, token1Decimal, revert)
  const diffCurrent = Math.abs(+value - +tickPrice)
  const diffNext = Math.abs(+value - +nextTickPrice)

  if (diffNext < diffCurrent) {
    tick++
  }

  return tick
}

export function nearestUsableTick(tick: number, tickSpacing: number) {
  if (!Number.isInteger(tick) || !Number.isInteger(tickSpacing)) return // Error('INTEGERS')
  if (tickSpacing <= 0) return // Error('TICK_SPACING')
  if (tick < MIN_TICK || tick > MAX_TICK) return // Error('TICK_BOUND')
  const rounded = Math.round(tick / tickSpacing) * tickSpacing
  if (rounded < MIN_TICK) return rounded + tickSpacing
  if (rounded > MAX_TICK) return rounded - tickSpacing
  return rounded
}

function mulShift(val: bigint, mulBy: string): bigint {
  return (val * BigInt(mulBy)) >> 128n
}

// Function to convert tick to sqrt(price) Q96
function getSqrtRatioAtTick(tick: number): bigint {
  if (tick < MIN_TICK || tick > MAX_TICK || !Number.isInteger(tick)) {
    throw new Error(`TICK ${tick}: must be within bounds MIN_TICK and MAX_TICK`)
  }
  const absTick: number = tick < 0 ? tick * -1 : tick

  let ratio: bigint =
    (absTick & 0x1) != 0 ? BigInt('0xfffcb933bd6fad37aa2d162d1a594001') : BigInt('0x100000000000000000000000000000000')
  if ((absTick & 0x2) != 0) ratio = mulShift(ratio, '0xfff97272373d413259a46990580e213a')
  if ((absTick & 0x4) != 0) ratio = mulShift(ratio, '0xfff2e50f5f656932ef12357cf3c7fdcc')
  if ((absTick & 0x8) != 0) ratio = mulShift(ratio, '0xffe5caca7e10e4e61c3624eaa0941cd0')
  if ((absTick & 0x10) != 0) ratio = mulShift(ratio, '0xffcb9843d60f6159c9db58835c926644')
  if ((absTick & 0x20) != 0) ratio = mulShift(ratio, '0xff973b41fa98c081472e6896dfb254c0')
  if ((absTick & 0x40) != 0) ratio = mulShift(ratio, '0xff2ea16466c96a3843ec78b326b52861')
  if ((absTick & 0x80) != 0) ratio = mulShift(ratio, '0xfe5dee046a99a2a811c461f1969c3053')
  if ((absTick & 0x100) != 0) ratio = mulShift(ratio, '0xfcbe86c7900a88aedcffc83b479aa3a4')
  if ((absTick & 0x200) != 0) ratio = mulShift(ratio, '0xf987a7253ac413176f2b074cf7815e54')
  if ((absTick & 0x400) != 0) ratio = mulShift(ratio, '0xf3392b0822b70005940c7a398e4b70f3')
  if ((absTick & 0x800) != 0) ratio = mulShift(ratio, '0xe7159475a2c29b7443b29c7fa6e889d9')
  if ((absTick & 0x1000) != 0) ratio = mulShift(ratio, '0xd097f3bdfd2022b8845ad8f792aa5825')
  if ((absTick & 0x2000) != 0) ratio = mulShift(ratio, '0xa9f746462d870fdf8a65dc1f90e061e5')
  if ((absTick & 0x4000) != 0) ratio = mulShift(ratio, '0x70d869a156d2a1b890bb3df62baf32f7')
  if ((absTick & 0x8000) != 0) ratio = mulShift(ratio, '0x31be135f97d08fd981231505542fcfa6')
  if ((absTick & 0x10000) != 0) ratio = mulShift(ratio, '0x9aa508b5b7a84e1c677de54f3e99bc9')
  if ((absTick & 0x20000) != 0) ratio = mulShift(ratio, '0x5d6af8dedb81196699c329225ee604')
  if ((absTick & 0x40000) != 0) ratio = mulShift(ratio, '0x2216e584f5fa1ea926041bedfe98')
  if ((absTick & 0x80000) != 0) ratio = mulShift(ratio, '0x48a170391f7dc42444e8fa2')

  if (tick > 0) ratio = MaxUint256 / ratio

  // back to Q96
  return ratio % Q32 > 0n ? ratio / Q32 + 1n : ratio / Q32
}

const TWO = 2n
const POWERS_OF_2 = [128, 64, 32, 16, 8, 4, 2, 1].map((pow: number): [number, bigint] => [pow, TWO ** BigInt(pow)])

function mostSignificantBit(x: bigint): number {
  if (x <= 0) throw new Error('x must be greater than 0')
  if (x > MaxUint256) throw new Error('x must be less than MaxUint256')

  let msb = 0
  for (const [power, min] of POWERS_OF_2) {
    if (x >= min) {
      // eslint-disable-next-line operator-assignment
      x = x >> BigInt(power)
      msb += power
    }
  }
  return msb
}

function getTickAtSqrtRatio(sqrtRatioX96: bigint): number {
  if (sqrtRatioX96 < MIN_SQRT_RATIO || sqrtRatioX96 > MAX_SQRT_RATIO) {
    throw new Error('SQRT_RATIO')
  }

  const sqrtRatioX128 = sqrtRatioX96 << 32n

  const msb = mostSignificantBit(sqrtRatioX128)

  let r: bigint
  if (BigInt(msb) >= 128n) {
    r = sqrtRatioX128 >> BigInt(msb - 127)
  } else {
    r = sqrtRatioX128 << BigInt(127 - msb)
  }

  let log_2: bigint = (BigInt(msb) - 128n) << 64n

  for (let i = 0; i < 14; i++) {
    r = (r * r) >> 127n
    const f = r >> 128n
    // eslint-disable-next-line operator-assignment
    log_2 = log_2 | (f << BigInt(63 - i))
    // eslint-disable-next-line operator-assignment
    r = r >> f
  }

  const log_sqrt10001 = log_2 * 255738958999603826347141n

  const tickLow = Number((log_sqrt10001 - 3402992956809132418596140100660247210n) >> 128n)
  const tickHigh = Number((log_sqrt10001 + 291339464771989622907027621153398088495n) >> 128n)

  return tickLow === tickHigh ? tickLow : getSqrtRatioAtTick(tickHigh) <= sqrtRatioX96 ? tickHigh : tickLow
}

function tickToPrice(tick: number, baseDecimal: number, quoteDecimal: number, revert = false): string {
  const sqrtRatioX96 = getSqrtRatioAtTick(tick)
  const ratioX192 = sqrtRatioX96 * sqrtRatioX96 // 1.0001 ** tick * Q192

  const numerator = ratioX192 * 10n ** BigInt(baseDecimal)
  const denominator = Q192 * 10n ** BigInt(quoteDecimal)

  return revert ? divideBigIntToString(denominator, numerator, 18) : divideBigIntToString(numerator, denominator, 18)
}

function sqrt(y: bigint): bigint {
  if (y < 0n) {
    throw new Error('sqrt: negative value')
  }
  let z = 0n
  let x: bigint
  if (y > 3n) {
    z = y
    x = y / 2n + 1n
    while (x < z) {
      z = x
      x = (y / x + x) / 2n
    }
  } else if (y !== 0n) {
    z = 1n
  }
  return z
}

function encodeSqrtRatioX96(amount1: bigint, amount0: bigint): bigint {
  const numerator = BigInt(amount1) << 192n
  const denominator = BigInt(amount0)
  const ratioX192 = numerator / denominator
  return sqrt(ratioX192)
}

function divideBigIntToString(numerator: bigint, denominator: bigint, decimalPlaces: number): string {
  const integerPart = numerator / denominator
  // Calculate the remainder and use it to find decimal places
  let remainder = numerator % denominator
  let decimalStr = ''

  for (let i = 0; i < decimalPlaces; i++) {
    remainder *= 10n
    const digit = remainder / denominator
    decimalStr += digit.toString()
    remainder %= denominator
  }

  return `${integerPart.toString()}.${decimalStr}`
}
