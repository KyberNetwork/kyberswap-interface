import { Trans } from '@lingui/macro'
import { useMemo } from 'react'
import { RaffleCampaignParticipant } from 'services/campaignRaffle'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import { formatDisplayNumber } from 'utils/numbers'

type Props = {
  isOpen: boolean
  onDismiss: () => void
  onConfirm: () => void
  participant?: RaffleCampaignParticipant
}

const RaffleRewardModal = ({ isOpen, onDismiss, onConfirm, participant }: Props) => {
  const rewaredWeek = useMemo(() => {
    if (participant?.reward_week_1 && participant.reward_week_2) return '1 & 2'
    if (participant?.reward_week_1) return '1'
    if (participant?.reward_week_2) return '2'
    return null
  }, [participant])

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxWidth={480} minHeight={false}>
      <div className="flex flex-col items-center gap-6 p-6 text-text max-sm:p-5">
        <span className="text-center text-lg font-medium">
          <Trans>🎉 Congratulations!</Trans>
        </span>

        <div className="flex flex-col items-center gap-2">
          <span className="text-center text-subText">
            <Trans>
              You&apos;ve eligible for Week {rewaredWeek} &quot;Swap For An Opportunity&quot; Campaign Rewards 🎁
            </Trans>
          </span>
          <span>
            <Trans>🏆 Prize: {formatDisplayNumber(participant?.reward_all, { significantDigits: 6 })} KNC</Trans>
          </span>
          <span className="text-center text-sm text-subText">
            <Trans>Rewards will be sent directly to your wallet by Dec 12, 2025 on Base.</Trans>
          </span>
        </div>

        <div className="flex w-full gap-3">
          <ButtonOutlined flex={1} height="36px" onClick={onDismiss}>
            <Trans>Close</Trans>
          </ButtonOutlined>
          <ButtonPrimary flex={1} height="36px" onClick={onConfirm}>
            <Trans>View details</Trans>
          </ButtonPrimary>
        </div>
      </div>
    </Modal>
  )
}

export default RaffleRewardModal
