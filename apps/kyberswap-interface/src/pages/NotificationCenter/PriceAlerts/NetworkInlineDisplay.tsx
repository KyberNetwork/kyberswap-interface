import { ChainId } from '@kyberswap/ks-sdk-core'

import { NetworkLogo } from 'components/Logo'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'

type Props = {
  chainId: ChainId
}
const NetworkInlineDisplay: React.FC<Props> = ({ chainId }) => {
  const { name } = NETWORKS_INFO[chainId]

  return (
    <span className="inline-flex items-center">
      <NetworkLogo chainId={chainId} style={{ width: 16, height: 16, marginRight: '4px' }} />
      <span className="whitespace-nowrap text-sm font-medium text-text">{name}</span>
    </span>
  )
}
export default NetworkInlineDisplay
