import { ChainId, CurrencyAmount } from '@namgold/ks-sdk-core'
import { useMemo } from 'react'
import styled from 'styled-components'

import { ReactComponent as DropdownSvg } from 'assets/svg/down.svg'
import Card from 'components/Card'
import NetworkModal from 'components/Header/web3/NetworkModal'
import Row from 'components/Row'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import { NETWORKS_INFO } from 'constants/networks'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useNetworkModalToggle } from 'state/application/hooks'
import { useIsDarkMode } from 'state/user/hooks'
import { useNativeBalances } from 'state/wallet/hooks'

const NetworkSwitchContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  min-width: fit-content;
`

const NetworkCard = styled(Card)`
  position: relative;
  background-color: ${({ theme }) => theme.buttonBlack};
  color: ${({ theme }) => theme.text};
  border-radius: 999px;
  padding: 8px 12px;
  border: 1px solid transparent;
  min-width: fit-content;

  &:hover {
    text-decoration: none;
    border: 1px solid ${({ theme }) => theme.primary};
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

  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `};
`

const DropdownIcon = styled(DropdownSvg)<{ open: boolean }>`
  color: ${({ theme }) => theme.text};
  transform: rotate(${({ open }) => (open ? '180deg' : '0')});
  transition: transform 300ms;
`

function SelectNetwork(): JSX.Element | null {
  const { chainId, account } = useActiveWeb3React()
  const networkModalOpen = useModalOpen(ApplicationModal.NETWORK)
  const isDarkMode = useIsDarkMode()
  const toggleNetworkModal = useNetworkModalToggle()
  const accounts = useMemo(() => (account ? [account] : []), [account])
  const userEthBalance = useNativeBalances(accounts)?.[account ?? '']
  const labelContent = useMemo(() => {
    return userEthBalance
      ? `${
          userEthBalance?.lessThan(CurrencyAmount.fromRawAmount(NativeCurrencies[chainId], (1e18).toString())) &&
          userEthBalance?.greaterThan(0)
            ? parseFloat(userEthBalance.toSignificant(4)).toFixed(4)
            : userEthBalance.toSignificant(4)
        } ${NativeCurrencies[chainId || ChainId.MAINNET].symbol}`
      : NETWORKS_INFO[chainId].name
  }, [userEthBalance, chainId])

  return (
    <NetworkCard onClick={() => toggleNetworkModal()} role="button" id={TutorialIds.SELECT_NETWORK}>
      <NetworkSwitchContainer>
        <Row>
          <img
            src={
              isDarkMode && NETWORKS_INFO[chainId].iconDark
                ? NETWORKS_INFO[chainId].iconDark
                : NETWORKS_INFO[chainId].icon
            }
            alt={NETWORKS_INFO[chainId].name + ' logo'}
            style={{ width: 20, height: 20, marginRight: '12px' }}
          />
          <NetworkLabel>{labelContent}</NetworkLabel>
        </Row>
        <DropdownIcon open={networkModalOpen} />
      </NetworkSwitchContainer>
      <NetworkModal />
    </NetworkCard>
  )
}

export default SelectNetwork
