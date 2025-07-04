import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { forwardRef, useImperativeHandle, useState } from 'react'
import styled from 'styled-components'

import { ReactComponent as DropdownSvg } from 'assets/svg/down.svg'
import NetworkModal from 'components/Header/web3/NetworkModal'
import { NetworkLogo } from 'components/Logo'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { Chain, NonEvmChain, NonEvmChainInfo } from 'pages/CrossChainSwap/adapters'
import { isEvmChain } from 'utils'

const NetworkSwitchContainer = styled.div`
  display: flex;
  align-items: center;
  border-radius: 24px;
  height: fit-content;
  justify-content: space-between;
  align-items: center;
  color: ${({ theme }) => theme.text};
  padding: 0px;
  &:hover {
    cursor: pointer;
  }
`

const NetworkLabel = styled.div`
  white-space: nowrap;
  font-weight: 500;
  font-size: 14px;
`

const DropdownIcon = styled(DropdownSvg)<{ open: boolean }>`
  color: ${({ theme }) => theme.text};
  transform: rotate(${({ open }) => (open ? '180deg' : '0')});
  transition: transform 300ms;
`
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
      <NetworkSwitchContainer data-testid="network-button" onClick={() => chainIds.length && toggleNetworkModal()}>
        {selectedChainId && (
          <NetworkLogo
            chainId={selectedChainId}
            style={{ width: 20, height: 20, marginRight: '8px', borderRadius: '4px' }}
          />
        )}
        <NetworkLabel>{name}</NetworkLabel>
        <DropdownIcon open={isOpen} />
      </NetworkSwitchContainer>
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
