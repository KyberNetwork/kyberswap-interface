import { useCallback } from 'react'

import { useActiveWeb3React } from 'hooks'
import { prefetchRoute } from 'utils/prefetch'

/**
 * Returns a callback that warms a destination route's lazy chunk + its data (RTK Query, where registered)
 * on user intent. Used by the shared internal-navigation components (StyledNavLink, NavigateButton) so a
 * hover/focus on any link to a registered route prefetches it — `account`/`chainId` are read once here.
 */
export default function usePrefetchRoute() {
  const { account, chainId } = useActiveWeb3React()
  return useCallback((toPath: string | undefined) => prefetchRoute(toPath, account, chainId), [account, chainId])
}
