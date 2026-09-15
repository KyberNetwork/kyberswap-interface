import { matchPath, useLocation } from 'react-router-dom'

import Loader from 'components/LocalLoader'
import { AboutKncSkeleton, AboutKyberSwapSkeleton } from 'components/RouteFallback/AboutSkeletons'
import { EarnLandingSkeleton, EarnPoolsSkeleton } from 'components/RouteFallback/EarnPoolSkeletons'
import { EarnPositionsSkeleton } from 'components/RouteFallback/EarnPositionSkeletons'
import EarnShellSkeleton from 'components/RouteFallback/EarnShellSkeleton'
import {
  EarnMyVaultsSkeleton,
  EarnVaultDetailSkeleton,
  EarnVaultsSkeleton,
} from 'components/RouteFallback/EarnVaultSkeletons'
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

  // Everything below lives inside the lazy EarnLayout, so each stand-in wears the same shell —
  // without it the page shifted sideways by the sidebar's width once the chunk arrived.
  if (pathname === APP_PATHS.EARN) {
    return (
      <EarnShellSkeleton>
        <EarnLandingSkeleton />
      </EarnShellSkeleton>
    )
  }
  if (isPathOrChild(pathname, APP_PATHS.EARN_POOLS)) {
    return (
      <EarnShellSkeleton>
        <EarnPoolsSkeleton />
      </EarnShellSkeleton>
    )
  }
  if (isPathOrChild(pathname, APP_PATHS.EARN_POSITIONS)) {
    return (
      <EarnShellSkeleton>
        <EarnPositionsSkeleton />
      </EarnShellSkeleton>
    )
  }
  if (isPathOrChild(pathname, APP_PATHS.EARN_SMART_EXIT)) {
    return (
      <EarnShellSkeleton>
        <SmartExitSkeleton />
      </EarnShellSkeleton>
    )
  }
  if (isPathOrChild(pathname, APP_PATHS.EARN_MY_VAULTS)) {
    return (
      <EarnShellSkeleton>
        <EarnMyVaultsSkeleton />
      </EarnShellSkeleton>
    )
  }
  if (isPathOrChild(pathname, APP_PATHS.EARN_VAULTS)) {
    return (
      <EarnShellSkeleton>
        <EarnVaultsSkeleton />
      </EarnShellSkeleton>
    )
  }
  if (matchPath({ path: APP_PATHS.EARN_VAULT_DETAIL, end: true }, pathname)) {
    return (
      <EarnShellSkeleton>
        <EarnVaultDetailSkeleton />
      </EarnShellSkeleton>
    )
  }
  if (matchPath({ path: APP_PATHS.POOL_DETAIL, end: true }, pathname)) {
    return (
      <EarnShellSkeleton>
        <DetailPageSkeleton />
      </EarnShellSkeleton>
    )
  }
  if (matchPath({ path: APP_PATHS.EARN_POSITION_DETAIL, end: true }, pathname)) {
    return (
      <EarnShellSkeleton>
        <DetailPageSkeleton />
      </EarnShellSkeleton>
    )
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
 * Keep skeletons presentational and dependency-light. The real page layout is the visual source of truth;
 * shared list skeleton bodies live here and page data-loading states reuse them instead of maintaining copies.
 * Routes without a dedicated skeleton fall back to `Loader`.
 */
const RouteFallback = () => {
  const { pathname } = useLocation()

  return <div className="relative z-[1] flex w-full flex-1 flex-col items-center">{pickSkeleton(pathname)}</div>
}

export default RouteFallback
