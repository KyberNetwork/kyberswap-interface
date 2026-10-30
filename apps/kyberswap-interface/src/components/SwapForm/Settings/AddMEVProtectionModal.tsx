import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useCallback } from 'react'

import { NotificationType } from 'components/Announcement/type'
import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import CopyHelper from 'components/Copy'
import Modal from 'components/Modal'
import { HStack, Stack } from 'components/Stack'
import { CONNECTION } from 'components/Web3Provider'
import { NETWORKS_INFO } from 'constants/networks'
import { Z_INDEXS } from 'constants/styles'
import { useActiveWeb3React } from 'hooks'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { useNotify } from 'state/application/hooks'
import { CloseIcon, ExternalLink } from 'theme'
import { friendlyError } from 'utils/errorMessage'

export const KYBER_SWAP_RPC: Partial<Record<ChainId, string>> = {
  [ChainId.MAINNET]: 'https://ethereum-rpc-mev-protection.kyberswap.com/',
  [ChainId.BSCMAINNET]: 'https://bsc-rpc-mev-protection.kyberswap.com/',
  // [ChainId.BASE]: 'https://base-rpc-mev-protection.kyberswap.com/',
}

const AddMEVProtectionModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { addNewNetwork } = useChangeNetwork()
  const { trackingHandler } = useTracking()
  const { walletKey, chainId } = useActiveWeb3React()
  const notify = useNotify()
  const isUsingMetamask = walletKey === CONNECTION.METAMASK_RDNS
  const chainName = NETWORKS_INFO[chainId].name

  const onAdd = useCallback(() => {
    if (!isUsingMetamask) {
      onClose()
      return
    }

    if (!KYBER_SWAP_RPC[chainId]) return

    const name = 'Ethereum Mainnet (KyberSwap RPC)'
    trackingHandler(TRACKING_EVENT_TYPE.MEV_ADD_CLICK_MODAL, { type: name })
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
        onClose()
        trackingHandler(TRACKING_EVENT_TYPE.MEV_ADD_RESULT, { type: name, result: 'success' })
      },
      (error: Error) => {
        const message = friendlyError(error)
        trackingHandler(TRACKING_EVENT_TYPE.MEV_ADD_RESULT, { type: name, result: 'fail', reason: message })
        onClose()
      },
    )
  }, [isUsingMetamask, onClose, trackingHandler, addNewNetwork, notify, chainId, chainName])

  return (
    <Modal
      isOpen={isOpen}
      width="fit-content"
      maxWidth="500px"
      maxHeight="80vh"
      onDismiss={onClose}
      zindex={Z_INDEXS.POPOVER_CONTAINER + 1}
    >
      <Stack className="w-full items-center justify-center gap-6 rounded-[20px] bg-tableHeader p-5 text-text [&_.time-frame-legend]:hidden">
        <HStack className="w-full items-start justify-between">
          <span className="text-2xl font-medium text-text">
            <Trans>Add Custom RPC Endpoint</Trans>
          </span>
          <CloseIcon className="cursor-pointer text-text" onClick={onClose} />
        </HStack>
        <div className="text-xs leading-4">
          <Stack className="gap-2">
            <span>
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
            </span>
            <HStack className="items-center gap-1">
              <span>
                <Trans>RPC Url</Trans>:
              </span>
              <span className="font-medium text-primary">{KYBER_SWAP_RPC[chainId]}</span>
              <CopyHelper size={14} margin="0" toCopy={KYBER_SWAP_RPC[chainId] || ''} />
            </HStack>
            <span>
              <Trans>
                Note that adding the RPC endpoint automatically is only available via the MetaMask wallet. If you’re
                using another wallet please add the RPC endpoint manually in your wallet’s custom network settings.
                Please make sure you understand how it works and use it at your own caution.
              </Trans>
            </span>
          </Stack>
        </div>
        <HStack className="w-full items-center gap-4 max-xs:flex-col">
          <ButtonOutlined onClick={onClose}>{isUsingMetamask ? t`No, go back` : t`Dismiss`}</ButtonOutlined>
          {isUsingMetamask && (
            <ButtonPrimary onClick={onAdd}>
              <Trans>Yes</Trans>
            </ButtonPrimary>
          )}
        </HStack>
      </Stack>
    </Modal>
  )
}

export default AddMEVProtectionModal
