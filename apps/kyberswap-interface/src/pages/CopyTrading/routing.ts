import type { Chain } from 'services/copyTrading/types/agents'

import { APP_PATHS } from 'constants/index'

export const getCopyTradingPath = (chain: string | number, path = '') => {
  const isList = !path || path === 'my-copies' || path === 'history'
  return isList
    ? `${APP_PATHS.COPY_TRADING}/${encodeURIComponent(chain)}${path ? '/' + path : ''}`
    : `${APP_PATHS.COPY_TRADING}/${path}`
}

// Chain selection belongs to list pages; detail identity comes from the entity ID.
export const resolveCopyTradingRoute = (pathname: string, chains: Chain[]) => {
  const [segment, ...rest] = pathname.slice(APP_PATHS.COPY_TRADING.length).split('/').filter(Boolean)
  if (!segment) return { allChains: true }
  if (segment === 'my-copies' || segment === 'history') {
    return rest.length === 1
      ? { isDetail: true }
      : { redirect: !rest.length ? getCopyTradingPath('all', segment) : undefined }
  }

  const chain = chains.find(chain => chain.slug === segment || String(chain.chainId) === segment)
  if (segment === 'all' || chain) {
    const path = rest.join('/')
    const isList = !path || path === 'my-copies' || path === 'history'
    if (!isList) return { redirect: getCopyTradingPath(segment, path) }
    if (segment === 'all') return { allChains: true }
    if (chain) return { chain, redirect: segment !== chain.slug ? getCopyTradingPath(chain.slug, path) : undefined }
  }

  return { isDetail: rest.length === 0 }
}
