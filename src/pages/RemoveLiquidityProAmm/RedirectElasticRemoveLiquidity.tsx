import { Navigate, useLocation, useParams } from 'react-router-dom'

import { useActiveWeb3React } from 'hooks'
import { useSyncNetworkParamWithStore } from 'hooks/useSyncNetworkParamWithStore'

import ElasticRemoveLiquidity from './index'

export default function RedirectElasticRemoveLiquidity() {
  const { network } = useParams()
  const location = useLocation()
  const { networkInfo } = useActiveWeb3React()

  useSyncNetworkParamWithStore()

  if (!network) {
    return (
      <Navigate
        to={{
          ...location,
          pathname: `/${networkInfo.route}${location.pathname}`,
        }}
        replace
      />
    )
  }

  return <ElasticRemoveLiquidity />
}
