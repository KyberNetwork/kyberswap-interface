import { Currency } from '@kyberswap/ks-sdk-core'
import { TickMath, tickToPrice } from '@kyberswap/ks-sdk-elastic'

export function convertTickToPrice(baseToken: Currency, quoteToken: Currency, tickInput: number): string | undefined {
  const tick = Number(tickInput)

  if ((tick || 0) <= TickMath.MIN_TICK) {
    return '0'
  }
  if ((tick || 0) >= TickMath.MAX_TICK) {
    return '∞'
  }
  return tickToPrice(baseToken.wrapped, quoteToken.wrapped, tick)?.toSignificant(6)
}
