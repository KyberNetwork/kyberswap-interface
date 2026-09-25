import { ReactNode } from 'react'
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

/** The body of an Earn page on its own, without the shell that frames it. */
const pickEarnBody = (pathname: string): ReactNode => {
  if (pathname === APP_PATHS.EARN) return <EarnLandingSkeleton />
  if (isPathOrChild(pathname, APP_PATHS.EARN_POOLS)) return <EarnPoolsSkeleton />
  if (isPathOrChild(pathname, APP_PATHS.EARN_POSITIONS)) return <EarnPositionsSkeleton />
  if (isPathOrChild(pathname, APP_PATHS.EARN_SMART_EXIT)) return <SmartExitSkeleton />
  if (isPathOrChild(pathname, APP_PATHS.EARN_MY_VAULTS)) return <EarnMyVaultsSkeleton />
  if (isPathOrChild(pathname, APP_PATHS.EARN_VAULTS)) return <EarnVaultsSkeleton />
  if (matchPath({ path: APP_PATHS.EARN_VAULT_DETAIL, end: true }, pathname)) return <EarnVaultDetailSkeleton />
  if (matchPath({ path: APP_PATHS.POOL_DETAIL, end: true }, pathname)) return <DetailPageSkeleton />
  if (matchPath({ path: APP_PATHS.EARN_POSITION_DETAIL, end: true }, pathname)) return <DetailPageSkeleton />
  return null
}

const pickSkeleton = (rawPathname: string, insideShell: boolean) => {
  const pathname = rawPathname.length > 1 ? rawPathname.replace(/\/+$/, '') : rawPathname

  if (isSwapLikePath(pathname) || matchesAnyRoute(pathname, [APP_PATHS.LIMIT, APP_PATHS.CROSS_CHAIN])) {
    return <SwapPageSkeleton />
  }
  if (matchesAnyRoute(pathname, [APP_PATHS.PARTNER_SWAP, APP_PATHS.USER_SWAP])) {
    return <SwapPageSkeleton />
  }

  const earnBody = pickEarnBody(pathname)
  if (earnBody) {
    // Inside the layout the sidebar and breadcrumbs are the real ones, already on screen. Outside
    // it — a cold load, where the layout's own chunk is still coming — the stand-in wears the shell
    // too, or the page would shift sideways by the sidebar's width once that chunk arrives.
    return insideShell ? earnBody : <EarnShellSkeleton>{earnBody}</EarnShellSkeleton>
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
 * Route-aware fallback shared by runtime Suspense and prerendered cold-load markup. `insideShell`
 * marks the boundary that sits within `EarnLayout`, whose own frame is already rendered.
 *
 * Keep skeletons presentational and dependency-light. The real page layout is the visual source of truth;
 * shared list skeleton bodies live here and page data-loading states reuse them instead of maintaining copies.
 * Routes without a dedicated skeleton fall back to `Loader`.
 */
const RouteFallback = ({ insideShell = false }: { insideShell?: boolean }) => {
  const { pathname } = useLocation()

  return (
    <div className="relative z-[1] flex w-full flex-1 flex-col items-center">{pickSkeleton(pathname, insideShell)}</div>
  )
}

export default RouteFallback
