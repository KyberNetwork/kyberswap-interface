import { useKyberSwapConfig } from 'state/application/hooks'

import useGetUserFarmingInfo from './useGetUserElasticFarmInfo'
import FarmUpdaterV1 from './v1'
import FarmUpdaterV2 from './v2'

export type CommonProps = {
  interval?: boolean
}

const FarmUpdater: React.FC<CommonProps> = ({ interval = true }) => {
  const { isEnableKNProtocol } = useKyberSwapConfig()

  useGetUserFarmingInfo()

  if (isEnableKNProtocol) {
    return <FarmUpdaterV2 interval={interval} />
  } else {
    return <FarmUpdaterV1 interval={interval} />
  }
}

export default FarmUpdater
