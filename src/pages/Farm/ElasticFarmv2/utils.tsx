import { Token } from '@kyberswap/ks-sdk-core'
import { TickMath, tickToPrice } from '@kyberswap/ks-sdk-elastic'

export function convertTickToPrice(baseToken?: Token, quoteToken?: Token, tick?: number): string | undefined {
  if (!baseToken || !quoteToken || tick === undefined) {
    return undefined
  }
  if ((tick || 0) <= TickMath.MIN_TICK) {
    return '0'
  }
  if ((tick || 0) >= TickMath.MAX_TICK) {
    return '∞'
  }
  return tickToPrice(baseToken, quoteToken, tick || 0)?.toSignificant(4)
}
