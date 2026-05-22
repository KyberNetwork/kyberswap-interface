import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { forwardRef, useImperativeHandle, useState } from 'react'

import { ReactComponent as DropdownSvg } from 'assets/svg/down.svg'
import NetworkModal from 'components/Header/web3/NetworkModal'
import { NetworkLogo } from 'components/Logo'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { Chain, NonEvmChain, NonEvmChainInfo } from 'pages/CrossChainSwap/adapters'
import { isEvmChain } from 'utils'

const SelectNetwork = forwardRef<
  {
    toggleNetworkModal: () => void
  },
  {
    chainIds: Chain[]
    onSelectNetwork: (chain: Chain) => void
    selectedChainId?: Chain
    tooltipNotSupportChain?: string
  }
>(({ chainIds = [], onSelectNetwork, selectedChainId, tooltipNotSupportChain }, ref) => {
  const { chainId } = useActiveWeb3React()

  const [isOpen, setIsOpen] = useState(false)
  const toggleNetworkModal = () => {
    setIsOpen(!isOpen)
  }

  useImperativeHandle(ref, () => ({
    toggleNetworkModal,
  }))

  if (!chainId) return null
  const { name } = !selectedChainId
    ? { name: t`Select a network` }
    : isEvmChain(selectedChainId)
    ? NETWORKS_INFO[selectedChainId as ChainId]
    : NonEvmChainInfo[selectedChainId as NonEvmChain]

  return (
    <>
      <div
        data-testid="network-button"
        onClick={() => chainIds.length && toggleNetworkModal()}
        className="flex h-fit items-center justify-between rounded-3xl p-0 text-text hover:cursor-pointer"
      >
        {selectedChainId && (
          <NetworkLogo
            chainId={selectedChainId}
            style={{ width: 20, height: 20, marginRight: '8px', borderRadius: '4px' }}
          />
        )}
        <span className="whitespace-nowrap text-sm font-medium">{name}</span>
        <DropdownSvg className={`text-text transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
      </div>
      <NetworkModal
        disabledMsg={tooltipNotSupportChain || t`The token cannot be bridged to this chain`}
        activeChainIds={chainIds}
        isOpen={isOpen}
        selectedId={selectedChainId}
        customToggleModal={toggleNetworkModal}
        customOnSelectNetwork={onSelectNetwork}
      />
    </>
  )
})
SelectNetwork.displayName = 'SelectNetwork'

export default SelectNetwork
