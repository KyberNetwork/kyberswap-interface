import { Navigate, useLocation } from 'react-router-dom'

import { APP_PATHS, SUPPORT_LIMIT_ORDER } from 'constants/index'
import { useActiveWeb3React } from 'hooks'

// Redirects to swap but only replace the pathname
export function RedirectPathToSwapNetwork() {
  const { networkInfo } = useActiveWeb3React()
  const { pathname, ...rest } = useLocation()
  return (
    <Navigate
      to={{
        ...rest,
        pathname: `${pathname.startsWith(APP_PATHS.LIMIT) && SUPPORT_LIMIT_ORDER ? APP_PATHS.LIMIT : APP_PATHS.SWAP}/${
          networkInfo.route
        }`,
      }}
    />
  )
}
