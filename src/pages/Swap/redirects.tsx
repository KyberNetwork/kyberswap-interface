import { Redirect, RouteComponentProps } from 'react-router-dom'

import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'

// Redirects to swap but only replace the pathname
export function RedirectPathToSwapNetwork({ location }: RouteComponentProps) {
  const { chainId } = useActiveWeb3React()
  return <Redirect to={{ ...location, pathname: '/swap/' + NETWORKS_INFO[chainId].route }} />
}
