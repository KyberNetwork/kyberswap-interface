import { Redirect, RouteComponentProps, useLocation } from 'react-router-dom'

import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'

// Redirects to swap but only replace the pathname
export function RedirectPathToSwapNetwork({ location }: RouteComponentProps) {
  const { networkInfo } = useActiveWeb3React()
  const { pathname } = useLocation()
  return (
    <Redirect
      to={{
        ...location,
        pathname: `${pathname.startsWith(APP_PATHS.SWAP) ? APP_PATHS.SWAP : APP_PATHS.LIMIT}/` + networkInfo.route,
      }}
    />
  )
}
