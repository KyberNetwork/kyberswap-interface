import { Trans } from '@lingui/macro'
import { ChainId } from '@namgold/ks-sdk-core'
import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core'
import { stringify } from 'qs'
import { X } from 'react-feather'
import { useHistory } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonEmpty } from 'components/Button'
import Modal from 'components/Modal'
import { MAINNET_NETWORKS, NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/useChangeNetwork'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useNetworkModalToggle } from 'state/application/hooks'
import { useIsDarkMode } from 'state/user/hooks'
import { TYPE } from 'theme'

export const Wrapper = styled.div`
  width: 100%;
  padding: 20px;
`

export const NetworkList = styled.div`
  display: grid;
  grid-gap: 1.25rem;
  grid-template-columns: 1fr 1fr 1fr;
  width: 100%;
  margin-top: 20px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 1fr 1fr;
  `}
`

export const NetworkLabel = styled.span`
  color: ${({ theme }) => theme.text13};
`

export const ListItem = styled.div<{ selected?: boolean }>`
  width: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 10px 12px;
  border-radius: 999px;
  ${({ theme, selected }) =>
    selected
      ? `
        background-color: ${theme.primary};
        & ${NetworkLabel} {
          color: ${theme.background};
        }
      `
      : `
        background-color : ${theme.buttonBlack};
      `}
`

export const SelectNetworkButton = styled(ButtonEmpty)`
  background-color: transparent;
  color: ${({ theme }) => theme.primary};
  display: flex;
  justify-content: center;
  align-items: center;
  &:focus {
    text-decoration: none;
  }
  &:hover {
    text-decoration: none;
    border: 1px solid ${({ theme }) => theme.primary};
  }
  &:active {
    text-decoration: none;
  }
  &:disabled {
    opacity: 50%;
    cursor: not-allowed;
  }
`
export default function NetworkModal(): JSX.Element | null {
  const { chainId } = useActiveWeb3React()
  const { error } = useWeb3React()
  const isWrongNetwork = error instanceof UnsupportedChainIdError
  const networkModalOpen = useModalOpen(ApplicationModal.NETWORK)
  const toggleNetworkModal = useNetworkModalToggle()
  const changeNetwork = useChangeNetwork()
  const isDarkMode = useIsDarkMode()
  const history = useHistory()
  const qs = useParsedQueryString()

  return (
    <Modal isOpen={networkModalOpen} onDismiss={toggleNetworkModal} maxWidth={624}>
      <Wrapper>
        <Flex alignItems="center" justifyContent="space-between">
          <Text fontWeight="500" fontSize={20}>
            {isWrongNetwork ? <Trans>Wrong Network</Trans> : <Trans>Select a Network</Trans>}
          </Text>

          <Flex sx={{ cursor: 'pointer' }} role="button" onClick={toggleNetworkModal}>
            <X />
          </Flex>
        </Flex>
        {isWrongNetwork && (
          <TYPE.main fontSize={16} marginTop={14}>
            <Trans>Please connect to the appropriate network.</Trans>
          </TYPE.main>
        )}
        <NetworkList>
          {MAINNET_NETWORKS.map((key: ChainId, i: number) => {
            if (chainId === key) {
              return (
                <SelectNetworkButton key={i} padding="0">
                  <ListItem selected>
                    <img
                      src={
                        isDarkMode && !!NETWORKS_INFO[key].iconDark
                          ? NETWORKS_INFO[key].iconDark
                          : NETWORKS_INFO[key].icon
                      }
                      alt="Switch Network"
                      style={{ width: '24px', marginRight: '8px' }}
                    />
                    <NetworkLabel>{NETWORKS_INFO[key].name}</NetworkLabel>
                  </ListItem>
                </SelectNetworkButton>
              )
            }

            return (
              <SelectNetworkButton
                key={i}
                padding="0"
                onClick={() => {
                  toggleNetworkModal()
                  changeNetwork(key, () => {
                    const { networkId, inputCurrency, outputCurrency, ...rest } = qs
                    history.replace({
                      search: stringify(rest),
                    })
                  })
                }}
              >
                <ListItem>
                  <img
                    src={
                      isDarkMode && !!NETWORKS_INFO[key].iconDark
                        ? NETWORKS_INFO[key].iconDark
                        : NETWORKS_INFO[key].icon
                    }
                    alt="Switch Network"
                    style={{ width: '24px', marginRight: '8px' }}
                  />
                  <NetworkLabel>{NETWORKS_INFO[key].name}</NetworkLabel>
                </ListItem>
              </SelectNetworkButton>
            )
          })}
        </NetworkList>
      </Wrapper>
    </Modal>
  )
}
