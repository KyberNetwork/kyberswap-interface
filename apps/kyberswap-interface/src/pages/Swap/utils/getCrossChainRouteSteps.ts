import { z } from 'zod'

import type { Quote } from 'pages/Swap/crossChain/registry'

export type RouteStep = {
  type: 'swap' | 'bridge' | 'route'
  provider: string
  logo?: string
}

const kyberCrossSteps = z.object({
  data: z.object({
    route_plan: z.object({
      flow_type: z.enum(['bridge_only', 'swap_then_bridge', 'bridge_then_swap', 'swap_bridge_swap']),
      bridge: z.object({ provider: z.string() }),
    }),
  }),
})

/** Show one provider step, except KyberCross which exposes its route plan. */
export const getCrossChainRouteSteps = ({ adapter, quote }: Quote): RouteStep[] => {
  const provider = adapter.getName()
  const name = provider.toLowerCase().replace(/[^a-z]/g, '')
  const raw = quote.rawQuote

  if (name === 'kybercross') {
    const result = kyberCrossSteps.safeParse(raw)
    if (result.success) {
      const plan = result.data.data.route_plan
      const swap: RouteStep = { type: 'swap', provider: 'KyberSwap' }
      return [
        ...(['swap_then_bridge', 'swap_bridge_swap'].includes(plan.flow_type) ? [swap] : []),
        { type: 'bridge', provider: plan.bridge.provider },
        ...(['bridge_then_swap', 'swap_bridge_swap'].includes(plan.flow_type) ? [swap] : []),
      ]
    }
  }

  return [{ type: 'route', provider, logo: adapter.getIcon() }]
}
