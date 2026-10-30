import { z } from 'zod'

import { getSocketTxRoute, parseSocketQuote } from 'pages/Swap/crossChain/adapters/BungeeAdapter/utils'
import type { Quote } from 'pages/Swap/crossChain/registry'

const amount = z.string().regex(/^\d+$/)
const token = z.object({
  symbol: z.string(),
  decimals: z.number().int().min(0).max(255),
  chainId: z.number(),
  address: z.string(),
  logoURI: z.string().optional(),
  icon: z.string().optional(),
})

export type RouteToken = z.infer<typeof token>
export type RouteStep = {
  type: 'swap' | 'bridge' | 'wrap' | 'unwrap' | 'route'
  provider: string
  logo?: string
  tokenOut?: RouteToken
  amountOut?: string
}

const lifiSteps = z.object({
  includedSteps: z
    .array(
      z.object({
        type: z.enum(['swap', 'cross', 'protocol']),
        tool: z.string().optional(),
        toolDetails: z.object({ name: z.string(), logoURI: z.string().optional() }),
        action: z.object({ toToken: token }),
        estimate: z.object({ toAmount: amount }).optional(),
      }),
    )
    .min(1),
})

const acrossStep = z.object({
  tokenOut: token,
  outputAmount: amount,
  swapProvider: z.object({ name: z.string() }).optional(),
})
const acrossSteps = z.object({
  steps: z.object({
    originSwap: acrossStep.nullish(),
    bridge: acrossStep,
    destinationSwap: acrossStep.nullish(),
  }),
})

const symbiosisSteps = z.object({
  routes: z.array(z.object({ provider: z.string(), tokens: z.array(token).min(2) })).min(1),
})
const protocol = z.object({ displayName: z.string(), icon: z.string().optional() })
const socketDetails = z.object({
  routeDetails: z.object({
    dexDetails: z.object({ protocol }).nullish(),
    bridgeDetails: z.object({ protocol }),
  }),
})

const kyberCrossSteps = z.object({
  data: z.object({
    route_plan: z.object({
      flow_type: z.enum(['bridge_only', 'swap_then_bridge', 'bridge_then_swap', 'swap_bridge_swap']),
      bridge: z.object({ provider: z.string() }),
    }),
  }),
})

/** Read only documented/observed route metadata, never infer swaps from the endpoint symbols.
 * Unknown provider payloads remain one aggregate route instead of invented intermediate legs.
 */
export const getCrossChainRouteSteps = ({ adapter, quote }: Quote): RouteStep[] => {
  const provider = adapter.getName()
  const name = provider.toLowerCase().replace(/[^a-z]/g, '')
  const raw = quote.rawQuote

  if (name === 'lifi') {
    const result = lifiSteps.safeParse(raw)
    // LI.FI includes integrator fee collection as a protocol step, not a routing leg.
    const steps = result.success ? result.data.includedSteps.filter(step => step.tool !== 'feeCollection') : []
    if (steps.length)
      return steps.map(step => ({
        type: step.type === 'cross' ? 'bridge' : step.type === 'swap' ? 'swap' : 'route',
        provider: step.toolDetails.name,
        logo: step.toolDetails.logoURI,
        tokenOut: step.action.toToken,
        amountOut: step.estimate?.toAmount,
      }))
  }

  if (name === 'across') {
    const result = acrossSteps.safeParse(raw)
    if (result.success) {
      const { originSwap, bridge, destinationSwap } = result.data.steps
      const swap = (step: z.infer<typeof acrossStep>): RouteStep => ({
        type: 'swap',
        provider: step.swapProvider?.name || provider,
        tokenOut: step.tokenOut,
        amountOut: step.outputAmount,
      })
      return [
        ...(originSwap ? [swap(originSwap)] : []),
        {
          type: 'bridge',
          provider,
          logo: adapter.getIcon(),
          tokenOut: bridge.tokenOut,
          amountOut: bridge.outputAmount,
        },
        ...(destinationSwap ? [swap(destinationSwap)] : []),
      ]
    }
  }

  if (name === 'symbiosis') {
    const result = symbiosisSteps.safeParse(raw)
    if (result.success)
      return result.data.routes.map(step => {
        const first = step.tokens[0]
        const last = step.tokens[step.tokens.length - 1]
        return {
          type:
            step.provider === 'wrap' || step.provider === 'unwrap'
              ? step.provider
              : first.chainId !== last.chainId
              ? 'bridge'
              : 'swap',
          provider: step.provider,
          // The provider sometimes sends placeholder symbols and empty intermediate amounts.
          tokenOut: /^token(In|Out)$/.test(last.symbol) ? undefined : last,
        }
      })
  }

  if (name === 'bungee' || name === 'socket') {
    try {
      // Use the same chosen route as execution; rawQuote.routes also includes alternatives.
      const result = socketDetails.safeParse(getSocketTxRoute(parseSocketQuote(raw)))
      if (result.success) {
        const { dexDetails, bridgeDetails } = result.data.routeDetails
        return [
          ...(dexDetails
            ? [{ type: 'swap' as const, provider: dexDetails.protocol.displayName, logo: dexDetails.protocol.icon }]
            : []),
          { type: 'bridge', provider: bridgeDetails.protocol.displayName, logo: bridgeDetails.protocol.icon },
        ]
      }
    } catch {
      // A missing display envelope must not prevent viewing or executing the quote.
    }
  }

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
