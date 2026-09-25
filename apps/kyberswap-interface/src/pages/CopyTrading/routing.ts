import type { Chain } from 'services/copyTrading/types/agents'

import { APP_PATHS } from 'constants/index'

export const getCopyTradingPath = (chain: string | number, path = '') =>
  `${APP_PATHS.COPY_TRADING}/${encodeURIComponent(chain)}${path ? '/' + path : ''}`

// Resolve only against the shared catalog. Refetches must not reset a URL-selected chain.
export const resolveCopyTradingRoute = (pathname: string, chains: Chain[]) => {
  const [segment, ...rest] = pathname.slice(APP_PATHS.COPY_TRADING.length).split('/').filter(Boolean)
  const defaultChain = chains.find(chain => chain.isEnabled)
  if (!segment || segment === 'my-copies' || segment === 'history') {
    return {
      redirect: defaultChain
        ? getCopyTradingPath(defaultChain.slug, [segment, ...rest].filter(Boolean).join('/'))
        : undefined,
    }
  }
  const chain = chains.find(chain => chain.slug === segment || String(chain.chainId) === segment)
  // A single unrecognized segment is a legacy /copy-trading/:agentCode link.
  // Agent Profile subsequently canonicalizes it to the agent's actual chain.
  if (!chain)
    return {
      redirect: !rest.length && defaultChain ? getCopyTradingPath(defaultChain.slug, segment) : undefined,
    }
  return {
    chain,
    redirect: segment !== chain.slug ? getCopyTradingPath(chain.slug, rest.join('/')) : undefined,
  }
}
