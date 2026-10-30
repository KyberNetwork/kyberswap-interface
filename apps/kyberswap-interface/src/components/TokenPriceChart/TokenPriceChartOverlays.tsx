import { type ReactNode, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronUp } from 'react-feather'

import { ScrollIndicator } from 'components/DropdownMenu/styles'
import { Stack } from 'components/Stack'
import {
  MARKER_LABEL_HEIGHT_PX,
  type MarkerLayout,
  type PlacedMarkerCluster,
  type PriceMarkerOverlay,
  clusterKey,
  flattenMarkerGroups,
  getClusterGroup,
  getCrossingArrow,
  splitMarkerIdsByGroup,
} from 'components/TokenPriceChart/priceMarkers'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'

const MARKER_LABEL_GAP_PX = 4
const MARKER_LABEL_FALLBACK_WIDTH_PX = 72
const MARKER_DETAILS_CLOSE_DELAY_MS = 150
const SHARED_LINE_DASH_PX = 6
const SHARED_LINE_GAP_PX = 3

/** A dashed line that gives each colour a dash in turn. */
const getSharedLineBackground = (colors: string[]) => {
  const step = SHARED_LINE_DASH_PX + SHARED_LINE_GAP_PX
  const stops = colors.map((color, index) => {
    const start = index * step
    const dashEnd = start + SHARED_LINE_DASH_PX
    return `${color} ${start}px ${dashEnd}px, transparent ${dashEnd}px ${start + step}px`
  })
  return `repeating-linear-gradient(90deg, ${stops.join(', ')})`
}

/**
 * The details panel's list, with arrows at its ends when there is more to scroll to — the same hint
 * the dropdown menus give, so a cut-off list reads as a list rather than as everything there is.
 */
const MarkerDetailsList = ({ children, contentKey }: { children: ReactNode; contentKey: string }) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)

  const updateScrollIndicators = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollUp(el.scrollTop > 0)
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 1)
  }, [])

  // Measured after layout, and again whenever the panel switches to another group of lines.
  useEffect(() => {
    const frame = requestAnimationFrame(updateScrollIndicators)
    return () => cancelAnimationFrame(frame)
  }, [contentKey, updateScrollIndicators])

  const scrollBy = (direction: 'up' | 'down') =>
    scrollRef.current?.scrollBy({ top: direction === 'up' ? -100 : 100, behavior: 'smooth' })

  return (
    <>
      <ScrollIndicator
        $visible={canScrollUp}
        onClick={() => scrollBy('up')}
        data-testid="price-marker-details-scroll-up"
      >
        <ChevronUp size={16} />
      </ScrollIndicator>
      <div ref={scrollRef} onScroll={updateScrollIndicators} className="min-h-0 flex-1 overflow-y-auto">
        {children}
      </div>
      <ScrollIndicator
        $visible={canScrollDown}
        onClick={() => scrollBy('down')}
        data-testid="price-marker-details-scroll-down"
      >
        <ChevronDown size={16} />
      </ScrollIndicator>
    </>
  )
}

/**
 * The tags and details drawn over the marker lines. The lines themselves are price lines on the
 * series; this layer only adds what a canvas line cannot carry — a label on the line, details on
 * hover or tap, and counts for markers outside the visible price range.
 */
