import { useKyberSwapConfig } from 'state/application/hooks'

import KNPools from './KN'
import SubgraphPools from './Subgraph'

const Pools = () => {
  const { isEnableKNProtocol } = useKyberSwapConfig()

  if (isEnableKNProtocol) {
    return <KNPools />
  }
  return <SubgraphPools />
}

export default Pools
