import { WETH } from '@kyberswap/ks-sdk-core'
import { Navigate, useLocation, useParams } from 'react-router-dom'

import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO_CONFIG } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'

import ProAmmAddLiquidity from './index'

export function RedirectDuplicateTokenIds() {
  const { currencyIdA, currencyIdB, network } = useParams()
  const location = useLocation()

  const { chainId, networkInfo } = useActiveWeb3React()
  const chainRoute = networkInfo.route

  // prevent weth + eth
  const isETHOrWETHA = currencyIdA === 'ETH' || currencyIdA === WETH[chainId].address
  const isETHOrWETHB = currencyIdB === 'ETH' || currencyIdB === WETH[chainId].address

  if (!network) {
    return <Navigate to={`/${networkInfo.route}${location.pathname}`} replace />
  }

  const chainInfoFromParam = Object.values(NETWORKS_INFO_CONFIG).find(info => info.route === network)
  if (!chainInfoFromParam) {
    return <Navigate to={location.pathname.replace(network, networkInfo.route)} replace />
  }

  if (
    currencyIdA &&
    currencyIdB &&
    (currencyIdA.toLowerCase() === currencyIdB.toLowerCase() || (isETHOrWETHA && isETHOrWETHB))
  ) {
    return <Navigate to={`/${chainRoute}${APP_PATHS.ELASTIC_CREATE_POOL}/${currencyIdA}`} replace />
  }

  return <ProAmmAddLiquidity />
}
