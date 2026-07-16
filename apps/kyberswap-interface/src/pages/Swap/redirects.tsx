import { Navigate, useLocation } from 'react-router-dom'

import { APP_PATHS } from 'constants/index'
import { isSupportLimitOrder } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'

// Redirects to a network-specific trade page but only replaces the pathname
export const RedirectPathToTradeNetwork = () => {
  const { networkInfo, chainId } = useActiveWeb3React()
  const location = useLocation()
  const { pathname } = location

  let redirectTo = ''

  if (pathname.startsWith(APP_PATHS.LIMIT) && isSupportLimitOrder(chainId)) {
    redirectTo = APP_PATHS.LIMIT
  } else {
    redirectTo = APP_PATHS.SWAP
  }

  return (
    <Navigate
      to={{
        ...location,
        pathname: `${redirectTo}/${networkInfo.route}`,
      }}
      replace
    />
  )
}
