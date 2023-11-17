import ErrorBoundary from 'components/ErrorBoundary'
import { useKyberSwapConfig } from 'state/application/hooks'

import KNPools from './KN'
import SubgraphPools from './Subgraph'

const Pools = () => {
  const { isEnableKNProtocol } = useKyberSwapConfig()
  if (isEnableKNProtocol) {
    return (
      <ErrorBoundary>
        <KNPools />
      </ErrorBoundary>
    )
  }
  return (
    <ErrorBoundary>
      <SubgraphPools />
    </ErrorBoundary>
  )
}

export default Pools
