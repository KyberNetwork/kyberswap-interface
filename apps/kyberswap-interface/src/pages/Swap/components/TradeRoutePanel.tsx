import { type ReactNode, useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'react-feather'

import { ReactComponent as RoutingIcon } from 'assets/svg/routing_icon.svg'
import Skeleton from 'components/Skeleton'
import { HopCard, PairRow, PairTokenSlot, RouteContent, RouteList, TokenLink } from 'components/TradeRouting/styled'
import { cn } from 'utils/cn'

/** One-pool baseline: 20px heading + 8px gap + 31px/55px pool group + 26px card padding/border.
 * Additional graph nodes, pools and wrapped content can grow beyond this placeholder. */
export const TradeRouteSkeleton = ({ poolLines = 2 }: { poolLines?: 1 | 2 }) => (
  <RouteContent>
    <PairRow>
      {[0, 1].map(index => (
        <PairTokenSlot key={index}>
          <TokenLink as="div" reverse={index === 1}>
            <Skeleton height={24} variant="darkSubtle" width={108} />
          </TokenLink>
        </PairTokenSlot>
      ))}
    </PairRow>
    <div className="overflow-x-auto">
      <RouteList>
        <div className="flex min-w-[480px] justify-evenly gap-12 px-12 py-9">
          {[0, 1].map(index => (
            <HopCard key={index}>
              <Skeleton height={20} variant="darkSubtle" />
              <Skeleton height={poolLines === 1 ? 31 : 55} variant="darkSubtle" />
            </HopCard>
          ))}
        </div>
      </RouteList>
    </div>
  </RouteContent>
)

/** Shared route shell; owns expansion and optional scrolling, not route data.
 * Changes to defaultCollapsed reset expansion when the surrounding layout changes. */
type Props = {
  heading: ReactNode
  children: ReactNode
  defaultCollapsed?: boolean
  scrollOnExpand?: boolean
  onExpand?: () => void
}

const TradeRoutePanel = ({ heading, children, defaultCollapsed = false, scrollOnExpand = true, onExpand }: Props) => {
  const panelRef = useRef<HTMLDivElement>(null)
  const [isExpanded, setIsExpanded] = useState(!defaultCollapsed)
  useEffect(() => setIsExpanded(!defaultCollapsed), [defaultCollapsed])

  const handleToggle = () => {
    const nextExpanded = !isExpanded
    setIsExpanded(nextExpanded)

    if (!nextExpanded) return

    onExpand?.()

    if (!scrollOnExpand) return

    globalThis.requestAnimationFrame(() => {
      globalThis.requestAnimationFrame(() => {
        panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    })
  }

  return (
    <div ref={panelRef} className="overflow-hidden rounded-xl border border-darkBorder">
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isExpanded}
        className="group flex w-full cursor-pointer items-center justify-between gap-3 border-0 bg-background px-4 py-1.5 text-left text-subText"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <RoutingIcon className="size-6 shrink-0" />
          {heading}
        </div>
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-transparent transition-colors duration-150 ease-in-out group-hover:bg-tableHeader">
          <ChevronDown
            size={18}
            className={cn('text-subText transition-transform duration-150 ease-in-out', isExpanded && 'rotate-180')}
          />
        </div>
      </button>
      {isExpanded && <div className="border-t border-darkBorder p-4">{children}</div>}
    </div>
  )
}

export default TradeRoutePanel
