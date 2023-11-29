import ErrorBoundary from 'components/ErrorBoundary'
import { useKyberswapGlobalConfig } from 'hooks/useKyberSwapConfig'

import KNPools from './KN'
import SubgraphPools from './Subgraph'

const Pools = () => {
  const { isEnableOmniPool } = useKyberswapGlobalConfig()

  if (isEnableOmniPool) {
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
