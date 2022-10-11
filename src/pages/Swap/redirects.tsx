import { Redirect, RouteComponentProps } from 'react-router-dom'

import { useActiveWeb3React } from 'hooks'

// Redirects to swap but only replace the pathname
export function RedirectPathToSwapNetwork({ location }: RouteComponentProps) {
  const { networkInfo } = useActiveWeb3React()
  return <Redirect to={{ ...location, pathname: '/swap/' + networkInfo.route }} />
}
