import { Trans } from '@lingui/macro'
import { UnsupportedChainIdError } from '@web3-react/core'
import { X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import Modal from 'components/Modal'
import { useWeb3React } from 'hooks'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useNetworkModalToggle } from 'state/application/hooks'
import { TYPE } from 'theme'

import Networks from './Networks'

export const Wrapper = styled.div`
  width: 100%;
  padding: 32px 24px 24px;
`

export default function NetworkModal(): JSX.Element | null {
  const { error } = useWeb3React() //todo namgold: handle solana case
  const isWrongNetwork = error instanceof UnsupportedChainIdError
  const networkModalOpen = useModalOpen(ApplicationModal.NETWORK)
  const toggleNetworkModal = useNetworkModalToggle()

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
        <Networks onChangedNetwork={toggleNetworkModal} width={3} />
      </Wrapper>
    </Modal>
  )
}
