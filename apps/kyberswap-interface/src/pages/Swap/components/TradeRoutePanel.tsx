import { type ReactNode, useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'react-feather'

import { ReactComponent as RoutingIcon } from 'assets/svg/routing_icon.svg'
import { cn } from 'utils/cn'

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
