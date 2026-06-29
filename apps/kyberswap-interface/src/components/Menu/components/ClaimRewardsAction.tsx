import { Trans } from '@lingui/macro'

import { ButtonPrimary } from 'components/Button'
import Loader from 'components/Loader'
import { usePendingClaimRewardTx } from 'components/Menu/hooks/useClaimReward'
import { HStack } from 'components/Stack'
import { useActiveWeb3React } from 'hooks'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { ApplicationModal } from 'state/application/actions'
import { useToggleModal } from 'state/application/hooks'

export const ClaimRewardsAction = () => {
  const { account, networkInfo } = useActiveWeb3React()
  const { trackingHandler } = useTracking()
  const pendingTx = usePendingClaimRewardTx()
  const toggleClaimPopup = useToggleModal(ApplicationModal.CLAIM_POPUP)

  return (
    <HStack className="justify-center px-5 py-2.5">
      <ButtonPrimary
        disabled={!account || !networkInfo.classic.claimReward || pendingTx}
        onClick={() => {
          trackingHandler(TRACKING_EVENT_TYPE.CLAIM_REWARDS_INITIATED)
          toggleClaimPopup()
        }}
        className="w-max p-[11px] text-sm"
      >
        {pendingTx ? (
          <HStack className="items-center gap-1">
            <Loader className="text-disableText" />
            <Trans>Claiming...</Trans>
          </HStack>
        ) : (
          <Trans>Claim Rewards</Trans>
        )}
      </ButtonPrimary>
    </HStack>
  )
}
