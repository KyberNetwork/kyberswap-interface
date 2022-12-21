import { Navigate, useLocation } from 'react-router-dom'

import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'

// Redirects to swap-v3 but only replace the pathname
export function RedirectPathToSwapV3Network() {
  const { networkInfo } = useActiveWeb3React()
  const location = useLocation()
  const { pathname } = location

  let redirectTo = [APP_PATHS.LIMIT, APP_PATHS.SWAP_V3, APP_PATHS.SWAP].find(path => pathname.startsWith(path))
  redirectTo ||= APP_PATHS.SWAP

  return (
    <Navigate
      to={{
        ...location,
        pathname: `${redirectTo}/` + networkInfo.route,
      }}
    />
  )
}
