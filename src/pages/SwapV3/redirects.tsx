import { Navigate, useLocation } from 'react-router-dom'

import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { getLimitOrderContract } from 'utils'

// Redirects to swap-v3 but only replace the pathname
export function RedirectPathToSwapV3Network() {
  const { networkInfo, chainId } = useActiveWeb3React()
  const location = useLocation()
  const { pathname } = location

  let redirectTo = ''

  if (pathname.startsWith(APP_PATHS.LIMIT) && getLimitOrderContract(chainId)) {
    redirectTo = APP_PATHS.LIMIT
  } else if (pathname.startsWith(APP_PATHS.SWAP_V3)) {
    redirectTo = APP_PATHS.SWAP_V3
  } else {
    redirectTo = APP_PATHS.SWAP
  }

  return (
    <Navigate
      to={{
        ...location,
        pathname: `${redirectTo}/` + networkInfo.route,
      }}
    />
  )
}
