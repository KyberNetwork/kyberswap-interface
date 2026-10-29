import { ReactNode } from 'react'

import Skeleton from 'components/Skeleton'
import {
  SIDEBAR_WIDTH_COLLAPSED,
  SIDEBAR_WIDTH_EXPANDED,
  readStoredSidebarCollapsed,
} from 'pages/Earns/components/EarnLayout/constants'

/**
 * Stands in for `EarnLayout` while its chunk loads.
 *
 * Every Earn page renders inside a sidebar + content area, but the layout is lazy — so without this
 * the fallback drew a full-width page that jumped sideways by the sidebar's width the moment the
 * chunk arrived. The classes below mirror `EarnLayout`, `EarnSidebar` and `EarnBreadcrumbs`; those
 * three are the source of truth, and they are not imported here because the fallback ships in the
 * main bundle and the sidebar pulls framer-motion.
 *
 * The background image is left to the real layout: fetching it here would put a decorative asset on
 * the critical path.
 */

const SidebarItemSkeleton = ({ collapsed, width }: { collapsed: boolean; width: number }) =>
  collapsed ? (
    <div className="flex h-9 items-center px-2">
      <Skeleton width={20} height={20} />
    </div>
  ) : (
    <div className="flex h-9 items-center gap-3 px-2">
      <Skeleton width={20} height={20} />
      <Skeleton width={width} height={14} />
    </div>
  )

/** Two groups — Liquidity Pools (3 items) and Partner Vaults (2) — matching the real nav. */
const SIDEBAR_GROUPS = [
  { header: 108, items: [96, 88, 116] },
  { header: 104, items: [92, 76] },
] as const

const EarnSidebarSkeleton = ({ collapsed }: { collapsed: boolean }) => {
  const width = collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED

  return (
    <div
      className="flex shrink-0 flex-col gap-4 overflow-hidden whitespace-nowrap px-3 pb-3 pt-6 max-md:hidden"
      style={{ width, minWidth: width }}
      aria-hidden
    >
      <div className="flex h-9 items-center gap-2 px-2">
        <Skeleton width={20} height={20} />
        {!collapsed && <Skeleton width={72} height={16} />}
      </div>

      {SIDEBAR_GROUPS.map((group, groupIndex) => (
        <div key={groupIndex} className="flex flex-col gap-2">
          {!collapsed && (
            <div className="px-2 py-1">
              <Skeleton width={group.header} height={11} />
            </div>
          )}
          {group.items.map((itemWidth, itemIndex) => (
            <SidebarItemSkeleton key={itemIndex} collapsed={collapsed} width={itemWidth} />
          ))}
        </div>
      ))}
    </div>
  )
}

/** Only rendered below the sidebar's breakpoint, where the real layout swaps it for a drawer toggle. */
const EarnBreadcrumbsSkeleton = () => (
  <div className="mb-4 hidden min-w-0 items-center gap-2 max-md:flex" aria-hidden>
    <Skeleton width={36} height={36} />
    <Skeleton width={140} height={16} />
  </div>
)

const EarnShellSkeleton = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-[calc(100vh-148px)] w-full">
    <EarnSidebarSkeleton collapsed={readStoredSidebarCollapsed()} />
    <div className="mx-auto flex min-w-0 max-w-[1600px] flex-1 flex-col px-9 pb-7 pt-8 max-md:px-6 max-md:pb-12 max-md:pt-7 max-sm:px-4 max-sm:pb-10 max-sm:pt-5 max-xxs:px-3 max-xxs:pb-9 max-xxs:pt-4">
      <EarnBreadcrumbsSkeleton />
      {children}
    </div>
  </div>
)

export default EarnShellSkeleton
