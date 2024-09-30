import useThrottle from '../../hooks/useThrottle'
import { Dex } from '../../hooks/useSwap'
import { SwapPool } from '../../utils/aggregationRouting'

export const getDexInfoByPool = (pool: SwapPool, allDexes?: Dex[]): { name: string; logoURL: string } | undefined => {
  return allDexes?.find(
    dex =>
      dex.dexId === pool.exchange ||
      ((pool.exchange === 'kyberswap' || pool.exchange === 'kyberswap-static') && dex.dexId === 'kyberswapv1'), // Mapping for kyberswap classic dex
  )
}

export const getSwapPercent = (percent?: number, routeNumber = 0): string | null => {
  if (routeNumber === 1) {
    return '100%'
  }
  if (!percent && percent !== 0) {
    return null
  }
  const val = routeNumber > 1 ? Math.min(99.99, Math.max(0.01, percent)) : percent
  return `${val.toFixed(0)}%`
}

export const onScroll = (element: HTMLDivElement | null) => {
  if ((element?.scrollTop ?? 0) > 0) {
    element?.classList.add('top')
  } else {
    element?.classList.remove('top')
  }
  if ((element?.scrollHeight ?? 0) - (element?.scrollTop ?? 0) > (element?.clientHeight ?? 0)) {
    element?.classList.add('bottom')
  } else {
    element?.classList.remove('bottom')
  }
}

export const useShadow = (
  scrollRef: React.RefObject<HTMLDivElement>,
  shadowRef: React.RefObject<HTMLDivElement>,
  contentRef: React.RefObject<HTMLDivElement>,
) => {
  const handleShadow = useThrottle(() => {
    const element: any = scrollRef.current
    if (element?.scrollLeft > 0) {
      shadowRef.current?.classList.add('left-visible')
    } else {
      shadowRef.current?.classList.remove('left-visible')
    }

    if (Math.floor((contentRef.current?.scrollWidth || 0) - element?.scrollLeft) > Math.floor(element?.clientWidth)) {
      shadowRef.current?.classList.add('right-visible')
    } else {
      shadowRef.current?.classList.remove('right-visible')
    }
  }, 300)
  return handleShadow
}