export const PriceMarkerLayer = ({
  chartHeight,
  layout,
  overlay,
}: {
  chartHeight: number
  layout: MarkerLayout
  overlay: PriceMarkerOverlay
}) => {
  const [openMarker, setOpenMarker] = useState<{ key: string; pinned: boolean } | null>(null)
  const openKey = openMarker?.key
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  // Labels are measured once drawn: a label pushed into the next column sits past the one it would cover.
  const labelRefs = useRef(new Map<string, HTMLButtonElement | null>())
  const [labelWidths, setLabelWidths] = useState<Record<string, number>>({})

  useEffect(() => () => clearTimeout(closeTimerRef.current), [])

  useEffect(() => {
    setOpenMarker(current =>
      current && !layout.clusters.some(cluster => clusterKey(cluster) === current.key) ? null : current,
    )
  }, [layout.clusters])

  useLayoutEffect(() => {
    const next: Record<string, number> = {}
    layout.clusters.forEach(cluster => {
      const el = labelRefs.current.get(clusterKey(cluster))
      if (el) next[clusterKey(cluster)] = el.offsetWidth
    })
    const keys = Object.keys(next)
    if (keys.length !== Object.keys(labelWidths).length || keys.some(key => labelWidths[key] !== next[key])) {
      setLabelWidths(next)
    }
  }, [layout, labelWidths])

  // Clicked labels keep their details open until dismissed or another label is clicked.
  useEffect(() => {
    if (!openKey) return
    const close = () => {
      clearTimeout(closeTimerRef.current)
      setOpenMarker(null)
    }
    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest('[data-price-marker-layer]')) close()
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [openKey])

  const open = (key: string) => {
    clearTimeout(closeTimerRef.current)
    setOpenMarker(current => (current?.pinned ? current : { key, pinned: false }))
  }
  const togglePinned = (key: string) => {
    clearTimeout(closeTimerRef.current)
    setOpenMarker(current => (current?.key === key && current.pinned ? null : { key, pinned: true }))
  }
  const scheduleClose = () => {
    clearTimeout(closeTimerRef.current)
    closeTimerRef.current = setTimeout(
      () => setOpenMarker(current => (current?.pinned ? current : null)),
      MARKER_DETAILS_CLOSE_DELAY_MS,
    )
  }

  const right = layout.scaleWidth + 8
  const markers = useMemo(() => flattenMarkerGroups(overlay.groups), [overlay.groups])
  /** How far left of the axis a label sits: past every label it would otherwise cover. */
  const getLabelOffset = (cluster: PlacedMarkerCluster): number => {
    if (cluster.column === 0) return 0
    const covered = layout.clusters.find(
      other => other.column === cluster.column - 1 && Math.abs(other.y - cluster.y) < MARKER_LABEL_HEIGHT_PX,
    )
    if (!covered) return 0
    const width = labelWidths[clusterKey(covered)] ?? MARKER_LABEL_FALLBACK_WIDTH_PX
    return getLabelOffset(covered) + width + MARKER_LABEL_GAP_PX
  }
  // A group can dissolve under an open panel when zooming splits it; the panel goes with it.
  const openCluster = layout.clusters.find(cluster => clusterKey(cluster) === openKey)
  const spaceBelow = openCluster ? layout.paneHeight - openCluster.y - DETAILS_OFFSET_PX - DETAILS_EDGE_PX : 0
  const spaceAbove = openCluster ? openCluster.y - DETAILS_OFFSET_PX - DETAILS_EDGE_PX : 0
  // The chart card clips its overflow, so the panel opens toward the larger space and scrolls inside it.
  const opensBelow = spaceBelow >= spaceAbove

  return (
    <>
      {layout.sharedLines.map(line => (
        <div
          key={`${Math.round(line.y)}:${line.colors.join('/')}`}
          aria-hidden="true"
          data-testid="price-marker-shared-line"
          className="pointer-events-none absolute left-0 h-px -translate-y-1/2"
          style={{ top: line.y, right: layout.scaleWidth, backgroundImage: getSharedLineBackground(line.colors) }}
        />
      ))}
      {layout.clusters.map(cluster => {
        const key = clusterKey(cluster)
        const count = cluster.ids.length
        const group = getClusterGroup(cluster, overlay.groups)
        const isPinned = openKey === key && openMarker?.pinned
        return (
          <button
            key={key}
            ref={el => {
              labelRefs.current.set(key, el)
            }}
            type="button"
            data-testid="price-marker-label"
            data-marker-group={group.key}
            data-marker-count={count}
            data-marker-column={cluster.column}
            onMouseEnter={() => open(key)}
            onMouseLeave={scheduleClose}
            onFocus={() => open(key)}
            onClick={() => togglePinned(key)}
            aria-expanded={openKey === key}
            data-active={isPinned}
            data-price-marker-layer
            className={cn(
              'absolute z-[2] flex -translate-y-1/2 cursor-pointer items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium leading-[14px] transition-colors',
              group.tone === 'blue' ? 'border-blue' : 'border-warning',
              isPinned ? 'bg-tableHeader' : 'bg-buttonBlack hover:bg-buttonGray focus-visible:bg-buttonGray',
            )}
            style={{ top: cluster.y, right: right + getLabelOffset(cluster) }}
          >
            <span className="text-subText">
              {group.label} {getCrossingArrow(cluster.ids, markers)}
            </span>
            <span className={group.tone === 'blue' ? 'text-blue' : 'text-warning'}>
              {count > 1 ? `×${count}` : formatDisplayNumber(cluster.price, { significantDigits: 6 })}
            </span>
          </button>
        )
      })}

      {openCluster && (
        <div
          data-testid="price-marker-details"
          data-price-marker-layer
          onMouseEnter={() => open(clusterKey(openCluster))}
          onMouseLeave={scheduleClose}
          // Grows out of the pill it belongs to, from whichever side it opens on.
          className={cn(
            'absolute z-[3] flex flex-col overflow-hidden rounded-xl border border-border bg-tableHeader shadow-lg motion-reduce:animate-none',
            opensBelow ? 'origin-top-right animate-dropdownIn' : 'origin-bottom-right animate-dropupIn',
          )}
          style={{
            right: right + getLabelOffset(openCluster),
            maxHeight: Math.max(opensBelow ? spaceBelow : spaceAbove, 0),
            ...(opensBelow
              ? { top: openCluster.y + DETAILS_OFFSET_PX }
              : { bottom: chartHeight - openCluster.y + DETAILS_OFFSET_PX }),
          }}
        >
          <MarkerDetailsList contentKey={clusterKey(openCluster)}>
            <Stack className="gap-0">
              {splitMarkerIdsByGroup(openCluster.ids, overlay.groups).map((entry, index) => (
                <div key={entry.group.key} className={cn(index > 0 && 'border-t border-border')}>
                  {entry.group.renderDetails(entry.ids)}
                </div>
              ))}
            </Stack>
          </MarkerDetailsList>
        </div>
      )}
    </>
  )
}

/** Gap between a line's label and its details panel, and between the panel and the pane edge. */
const DETAILS_OFFSET_PX = 14
const DETAILS_EDGE_PX = 8
