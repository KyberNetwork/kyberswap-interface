import { ChainId } from '@kyberswap/ks-sdk-core'

import { TokenSelectorChain, TokenSelectorNetwork } from 'components/TokenSelectorModal/types'
import { NETWORKS_INFO } from 'constants/networks'
import { NonEvmChain, NonEvmChainInfo } from 'types/crossChain'

const ALL_NETWORK_ICONS = [
  NETWORKS_INFO[ChainId.MAINNET].icon,
  NonEvmChainInfo[NonEvmChain.Bitcoin].icon,
  NETWORKS_INFO[ChainId.BSCMAINNET].icon,
  NETWORKS_INFO[ChainId.BASE].icon,
]

export const NetworkIcon = ({ chainId, icon }: { chainId: TokenSelectorChain; icon?: TokenSelectorNetwork['icon'] }) =>
  chainId === 'all' ? (
    <span className="grid size-5 shrink-0 grid-cols-2 grid-rows-2 gap-px" aria-hidden="true">
      {ALL_NETWORK_ICONS.map(src => (
        <img key={src} src={src} alt="" className="size-full rounded-full" />
      ))}
    </span>
  ) : (
    <img src={icon} alt="" className="size-5 shrink-0 rounded-full" />
  )
