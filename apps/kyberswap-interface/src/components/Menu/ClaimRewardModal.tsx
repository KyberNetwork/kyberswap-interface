import { Trans, t } from '@lingui/macro'

import { ButtonPrimary } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import { useClaimReward } from 'components/Menu/hooks/useClaimReward'
import { HStack, Stack } from 'components/Stack'
import TransactionConfirmationModal, { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import { KNC } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { CloseIcon } from 'theme'
import { shortenAddress } from 'utils/address'

const ClaimRewardModal = () => {
  const { chainId, account } = useActiveWeb3React()

  const open = useModalOpen(ApplicationModal.CLAIM_POPUP)
  const toggle = useToggleModal(ApplicationModal.CLAIM_POPUP)

  const {
    isUserHasReward,
    rewardAmounts,
    claimRewardsCallback,
    attemptingTxn,
    txHash,
    pendingTx,
    error: claimRewardError,
    resetTxn,
  } = useClaimReward({ enabled: open })

  const canClaim = isUserHasReward && rewardAmounts !== '0' && !pendingTx
  const rewardToken = KNC[chainId]
  const walletAddress = account ? shortenAddress(chainId, account, 9) : '--'

  const modalContent = () =>
    claimRewardError ? (
      <TransactionErrorContent
        onDismiss={() => {
          toggle()
          setTimeout(() => resetTxn(), 1000)
        }}
        message={claimRewardError}
      />
    ) : (
      <Stack className="gap-6 p-5">
        <HStack className="items-center justify-between">
          <span className="text-xl font-medium text-text">
            <Trans>Claim your rewards</Trans>
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
            <Trans>If your wallet is eligible, you will be able to claim your reward below. You can claim:</Trans>
          </span>

          <HStack className="items-center gap-2 text-3xl font-medium leading-none text-text">
            <CurrencyLogo currency={rewardToken} size="32px" /> {rewardAmounts} KNC
          </HStack>
        </Stack>

        <ButtonPrimary disabled={!canClaim} onClick={claimRewardsCallback}>
          <Trans>Claim</Trans>
        </ButtonPrimary>
      </Stack>
    )

  return (
    <TransactionConfirmationModal
      isOpen={open}
      onDismiss={() => {
        toggle()
      }}
      attemptingTxn={attemptingTxn}
      hash={txHash}
      content={modalContent}
      pendingText={t`Claiming ${rewardAmounts} KNC`}
    />
  )
}

export default ClaimRewardModal
