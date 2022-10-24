import { ChainId } from '@kyberswap/ks-sdk-core'

import { useActiveWeb3React } from 'hooks'

import useGetUserFarmingInfo from './useGetUserElasticFarmInfo'
import FarmUpdaterV1 from './v1'
import FarmUpdaterV2 from './v2'

export type CommonProps = {
  interval?: boolean
}

const FarmUpdater: React.FC<CommonProps> = props => {
  const { chainId } = useActiveWeb3React()

  useGetUserFarmingInfo(props.interval)

  if (chainId === ChainId.OPTIMISM) {
    return <FarmUpdaterV2 {...props} />
  } else {
    return <FarmUpdaterV1 {...props} />
  }
}

export default FarmUpdater
