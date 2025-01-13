import { SwapRouteV3 } from 'utils/aggregationRouting'

export const RouteRowV3 = ({ tradeComposition }: { tradeComposition: SwapRouteV3[] }) => {
  const firstSwaps = tradeComposition.filter(item => item.depth === 1)

  return (
    <>
      {firstSwaps.map((swap, index) => {
        return <div>{swap.exchange}</div>
      })}
    </>
  )
}
