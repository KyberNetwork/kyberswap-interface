import { Token } from '@kyberswap/ks-sdk-core'
import { TickMath, tickToPrice } from '@kyberswap/ks-sdk-elastic'

export function convertTickToPrice(baseToken?: Token, quoteToken?: Token, tickInput?: number): string | undefined {
  if (!baseToken || !quoteToken || tickInput === undefined) {
    return undefined
  }

  const tick = Number(tickInput)

  if ((tick || 0) <= TickMath.MIN_TICK) {
    return '0'
  }
  if ((tick || 0) >= TickMath.MAX_TICK) {
    return '∞'
  }
  return tickToPrice(baseToken, quoteToken, tick || 0)?.toSignificant(4)
}
