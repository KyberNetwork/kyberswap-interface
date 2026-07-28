import { matchPath, useLocation } from 'react-router-dom'

import Loader from 'components/LocalLoader'
import { AboutKncSkeleton, AboutKyberSwapSkeleton } from 'components/RouteFallback/AboutSkeletons'
import {
  EarnLandingSkeleton,
  EarnPoolsSkeleton,
  PoolDetailSkeleton,
  TablePageSkeleton,
} from 'components/RouteFallback/EarnPoolSkeletons'
import {
  EarnPositionDetailSkeleton,
  EarnPositionsSkeleton,
  SmartExitSkeleton,
} from 'components/RouteFallback/EarnPositionSkeletons'
import MarketSkeleton from 'components/RouteFallback/MarketSkeleton'
import { SwapPageSkeleton } from 'components/RouteFallback/TradeSkeletons'
import { APP_PATHS } from 'constants/index'
import { LEGACY_POOL_APP_PATHS } from 'constants/legacyPools'
import { isSwapLikePath } from 'utils/routes'

const startsWithAny = (pathname: string, prefixes: string[]) => prefixes.some(prefix => pathname.startsWith(prefix))

/**
 * Route-aware Suspense fallback: picks a page-shell skeleton matching the destination route while its
 * lazy chunk loads, instead of one global centered logo. Falls back to the logo loader for routes
 * without a tailored skeleton.
 */
const pickSkeleton = (rawPathname: string) => {
  const pathname = rawPathname.length > 1 ? rawPathname.replace(/\/+$/, '') : rawPathname

  if (isSwapLikePath(pathname) || pathname.startsWith(APP_PATHS.LIMIT) || pathname.startsWith(APP_PATHS.CROSS_CHAIN)) {
    return <SwapPageSkeleton />
  }

  if (pathname === APP_PATHS.EARN) {
    return <EarnLandingSkeleton />
  }
  if (pathname.startsWith(APP_PATHS.EARN_POOLS)) {
    return <EarnPoolsSkeleton />
  }
  if (pathname.startsWith(APP_PATHS.EARN_POSITIONS)) {
    return <EarnPositionsSkeleton />
  }
  if (pathname.startsWith(APP_PATHS.EARN_SMART_EXIT)) {
    return <SmartExitSkeleton />
  }

  if (pathname.startsWith(APP_PATHS.MARKET_OVERVIEW)) {
    return <MarketSkeleton />
  }
  if (pathname.startsWith(`${APP_PATHS.ABOUT}/kyberswap`)) {
    return <AboutKyberSwapSkeleton />
  }
  if (pathname.startsWith(`${APP_PATHS.ABOUT}/knc`)) {
    return <AboutKncSkeleton />
  }

  if (startsWithAny(pathname, [APP_PATHS.PARTNER_SWAP, APP_PATHS.USER_SWAP])) {
    return <SwapPageSkeleton />
  }

  if (matchPath({ path: APP_PATHS.POOL_DETAIL, end: true }, pathname)) {
    return <PoolDetailSkeleton />
  }

  if (matchPath({ path: APP_PATHS.EARN_POSITION_DETAIL, end: true }, pathname)) {
    return <EarnPositionDetailSkeleton />
  }

  if (pathname.startsWith(LEGACY_POOL_APP_PATHS.MY_POOLS)) {
    return <TablePageSkeleton />
  }

  return <Loader />
}

const RouteFallback = () => {
  const { pathname } = useLocation()

  return <div className="relative z-[1] flex w-full flex-1 flex-col items-center">{pickSkeleton(pathname)}</div>
}

export default RouteFallback
