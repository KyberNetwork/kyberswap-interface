import { useCallback, useLayoutEffect, useRef, useState } from 'react'

import type { RouteRect } from 'components/TradeRouting/routeGeometry'
import type { RouteGraph } from 'components/TradeRouting/routeGraph'

const readRect = (element: Element): RouteRect => {
  const { x, y, width, height } = element.getBoundingClientRect()
  return { x, y, width, height }
}

const equalRect = (a: RouteRect | undefined, b: RouteRect) =>
  a?.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height

type GraphLayout = { svgRect: RouteRect; nodeRects: Record<string, RouteRect> }

export const useRouteGraphLayout = (graph: RouteGraph) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const elements = useRef(new Map<string, HTMLDivElement>())
  const observer = useRef<ResizeObserver | null>(null)
  const frame = useRef<number | null>(null)
  const [layout, setLayout] = useState<GraphLayout | null>(null)

  const measure = useCallback(() => {
    if (!svgRef.current) return

    const svgRect = readRect(svgRef.current)
    const nodeRects: Record<string, RouteRect> = {}
    elements.current.forEach((element, id) => {
      nodeRects[id] = readRect(element)
    })
    nodeRects[graph.inputId] = { ...svgRect, width: 1, x: svgRect.x + 10 }

    setLayout(previous =>
      previous &&
      equalRect(previous.svgRect, svgRect) &&
      Object.keys(previous.nodeRects).length === Object.keys(nodeRects).length &&
      Object.entries(nodeRects).every(([id, rect]) => equalRect(previous.nodeRects[id], rect))
        ? previous
        : { svgRect, nodeRects },
    )
  }, [graph.inputId])

  const scheduleMeasure = useCallback(() => {
    if (frame.current !== null) return
    frame.current = requestAnimationFrame(() => {
      frame.current = null
      measure()
    })
  }, [measure])

  const registerNode = useCallback((id: string, element: HTMLDivElement | null) => {
    const previous = elements.current.get(id)
    if (previous) observer.current?.unobserve(previous)
    if (element) {
      elements.current.set(id, element)
      observer.current?.observe(element)
    } else {
      elements.current.delete(id)
    }
  }, [])

  useLayoutEffect(() => {
    observer.current = new ResizeObserver(scheduleMeasure)
    if (svgRef.current) observer.current.observe(svgRef.current)
    if (contentRef.current) observer.current.observe(contentRef.current)
    elements.current.forEach(element => observer.current?.observe(element))
    window.addEventListener('resize', scheduleMeasure)
    measure()

    return () => {
      observer.current?.disconnect()
      observer.current = null
      window.removeEventListener('resize', scheduleMeasure)
      if (frame.current !== null) cancelAnimationFrame(frame.current)
      frame.current = null
    }
  }, [graph, measure, scheduleMeasure])

  return { svgRef, contentRef, registerNode, onScroll: scheduleMeasure, layout }
}
