import { Trans } from '@lingui/macro'

import { ButtonPrimary } from 'components/Button'
import Logo from 'components/Logo'
import { useFaucetReward } from 'components/Menu/hooks/useFaucetReward'
import Modal from 'components/Modal'
import { HStack, Stack } from 'components/Stack'
import { useActiveWeb3React } from 'hooks'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal, useWalletModalToggle } from 'state/application/hooks'
import { CloseIcon } from 'theme'
import { shortenAddress } from 'utils'

const FaucetModal = () => {
  const { chainId, account } = useActiveWeb3React()

  const open = useModalOpen(ApplicationModal.FAUCET_POPUP)
  const toggle = useToggleModal(ApplicationModal.FAUCET_POPUP)

  const toggleWalletModal = useWalletModalToggle()
  const { trackingHandler } = useTracking()

  const { claimRewardCallBack, rewardAmount, rewardData, token, tokenLogo, tokenSymbol } = useFaucetReward()

  const walletAddress = account ? shortenAddress(chainId, account, 9) : '--'

  return (
    <Modal isOpen={open} onDismiss={() => toggle()} maxHeight={90}>
      <Stack className="gap-6 p-5">
        <HStack className="items-center justify-between">
          <span className="text-xl font-medium text-text">
            <Trans>Faucet</Trans>
          </span>
          <CloseIcon onClick={toggle} />
        </HStack>

        <Stack className="gap-4">
          <Stack className="gap-3 overflow-hidden rounded-lg bg-buttonBlack p-3">
            <span className="text-sm text-subText">
              <Trans>Your wallet address</Trans>
            </span>
            <span className="truncate text-2xl font-medium text-subText">{walletAddress}</span>
          </Stack>

          <span className="text-sm italic text-subText">
            <Trans>
              If your wallet is eligible, you will be able to request for some {tokenSymbol} tokens for free below. Each
              wallet can only request for the tokens once. You can claim:
            </Trans>
          </span>

          {token && (
            <HStack className="items-center gap-2 text-3xl font-medium leading-none text-text">
              {tokenLogo && <Logo srcs={[tokenLogo]} alt={`${tokenSymbol ?? 'token'} logo`} className="size-8" />}
              {rewardAmount} {tokenSymbol}
            </HStack>
          )}
        </Stack>

        {account ? (
          <ButtonPrimary
            disabled={!rewardData?.amount || rewardData?.amount === 0n}
            onClick={() => {
              claimRewardCallBack()
              trackingHandler(TRACKING_EVENT_TYPE.FAUCET_REQUEST_INITIATED)
              toggle()
            }}
          >
            <Trans>Request</Trans>
          </ButtonPrimary>
        ) : (
          <ButtonPrimary
            onClick={() => {
              toggleWalletModal()
            }}
          >
            <Trans>Connect</Trans>
          </ButtonPrimary>
        )}
      </Stack>
    </Modal>
  )
}

export default FaucetModal
