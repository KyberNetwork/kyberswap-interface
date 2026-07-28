import { generatePath } from 'react-router-dom'

import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO, isSupportedChainId } from 'constants/networks'

/**
 * Build the canonical path-based pool-detail URL: `/pools/<chain-slug>/<protocol>/<address>`.
 *
 * - `chainId` -> the human network slug (NETWORKS_INFO[chainId].route), consistent with /swap URLs.
 * - `exchange` -> the protocol slug (the `Exchange` enum value, e.g. 'uniswapv3', 'kodiakcl').
 * - `poolAddress` -> lowercased for a stable canonical form.
 *
 * Falls back to the pools explorer for missing/unsupported inputs. NOTE: validate via
 * `isSupportedChainId` (not `NETWORKS_INFO[id]?.route`) — NETWORKS_INFO is a Proxy that falls back to
 * MAINNET for unknown ids, so the `?.route` would never be undefined and an unsupported chain would
 * silently emit a wrong `/pools/ethereum/...` link.
 */
export const getPoolDetailUrl = (chainId: number | undefined, exchange: string, poolAddress: string): string => {
  if (!chainId || !exchange || !poolAddress || !isSupportedChainId(chainId)) return APP_PATHS.EARN_POOLS
  const chain = NETWORKS_INFO[chainId].route
  return generatePath(APP_PATHS.POOL_DETAIL, { chain, protocol: exchange, address: poolAddress.toLowerCase() })
}
