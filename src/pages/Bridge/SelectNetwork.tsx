import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useState } from 'react'
import styled from 'styled-components'

import { ReactComponent as DropdownSvg } from 'assets/svg/down.svg'
import Card from 'components/Card'
import { NetworkLogo } from 'components/Logo'
import NetworkModal from 'components/NetworkModal'
import Row from 'components/Row'
import { useActiveWeb3React } from 'hooks'

import { NETWORKS_INFO } from '../../constants/networks'

const NetworkSwitchContainer = styled.div`
  display: flex;
  align-items: center;
`

const NetworkCard = styled(Card)`
  position: relative;
  color: ${({ theme }) => theme.text};
  padding: 8px 0;
  border: 1px solid transparent;

  &:hover {
    text-decoration: none;
    cursor: pointer;
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin: 0;
    margin-right: 0.5rem;
    width: initial;
    text-overflow: ellipsis;
    flex-shrink: 1;
    min-width: auto;
  `};
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
    <NetworkCard>
      <NetworkSwitchContainer onClick={() => chainIds.length && toggleNetworkModal()}>
        <Row>
          <NetworkLogo chainId={selectedChainId} style={{ width: 20, height: 20, marginRight: '8px' }} />
          <NetworkLabel>{name}</NetworkLabel>
          <DropdownIcon open={isOpen} />
        </Row>
      </NetworkSwitchContainer>
      <NetworkModal
        chainIds={chainIds}
        isOpen={isOpen}
        selectedId={selectedChainId}
        customToggleModal={toggleNetworkModal}
        customOnSelectNetwork={onSelectNetwork}
      />
    </NetworkCard>
  )
}

export default Web3Network
