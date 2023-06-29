import { Currency } from '@kyberswap/ks-sdk-core'
import { FeeAmount, TICK_SPACINGS, TickMath, nearestUsableTick, tickToPrice } from '@kyberswap/ks-sdk-elastic'

export function convertTickToPrice(
  baseToken: Currency,
  quoteToken: Currency,
  tickInput: number,
  feeAmount: FeeAmount,
): string | undefined {
  const tick = Number(tickInput)

  if ((tick || 0) <= nearestUsableTick(TickMath.MIN_TICK, TICK_SPACINGS[feeAmount])) {
    return '0'
  }
  if ((tick || 0) >= nearestUsableTick(TickMath.MAX_TICK, TICK_SPACINGS[feeAmount])) {
    return '∞'
  }
  return tickToPrice(baseToken.wrapped, quoteToken.wrapped, tick)?.toSignificant(6)
}
