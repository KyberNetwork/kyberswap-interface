import { matchPath, useLocation } from 'react-router-dom'

import Loader from 'components/LocalLoader'
import { AboutKncSkeleton, AboutKyberSwapSkeleton } from 'components/RouteFallback/AboutSkeletons'
import { EarnLandingSkeleton, EarnPoolsSkeleton } from 'components/RouteFallback/EarnPoolSkeletons'
import { EarnPositionsSkeleton } from 'components/RouteFallback/EarnPositionSkeletons'
import MarketSkeleton from 'components/RouteFallback/MarketSkeleton'
import { SmartExitSkeleton } from 'components/RouteFallback/SmartExitSkeletons'
import { SwapPageSkeleton } from 'components/RouteFallback/TradeSkeletons'
import { DetailPageSkeleton } from 'components/RouteFallback/common'
import { APP_PATHS } from 'constants/index'
import { isPathOrChild, isSwapLikePath } from 'utils/routes'

const matchesAnyRoute = (pathname: string, paths: string[]) => paths.some(path => isPathOrChild(pathname, path))

const pickSkeleton = (rawPathname: string) => {
  const pathname = rawPathname.length > 1 ? rawPathname.replace(/\/+$/, '') : rawPathname

  if (isSwapLikePath(pathname) || matchesAnyRoute(pathname, [APP_PATHS.LIMIT, APP_PATHS.CROSS_CHAIN])) {
    return <SwapPageSkeleton />
  }
  if (matchesAnyRoute(pathname, [APP_PATHS.PARTNER_SWAP, APP_PATHS.USER_SWAP])) {
    return <SwapPageSkeleton />
  }

  if (pathname === APP_PATHS.EARN) {
    return <EarnLandingSkeleton />
  }
  if (isPathOrChild(pathname, APP_PATHS.EARN_POOLS)) {
    return <EarnPoolsSkeleton />
  }
  if (isPathOrChild(pathname, APP_PATHS.EARN_POSITIONS)) {
    return <EarnPositionsSkeleton />
  }
  if (isPathOrChild(pathname, APP_PATHS.EARN_SMART_EXIT)) {
    return <SmartExitSkeleton />
  }
  if (matchPath({ path: APP_PATHS.POOL_DETAIL, end: true }, pathname)) {
    return <DetailPageSkeleton />
  }
  if (matchPath({ path: APP_PATHS.EARN_POSITION_DETAIL, end: true }, pathname)) {
    return <DetailPageSkeleton />
  }

  if (isPathOrChild(pathname, APP_PATHS.MARKET_OVERVIEW)) {
    return <MarketSkeleton />
  }

  if (isPathOrChild(pathname, `${APP_PATHS.ABOUT}/kyberswap`)) {
    return <AboutKyberSwapSkeleton />
  }
  if (isPathOrChild(pathname, `${APP_PATHS.ABOUT}/knc`)) {
    return <AboutKncSkeleton />
  }

  return <Loader />
}

/**
 * Route-aware fallback shared by runtime Suspense and prerendered cold-load markup.
 *
 * Keep skeletons presentational and dependency-light, mirroring only the page's major structure. Treat
 * page-owned loading UI as the source of truth and share primitives instead of duplicating implementations.
 * Routes without a dedicated skeleton fall back to `Loader`.
 */
const RouteFallback = () => {
  const { pathname } = useLocation()

  return <div className="relative z-[1] flex w-full flex-1 flex-col items-center">{pickSkeleton(pathname)}</div>
}

export default RouteFallback
