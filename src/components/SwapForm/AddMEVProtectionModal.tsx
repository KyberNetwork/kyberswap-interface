import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { darken } from 'polished'
import { useCallback, useState } from 'react'
import { X } from 'react-feather'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import FlashBot from 'assets/images/flashbot.png'
import MEVBlocker from 'assets/images/mevblocker.png'
import { NotificationType } from 'components/Announcement/type'
import { ButtonEmpty, ButtonOutlined, ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import Row, { RowBetween } from 'components/Row'
import { Z_INDEXS } from 'constants/styles'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { useNotify } from 'state/application/hooks'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'
import { friendlyError } from 'utils/errorMessage'

const Wrapper = styled.div`
  padding: 20px;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.tableHeader};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  width: 100%;
  .time-frame-legend {
    display: none;
  }
`
const RPCOption = styled(ButtonEmpty)<{ selected: boolean }>`
  color: ${({ theme }) => theme.primary};
  background-color: ${({ theme }) => theme.tableHeader};
  display: flex;
  justify-content: start;
  align-items: center;
  height: 36px;
  text-decoration: none;
  gap: 4px;
  transition: all 0.1s ease;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  padding: 8px;

  & img {
    width: 24px;
  }
  &:hover {
    background-color: ${({ theme }) => darken(0.1, theme.buttonBlack)};
    color: ${({ theme }) => theme.text} !important;
  }
  ${({ theme, selected }) =>
    selected &&
    css`
      background-color: ${theme.buttonBlack};
      & > div {
        color: ${theme.text};
      }
    `}
`

const rpcOptions: {
  name: string
  logo: string
  rpc: string
}[] = [
  {
    name: 'Flashbots',
    logo: FlashBot,
    rpc: 'https://rpc.flashbots.net',
  },
  {
    name: 'MEVBlocker',
    logo: MEVBlocker,
    rpc: 'https://rpc.mevblocker.io',
  },
]

export default function AddMEVProtectionModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)
  const [selectedRpc, setSelectedRpc] = useState(rpcOptions[0].name)
  const { addNewNetwork } = useChangeNetwork()
  const selectedOption = rpcOptions.find(option => option.name === selectedRpc)
  const notify = useNotify()
  const { mixpanelHandler } = useMixpanel()

  const onAdd = useCallback(() => {
    if (!selectedOption) return
    const addingOption = selectedOption
    mixpanelHandler(MIXPANEL_TYPE.MEV_ADD_CLICK_MODAL, { type: addingOption.name })
    const name = addingOption.name
    addNewNetwork(
      ChainId.MAINNET,
      addingOption.rpc,
      {
        name,
        title: t`Failed to switch to ${name} RPC Endpoint`,
        rejected: t`In order to enable MEV Protection with ${name}, you must change the RPC endpoint in your wallet`,
      },
      () => {
        notify({
          title: t`MEV Protection Mode is on`,
          type: NotificationType.SUCCESS,
          summary: t`You have successfully turned on MEV Protection Mode. All transactions on Ethereum will go through the custom RPC endpoint unless you change it`,
        })
        onClose?.()
        mixpanelHandler(MIXPANEL_TYPE.MEV_ADD_RESULT, { type: addingOption.name, result: 'success' })
      },
      (error: Error) => {
        const message = friendlyError(error)
        mixpanelHandler(MIXPANEL_TYPE.MEV_ADD_RESULT, { type: addingOption.name, result: 'fail', reason: message })
      },
    )
  }, [addNewNetwork, notify, onClose, selectedOption, mixpanelHandler])

  return (
    <Modal
      isOpen={isOpen}
      width="fit-content"
      maxWidth="600px"
      maxHeight="80vh"
      onDismiss={onClose}
      zindex={Z_INDEXS.POPOVER_CONTAINER + 1}
    >
      <Wrapper>
        <RowBetween align="start">
          <Text fontSize={24} fontWeight={500}>
            <Trans>Add Custom RPC Endpoint</Trans>
          </Text>
          <X style={{ cursor: 'pointer' }} onClick={onClose} />
        </RowBetween>
        <Row gap="12px">
          <Text fontSize={12} lineHeight="16px">
            <Trans>
              <ExternalLink href="https://docs.kyberswap.com/getting-started/foundational-topics/decentralized-finance/maximal-extractable-value-mev">
                MEV
              </ExternalLink>{' '}
              Protection safeguards you from front-running attacks on Ethereum. We suggest you employing the{' '}
              <ExternalLink href="https://docs.kyberswap.com/getting-started/foundational-topics/decentralized-technologies/rpc">
                RPC endpoint
              </ExternalLink>{' '}
              of reliable third-parties such as{' '}
              <ExternalLink href="https://docs.flashbots.net/flashbots-protect/overview">Flashbots</ExternalLink> or{' '}
              <ExternalLink href="https://mevblocker.io/#faq">MEVBlocker</ExternalLink>.
              <br />
              <br />
              Note that adding the RPC endpoint automatically is only available via the MetaMask wallet. If you would
              like to add the RPC endpoint to your wallet manually, please refer to this{' '}
              <ExternalLink href="https://docs.kyberswap.com/getting-started/quickstart/faq#how-to-change-rpc-in-metamask">
                guide
              </ExternalLink>
              .
            </Trans>
          </Text>
        </Row>
        <Row gap="16px" flexDirection={upToExtraSmall ? 'column' : 'row'}>
          {rpcOptions.map(({ name, logo }) => (
            <RPCOption selected={selectedRpc === name} key={name} onClick={() => setSelectedRpc(name)}>
              <img src={logo} />
              {name}
            </RPCOption>
          ))}
        </Row>
        <Row gap="16px" flexDirection={upToExtraSmall ? 'column' : 'row'}>
          <ButtonOutlined onClick={onClose}>
            <Trans>No, go back</Trans>
          </ButtonOutlined>
          <ButtonPrimary onClick={onAdd} disabled={!selectedOption}>
            <Trans>Yes</Trans>
          </ButtonPrimary>
        </Row>
      </Wrapper>
    </Modal>
  )
}
