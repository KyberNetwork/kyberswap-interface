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
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { useNotify } from 'state/application/hooks'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'

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
      background-color: ${theme.darkMode ? theme.buttonBlack : theme.buttonGray};
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

  const onAdd = useCallback(() => {
    if (!selectedOption) return
    addNewNetwork(ChainId.MAINNET, selectedOption.rpc, selectedOption.name, () => {
      notify({
        title: t`MEV Protection Mode is on`,
        type: NotificationType.SUCCESS,
        summary: t`You have successfully turned on MEV Protection Mode. All transactions on Ethereum will go through the custom RPC endpoint unless you change it`,
      })
      onClose?.()
    })
  }, [addNewNetwork, notify, onClose, selectedOption])

  return (
    <Modal isOpen={isOpen} width="fit-content" maxWidth="600px" maxHeight="80vh" onDismiss={onClose}>
      <Wrapper>
        <RowBetween>
          <Text fontSize={24} fontWeight={500}>
            <Trans>Add Custom RPC Endpoint</Trans>
          </Text>
          <X style={{ cursor: 'pointer' }} onClick={onClose} />
        </RowBetween>
        <Row gap="12px">
          <Text fontSize={12} lineHeight="16px">
            <Trans>
              We suggest using the{' '}
              <ExternalLink href="https://docs.kyberswap.com/getting-started/quickstart/faq#how-to-change-rpc-in-metamask">
                RPC endpoint
              </ExternalLink>{' '}
              of trusted third-parties like{' '}
              <ExternalLink href="https://docs.flashbots.net/flashbots-protect/overview">Flashbots</ExternalLink> or{' '}
              <ExternalLink href="https://mevblocker.io/#faq">MEVBlocker</ExternalLink> to protect you from MEV Bots.{' '}
              <br />
              <br />
              Please note that adding a RPC endpoint automatically is only supported via the MetaMask wallet. If you
              wish to add the RPC endpoint to your wallet manually, refer to this{' '}
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
          <ButtonOutlined onClick={onClose}>No, go back</ButtonOutlined>
          <ButtonPrimary onClick={onAdd} disabled={!selectedOption}>
            Yes
          </ButtonPrimary>
        </Row>
      </Wrapper>
    </Modal>
  )
}
