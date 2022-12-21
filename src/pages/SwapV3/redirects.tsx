import { Navigate, useLocation } from 'react-router-dom'

import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'

// Redirects to swap-v3 but only replace the pathname
export function RedirectPathToSwapV3Network() {
  const { networkInfo } = useActiveWeb3React()
  const location = useLocation()
  const { pathname } = location
  return (
    <Navigate
      to={{
        ...location,
        pathname: `${pathname.startsWith(APP_PATHS.LIMIT) ? APP_PATHS.LIMIT : APP_PATHS.SWAP_V3}/` + networkInfo.route,
      }}
    />
  )
}
