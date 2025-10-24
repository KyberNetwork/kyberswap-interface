import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useCallback, useMemo } from 'react'
import { X } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { NotificationType } from 'components/Announcement/type'
import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import CopyHelper from 'components/Copy'
import Modal from 'components/Modal'
import Row, { RowBetween } from 'components/Row'
import { CONNECTION } from 'components/Web3Provider'
import { NETWORKS_INFO } from 'constants/networks'
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
  color: ${({ theme }) => theme.text};

  .time-frame-legend {
    display: none;
  }
`

export const KYBER_SWAP_RPC: Partial<Record<ChainId, string>> = {
  [ChainId.MAINNET]: 'https://ethereum-mev-protection.kyberengineering.io/',
  [ChainId.BSCMAINNET]: 'https://bsc-mev-protection.kyberengineering.io/',
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
  const chainName = useMemo(() => NETWORKS_INFO[chainId].name, [chainId])

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
      KYBER_SWAP_RPC[chainId] as string,
      {
        name,
        title: t`Failed to switch to ${name} RPC Endpoint`,
        rejected: t`In order to enable MEV Protection with ${name}, you must change the RPC endpoint in your wallet`,
      },
      () => {
        notify({
          title: t`MEV Protection Mode is on`,
          type: NotificationType.SUCCESS,
          summary: t`You have successfully turned on MEV Protection Mode. All transactions on ${chainName} will go through the custom RPC endpoint unless you change it`,
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
  }, [isUsingMetamask, onClose, mixpanelHandler, addNewNetwork, notify, chainId, chainName])

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
        <Text fontSize={12} lineHeight="16px">
          <Flex flexDirection="column" sx={{ gap: '8px' }}>
            <Text>
              <ExternalLink href="https://docs.kyberswap.com/getting-started/foundational-topics/decentralized-finance/maximal-extractable-value-mev">
                MEV
              </ExternalLink>{' '}
              <Trans>Protection safeguards you from front-running attacks on {chainName}. We recommend using</Trans>{' '}
              <ExternalLink href="https://docs.kyberswap.com/getting-started/foundational-topics/decentralized-technologies/rpc">
                <Trans>KyberSwap&apos;s RPC endpoint</Trans>
              </ExternalLink>{' '}
              <Trans>
                - powered by Blink to protect your transactions from front-running attacks and ensure a better trading
                experience.
              </Trans>
            </Text>
            <Flex alignItems="center">
              <Trans>RPC Url</Trans>:
              <Text color={theme.primary} fontWeight={500} marginLeft="4px">
                {KYBER_SWAP_RPC[chainId]}
              </Text>
              <CopyHelper size={14} toCopy={KYBER_SWAP_RPC[chainId] || ''} />
            </Flex>
            <Text>
              <Trans>
                Note that adding the RPC endpoint automatically is only available via the MetaMask wallet. If you’re
                using another wallet please add the RPC endpoint manually in your wallet’s custom network settings.
                Please make sure you understand how it works and use it at your own caution.
              </Trans>
            </Text>
          </Flex>
        </Text>
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
