import { Fragment, useCallback, useId, useMemo } from 'react'
import ScrollContainer from 'react-indiana-drag-scroll'

import CurrencyLogo from 'components/CurrencyLogo'
import Logo from 'components/Logo'
import { formatRoutePercent } from 'components/TradeRouting/helpers'
import type { RouteGraph, RouteGraphNode, RouteGraphPool } from 'components/TradeRouting/routeGraph'
import { buildRoutePaths } from 'components/TradeRouting/routePaths'
import { HopCard, PoolList, RouteDot, RouteList } from 'components/TradeRouting/styled'
import { useRouteGraphLayout } from 'components/TradeRouting/useRouteGraphLayout'

const RouteGraphView = ({ graph }: { graph: RouteGraph }) => {
  const markerId = useId()
  const { svgRef, contentRef, registerNode, onScroll, layout } = useRouteGraphLayout(graph)
  const paths = useMemo(() => (layout ? buildRoutePaths(graph, layout.nodeRects, layout.svgRect) : []), [graph, layout])

  return (
    <ScrollContainer vertical={false} onScroll={onScroll}>
      <RouteList>
        <div className="relative w-max min-w-full">
          <RouteDot />
          <RouteDot out />
          <svg ref={svgRef} className="pointer-events-none absolute inset-0 z-10 size-full text-primary">
            <defs>
              <marker id={markerId} markerWidth="4" markerHeight="4" refX="4" refY="2" orient="auto">
                <polygon points="0 0, 4 2, 0 4" fill="currentColor" />
              </marker>
            </defs>
            {paths.map(node => (
              <Fragment key={node.id}>
                {node.terminal && (
                  <>
                    {node.terminal.percent !== undefined && (
                      <text
                        x={node.terminal.label.x}
                        y={node.terminal.label.y}
                        className="fill-current text-[10px] font-medium"
                      >
                        {formatRoutePercent(node.terminal.percent)}
                      </text>
                    )}
                    <path
                      d={node.terminal.path}
                      className="stroke-white/[0.06]"
                      strokeWidth="1.5"
                      markerEnd={`url(#${markerId})`}
                      fill="none"
                    />
                    <path d={node.terminal.connector} className="stroke-white/[0.06]" strokeWidth="1.5" fill="none" />
                  </>
                )}
                {node.inputConnector && (
                  <path d={node.inputConnector} className="stroke-white/[0.06]" strokeWidth="1.5" fill="none" />
                )}
                {node.paths.map(path => (
                  <Fragment key={path.id}>
                    {path.percent !== undefined && (
                      <text x={path.label.x} y={path.label.y} className="fill-current text-[10px] font-medium">
                        {formatRoutePercent(path.percent)}
                      </text>
                    )}
                    <path
                      d={path.path}
                      className="stroke-white/[0.06]"
                      strokeWidth="1.5"
                      markerEnd={`url(#${markerId})`}
                      fill="none"
                    />
                  </Fragment>
                ))}
              </Fragment>
            ))}
          </svg>
          <div
            ref={contentRef}
            className="flex justify-evenly gap-12 px-12 py-9"
            style={{ minWidth: graph.maxLevel * 168 + (graph.maxLevel + 1) * 48 }}
          >
            {graph.levels.map(level => (
              <div key={level} className="flex shrink-0 flex-col justify-around gap-6">
                {graph.nodes
                  .filter(node => graph.maximumPathLengths[node.id] === level)
                  .map(node => (
                    <RouteNode key={node.id} node={node} registerNode={registerNode} />
                  ))}
              </div>
            ))}
          </div>
        </div>
      </RouteList>
    </ScrollContainer>
  )
}

export default RouteGraphView

const RouteNode = ({
  node,
  registerNode,
}: {
  node: RouteGraphNode
  registerNode: (id: string, element: HTMLDivElement | null) => void
}) => {
  const registerElement = useCallback(
    (element: HTMLDivElement | null) => registerNode(node.id, element),
    [node.id, registerNode],
  )
  const Heading = node.href ? 'a' : 'div'

  return (
    <HopCard ref={registerElement}>
      <Heading
        href={node.href}
        target={node.href ? '_blank' : undefined}
        rel={node.href ? 'noreferrer' : undefined}
        className="flex min-h-5 items-center gap-1.5 whitespace-nowrap text-xs font-medium text-subText no-underline"
      >
        {node.currency ? (
          <CurrencyLogo currency={node.currency} size="20px" />
        ) : node.logoSources ? (
          <span className="relative shrink-0">
            <Logo srcs={node.logoSources} width={20} height={20} className="rounded-full" alt="" />
            {node.chainBadge && (
              <img
                src={node.chainBadge.src}
                alt={node.chainBadge.name}
                className="absolute -bottom-1 -right-1 size-2 rounded-full"
              />
            )}
          </span>
        ) : null}
        <span>{node.label}</span>
      </Heading>
      {node.groups.map(group => (
        <PoolList key={group.id}>
          {group.label && <div className="text-xs font-medium text-subText">{group.label}</div>}
          {group.pools.map(pool => (
            <RoutePool key={pool.id} pool={pool} />
          ))}
        </PoolList>
      ))}
    </HopCard>
  )
}

const RoutePool = ({ pool }: { pool: RouteGraphPool }) => {
  const Component = pool.href ? 'a' : 'div'

  return (
    <Component
      href={pool.href}
      target={pool.href ? '_blank' : undefined}
      rel={pool.href ? 'noreferrer' : undefined}
      className="flex items-center gap-1 whitespace-nowrap text-[10px] text-subText no-underline"
    >
      {pool.logo && <img src={pool.logo} alt="" className="size-3 rounded-full" />}
      <span className="flex-1">{pool.name}</span>
      {pool.percent !== undefined && <span>{formatRoutePercent(pool.percent)}</span>}
    </Component>
  )
}
