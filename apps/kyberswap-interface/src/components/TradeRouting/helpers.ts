import type { Dex } from 'state/customizeDexes'
import { formatDisplayNumber } from 'utils/numbers'

// Split percentages can be very thin once chunk-splitting kicks in; render up to 1 decimal for
// legs above 1% and up to 2 decimals below (trailing zeros trimmed) so sub-1% legs keep enough
// precision not to collapse to "0%". Input is already in percent units (0–100).
export const formatRoutePercent = (percent: number): string =>
  formatDisplayNumber(percent / 100, { style: 'percent', fractionDigits: percent > 1 ? 1 : 2 })

const findDexById = (exchangeId: string, allDexes?: Dex[]): Dex | undefined => {
  if (!allDexes) return undefined
  return allDexes.find(
    dex =>
      dex.id === exchangeId ||
      ((exchangeId === 'kyberswap' || exchangeId === 'kyberswap-static') && dex.id === 'kyberswapv1'), // Mapping for kyberswap classic dex
  )
}

export const getDexInfoByPool = (exchange: string, allDexes?: Dex[]) => {
  if (exchange === '1inch') {
    return { name: '1inch', logoURL: 'https://s2.coinmarketcap.com/static/img/coins/64x64/8104.png' }
  }

  if (exchange === 'paraswap') {
    return { name: 'Paraswap', logoURL: 'https://s2.coinmarketcap.com/static/img/coins/64x64/14534.png' }
  }

  if (exchange === '0x') {
    return { name: '0x', logoURL: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1896.png' }
  }

  // Try to find in allDexes first
  const foundDex = findDexById(exchange, allDexes)
  if (foundDex) {
    return foundDex
  }

  // If not found, check if exchange contains '/' (format 'exchange/exchange')
  if (exchange.includes('/')) {
    const parts = exchange.split('/')
    if (parts.length === 2) {
      const [firstPart, secondPart] = parts
      const firstDex = findDexById(firstPart, allDexes)
      const secondDex = findDexById(secondPart, allDexes)

      // If both parts are found as dexes, return 'name/name' format
      if (firstDex && secondDex) {
        return { name: `${firstDex.name}/${secondDex.name}`, logoURL: '' }
      }
    }

    // If one or neither is found, return original exchange with empty logoURL
    return { name: exchange, logoURL: '' }
  }

  return undefined
}
