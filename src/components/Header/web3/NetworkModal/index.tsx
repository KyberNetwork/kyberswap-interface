import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { X } from 'react-feather'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ButtonAction } from 'components/Button'
import Column from 'components/Column'
import Modal from 'components/Modal'
import Row, { RowBetween } from 'components/Row'
import { Z_INDEXS } from 'constants/styles'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useNetworkModalToggle } from 'state/application/hooks'
import { TYPE } from 'theme'

import Networks from './Networks'

const Wrapper = styled.div`
  width: 100%;
  padding: 20px;
`

export default function NetworkModal({
  activeChainIds,
  selectedId,
  customOnSelectNetwork,
  isOpen,
  customToggleModal,
  disabledMsg,
}: {
  activeChainIds?: ChainId[]
  selectedId?: ChainId
  isOpen?: boolean
  customOnSelectNetwork?: (chainId: ChainId) => void
  customToggleModal?: () => void
  disabledMsg?: string
}): JSX.Element | null {
  const theme = useTheme()
  const { isWrongNetwork } = useActiveWeb3React()
  const networkModalOpen = useModalOpen(ApplicationModal.NETWORK)
  const toggleNetworkModalGlobal = useNetworkModalToggle()
  const toggleNetworkModal = customToggleModal || toggleNetworkModalGlobal
  return (
    <Modal
      isOpen={isOpen !== undefined ? isOpen : networkModalOpen}
      onDismiss={toggleNetworkModal}
      maxWidth={624}
      zindex={Z_INDEXS.MODAL}
    >
      <Wrapper>
        <RowBetween>
          <Text fontWeight="500" fontSize={20}>
            {isWrongNetwork ? <Trans>Wrong Chain</Trans> : <Trans>Select a Chain</Trans>}
          </Text>
          <ButtonAction onClick={toggleNetworkModal}>
            <X />
          </ButtonAction>
        </RowBetween>
        <Column marginTop="16px" gap="8px">
          <Row gap="12px">
            <Text fontSize="10px" lineHeight="24px" color={theme.subText} flexShrink={0}>
              <Trans>Favorite Chain(s)</Trans>
            </Text>
            <hr style={{ border: '0 0 1px 0', borderColor: theme.border, width: '100%' }} />
          </Row>
          <Row border={'1px dashed ' + theme.text + '32'} borderRadius="99px" padding="8px 12px" justify="center">
            <Text fontSize="10px" lineHeight="14px" color={theme.subText}>
              <Trans>Drag your favourite chain(s) here</Trans>
            </Text>
          </Row>
          <Row gap="12px">
            <Text fontSize="10px" lineHeight="24px" color={theme.subText} flexShrink={0}>
              <Trans>Chain List</Trans>
            </Text>
            <hr style={{ border: '0 0 1px 0', borderColor: theme.border, width: '100%' }} />
          </Row>
          {isWrongNetwork && (
            <TYPE.main fontSize={16} marginTop={14}>
              <Trans>Please connect to the appropriate chain.</Trans>
            </TYPE.main>
          )}
          <Networks
            onChangedNetwork={toggleNetworkModal}
            selectedId={selectedId}
            activeChainIds={activeChainIds}
            customOnSelectNetwork={customOnSelectNetwork}
            customToggleModal={customToggleModal}
            disabledMsg={disabledMsg}
          />
        </Column>
      </Wrapper>
    </Modal>
  )
}
