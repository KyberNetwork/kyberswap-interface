import { Trans, t } from '@lingui/macro'

import { ButtonPrimary } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import { RowBetween } from 'components/Row'
import TransactionConfirmationModal, { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import { KNC } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useClaimReward } from 'hooks/useClaimReward'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { CloseIcon } from 'theme'
import { shortenAddress } from 'utils'

function ClaimRewardModal() {
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
  } = useClaimReward()
  const isCanClaim = isUserHasReward && rewardAmounts !== '0' && !pendingTx

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
      <div className="flex flex-col gap-[25px] px-6 py-[26px]">
        <RowBetween>
          <span className="text-xl font-medium text-text">
            <Trans>Claim your rewards</Trans>
          </span>
          <CloseIcon onClick={toggle} />
        </RowBetween>

        <div className="overflow-hidden rounded-lg bg-buttonBlack p-3 [&>p]:m-0 [&>p]:mt-3 [&>p]:text-2xl [&>p]:font-medium [&>p]:leading-7 [&>p]:text-disableText">
          <span className="text-xs text-subText">
            <Trans>Your wallet address</Trans>
          </span>
          <p>{account && shortenAddress(chainId, account, 9)}</p>
        </div>
        <span className="text-base leading-6 text-text">
          <Trans>If your wallet is eligible, you will be able to claim your reward below. You can claim:</Trans>
        </span>
        <span className="text-[32px] font-medium leading-[38px]">
          <CurrencyLogo currency={KNC[chainId]} /> {rewardAmounts} KNC
        </span>
        <ButtonPrimary disabled={!isCanClaim} onClick={claimRewardsCallback}>
          <Trans>Claim</Trans>
        </ButtonPrimary>
      </div>
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
