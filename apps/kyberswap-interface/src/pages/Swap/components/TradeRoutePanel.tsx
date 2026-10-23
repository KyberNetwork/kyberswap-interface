import { type ReactNode, useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'react-feather'

import { ReactComponent as RoutingIcon } from 'assets/svg/routing_icon.svg'
import Skeleton from 'components/Skeleton'
import { HStack, Stack } from 'components/Stack'
import { HopCard, PoolList } from 'components/TradeRouting/styled'
import { cn } from 'utils/cn'

export const TradeRouteSkeleton = ({ crossChain = false }: { crossChain?: boolean }) => {
  return (
    <Stack className="gap-10 py-3">
      <HStack className="items-center justify-between gap-4">
        <Skeleton height={24} variant="darkSubtle" width={108} />
        <Skeleton height={24} variant="darkSubtle" width={108} />
      </HStack>

      <HStack className="justify-evenly gap-3 overflow-x-auto">
        {[0, 1].map(index => (
          <HopCard key={index} className={cn('flex flex-col gap-1', crossChain && 'min-w-[220px] basis-[220px]')}>
            <HStack className={cn('h-6 items-start gap-1.5 pb-2', crossChain && 'h-4 items-center pb-0')}>
              <Skeleton height={16} variant="darkSubtle" width={16} />
              <Skeleton height={12} variant="darkSubtle" width={crossChain ? 140 : 88} />
            </HStack>
            <PoolList className="mt-0">
              <HStack className="h-5 items-center gap-1">
                <Skeleton height={14} variant="darkSubtle" width={14} />
                <Skeleton height={10} variant="darkSubtle" width={72} />
              </HStack>
            </PoolList>
          </HopCard>
        ))}
      </HStack>
    </Stack>
  )
}

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
