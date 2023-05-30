import { lighten } from 'polished'
import styled, { css } from 'styled-components'

import { ReactComponent as DropdownSvg } from 'assets/svg/down.svg'
import Card from 'components/Card'
import NetworkModal from 'components/Header/web3/NetworkModal'
import Row from 'components/Row'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import { useActiveWeb3React } from 'hooks'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useNetworkModalToggle } from 'state/application/hooks'
import { useIsDarkMode } from 'state/user/hooks'

const NetworkSwitchContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  min-width: fit-content;
`

const NetworkCard = styled(Card)<{ disabled?: boolean }>`
  position: relative;
  background-color: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  border-radius: 999px;
  padding: 8px 12px;
  border: 1px solid transparent;
  width: fit-content;

  &:hover {
    text-decoration: none;
    border: 1px solid ${({ theme }) => theme.primary};
    cursor: pointer;
    background-color: ${({ theme }) => lighten(0.05, theme.background)};
  }
  ${({ disabled }) =>
    disabled &&
    css`
      cursor: none;
      opacity: 0.5;
      pointer-events: none;
    `}
  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin: 0;
    width: initial;
    text-overflow: ellipsis;
    flex-shrink: 1;
    min-width: auto;
  `};
`

const DropdownIcon = styled(DropdownSvg)<{ open: boolean }>`
  color: ${({ theme }) => theme.text};
  transform: rotate(${({ open }) => (open ? '180deg' : '0')});
  transition: transform 300ms;
  min-width: 24px;
`

function SelectNetwork({ disabled }: { disabled?: boolean }): JSX.Element | null {
  const { chainId, networkInfo } = useActiveWeb3React()
  const networkModalOpen = useModalOpen(ApplicationModal.NETWORK)
  const isDarkMode = useIsDarkMode()
  const toggleNetworkModal = useNetworkModalToggle()

  return (
    <NetworkCard onClick={() => toggleNetworkModal()} role="button" id={TutorialIds.SELECT_NETWORK} disabled={disabled}>
      <NetworkSwitchContainer>
        <Row gap="10px">
          <img
            src={(isDarkMode && networkInfo.iconDark) || networkInfo.icon}
            alt={networkInfo.name + ' logo'}
            style={{ width: 20, height: 20 }}
          />
        </Row>
        <DropdownIcon open={networkModalOpen} />
      </NetworkSwitchContainer>
      <NetworkModal selectedId={chainId} />
    </NetworkCard>
  )
}

export default SelectNetwork
