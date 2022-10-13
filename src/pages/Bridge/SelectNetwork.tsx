import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useState } from 'react'
import { Flex } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DropdownSvg } from 'assets/svg/down.svg'
import { NetworkLogo } from 'components/Logo'
import NetworkModal from 'components/NetworkModal'
import { useActiveWeb3React } from 'hooks'

import { NETWORKS_INFO } from '../../constants/networks'

const NetworkSwitchContainer = styled.div`
  display: flex;
  align-items: center;
  border-radius: 24px;
  height: fit-content;
  justify-content: space-between;
  width: 100%;
  color: ${({ theme }) => theme.text};
  background-color: ${({ theme }) => theme.tabBackgound};
  padding: 12px;
  &:hover {
    text-decoration: none;
    cursor: pointer;
  }
`

const NetworkLabel = styled.div`
  white-space: nowrap;
  font-weight: 500;
  margin-right: 8px;
`

const DropdownIcon = styled(DropdownSvg)<{ open: boolean }>`
  color: ${({ theme }) => theme.text};
  transform: rotate(${({ open }) => (open ? '180deg' : '0')});
  transition: transform 300ms;
`
function Web3Network({
  chainIds = [],
  onSelectNetwork,
  selectedChainId,
}: {
  chainIds: ChainId[]
  onSelectNetwork: (chain: ChainId) => void
  selectedChainId?: ChainId
}): JSX.Element | null {
  const { chainId } = useActiveWeb3React()

  const [isOpen, setIsOpen] = useState(false)
  const toggleNetworkModal = () => {
    setIsOpen(!isOpen)
  }

  if (!chainId) return null
  const { name } = selectedChainId ? NETWORKS_INFO[selectedChainId] : { name: t`Select a network` }
  return (
    <>
      <NetworkSwitchContainer onClick={() => chainIds.length && toggleNetworkModal()}>
        <Flex>
          <NetworkLogo chainId={selectedChainId} style={{ width: 20, height: 20, marginRight: '8px' }} />
          <NetworkLabel>{name}</NetworkLabel>
        </Flex>
        <DropdownIcon open={isOpen} />
      </NetworkSwitchContainer>
      <NetworkModal
        activeChainIds={chainIds}
        isOpen={isOpen}
        selectedId={selectedChainId}
        customToggleModal={toggleNetworkModal}
        customOnSelectNetwork={onSelectNetwork}
      />
    </>
  )
}

export default Web3Network
