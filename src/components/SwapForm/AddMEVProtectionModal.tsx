import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useCallback, useMemo } from 'react'
import { X } from 'react-feather'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import styled from 'styled-components'

import { NotificationType } from 'components/Announcement/type'
import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import Row, { RowBetween } from 'components/Row'
import { CONNECTION } from 'components/Web3Provider'
import { Z_INDEXS } from 'constants/styles'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
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
  color: ${({ theme }) => theme.subText};

  .time-frame-legend {
    display: none;
  }
`

const KYBER_SWAP_RPC: { [key: number]: string } = {
  [ChainId.MAINNET]: 'https://ethereum-mev-protection.kyberengineering.io/',
  // [ChainId.BASE]: 'https://base-mev-protection.kyberengineering.io/',
}

export default function AddMEVProtectionModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)
  const { addNewNetwork } = useChangeNetwork()
  const { mixpanelHandler } = useMixpanel()
  const { walletKey, chainId } = useActiveWeb3React()
  const notify = useNotify()
  const theme = useTheme()

  const isUsingMetamask = useMemo(() => walletKey === CONNECTION.METAMASK_RDNS, [walletKey])

  const onAdd = useCallback(() => {
    if (!isUsingMetamask) {
      onClose?.()
      return
    }

    if (!KYBER_SWAP_RPC[chainId]) return

    const name = 'Ethereum Mainnet (KyberSwap RPC)'
    mixpanelHandler(MIXPANEL_TYPE.MEV_ADD_CLICK_MODAL, { type: name })
    addNewNetwork(
      chainId,
      KYBER_SWAP_RPC[chainId],
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
        mixpanelHandler(MIXPANEL_TYPE.MEV_ADD_RESULT, { type: name, result: 'success' })
      },
      (error: Error) => {
        const message = friendlyError(error)
        mixpanelHandler(MIXPANEL_TYPE.MEV_ADD_RESULT, { type: name, result: 'fail', reason: message })
        onClose?.()
      },
    )
  }, [isUsingMetamask, onClose, mixpanelHandler, addNewNetwork, notify, chainId])

  return (
    <Modal
      isOpen={isOpen}
      width="fit-content"
      maxWidth="500px"
      maxHeight="80vh"
      onDismiss={onClose}
      zindex={Z_INDEXS.POPOVER_CONTAINER + 1}
    >
      <Wrapper>
        <RowBetween align="start">
          <Text fontSize={24} fontWeight={500} color={theme.text}>
            <Trans>Add Custom RPC Endpoint</Trans>
          </Text>
          <X color={theme.text} style={{ cursor: 'pointer' }} onClick={onClose} />
        </RowBetween>
        <Row gap="12px">
          <Text fontSize={12} lineHeight="16px">
            <Trans>
              <ExternalLink href="https://docs.kyberswap.com/getting-started/foundational-topics/decentralized-finance/maximal-extractable-value-mev">
                MEV
              </ExternalLink>{' '}
              Protection safeguards you from front-running attacks on Ethereum. We recommend using{' '}
              <ExternalLink href="https://docs.kyberswap.com/getting-started/foundational-topics/decentralized-technologies/rpc">
                KyberSwap&apos;s RPC endpoint
              </ExternalLink>{' '}
              - powered by Blink to protect your transactions from front-running attacks and ensure a better trading
              experience.
              <br />
              <br />
              Note that adding the RPC endpoint automatically is only available via the MetaMask wallet. If you are
              using another wallet or would like to add the RPC endpoint to your wallet manually, please refer to this{' '}
              <ExternalLink href="https://docs.kyberswap.com/getting-started/quickstart/faq#how-to-change-rpc-in-metamask">
                guide
              </ExternalLink>
              . Please make sure you understand how it works and use at your own caution.
            </Trans>
          </Text>
        </Row>
        <Row gap="16px" flexDirection={upToExtraSmall ? 'column' : 'row'}>
          <ButtonOutlined onClick={onClose}>{isUsingMetamask ? t`No, go back` : t`Dismiss`}</ButtonOutlined>
          {isUsingMetamask && (
            <ButtonPrimary onClick={onAdd}>
              <Trans>Yes</Trans>
            </ButtonPrimary>
          )}
        </Row>
      </Wrapper>
    </Modal>
  )
}
