import { Trans, t } from '@lingui/macro'
import { useCallback, useState } from 'react'

import { ReactComponent as DollarIcon } from 'assets/svg/dollar.svg'
import { NotificationType } from 'components/Announcement/type'
import { ButtonPrimary } from 'components/Button'
import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import { useRewards } from 'hooks/useRewards'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { useSwitchToEthereum } from 'pages/KyberDAO/StakeKNC/SwitchToEthereumModal'
import { useNotify } from 'state/application/hooks'
import { formatNumberWithPrecisionRange } from 'utils'
import { friendlyError } from 'utils/errorMessage'

import CardBackground from './AccountInfo/CardBackground'
import Tab from './Transactions/Tab'
import { REWARD_TYPE } from './type'

export default function RewardCenter() {
  const { trackingHandler } = useTracking()
  const TABS = [
    {
      title: t`Voting Rewards`,
      value: REWARD_TYPE.VOTING_REWARDS,
    },
    {
      title: t`Gas Refund`,
      value: REWARD_TYPE.GAS_REFUND,
    },
  ] as { title: string; value: REWARD_TYPE }[]
  const notify = useNotify()
  const [activeTab, setActiveTab] = useState<REWARD_TYPE>(REWARD_TYPE.VOTING_REWARDS)
  const { rewards, totalReward } = useRewards()
  const currentReward = rewards[activeTab]
  const { switchToEthereum } = useSwitchToEthereum()

  const [claiming, setClaiming] = useState(false)
  const claimRewards = useCallback(async () => {
    switchToEthereum(t`Claim reward`)
      .then(async () => {
        try {
          setClaiming(true)
          trackingHandler(TRACKING_EVENT_TYPE.GAS_REFUND_CLAIM_CLICK, {
            source: 'wallet UI',
            token_amount: currentReward.knc,
          })
          await currentReward.claim()
        } catch (error) {
          const message = friendlyError(error)
          console.error('Wrap error:', { message, error })
          notify(
            {
              title: t`Claim Error`,
              summary: message,
              type: NotificationType.ERROR,
            },
            8000,
          )
        } finally {
          setClaiming(false)
        }
      })
      .catch()
  }, [currentReward, trackingHandler, notify, switchToEthereum])

  return (
    <div className="flex flex-1 basis-full flex-col gap-4 overflow-y-scroll">
      <div className="relative w-full">
        <CardBackground noLogo />
        <div className="relative z-[2] flex size-full flex-col justify-between gap-1 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex w-fit gap-1">
                <MouseoverTooltip
                  text={t`Total Available Rewards = Total Available Voting Rewards + Total Available Gas Refund.`}
                >
                  <TextDashed className="text-xs font-medium leading-4 text-subText">
                    <Trans>Total Available Rewards</Trans>
                  </TextDashed>
                </MouseoverTooltip>
              </div>

              <span className="overflow-hidden truncate whitespace-nowrap text-4xl font-medium">
                {formatNumberWithPrecisionRange(totalReward.knc, 0, 8)} KNC
              </span>
              <span className="text-xs font-medium leading-4 text-subText">
                {typeof totalReward.usd === 'number'
                  ? `${totalReward.usd > 0 ? '~ ' : ''}$${formatNumberWithPrecisionRange(totalReward.usd, 0, 8)}`
                  : '$ --'}
              </span>
            </div>
          </div>
        </div>
      </div>
      <Tab<REWARD_TYPE> activeTab={activeTab} setActiveTab={setActiveTab} tabs={TABS} />
      <div className="flex flex-col gap-3">
        <span className="text-xs font-medium leading-4 text-primary">
          <Trans>Your Reward</Trans>
        </span>
        <div className="flex gap-2">
          <div className="flex w-full items-center gap-1 rounded-[44px] bg-background px-3 py-1.5">
            <DollarIcon width={12} height={12} className="text-subText" />
            <span className="text-xs font-normal leading-4">{currentReward.knc} KNC</span>
          </div>
          <ButtonPrimary
            width="fit-content"
            padding="4px 15px"
            minWidth="unset"
            onClick={claimRewards}
            disabled={claiming || !currentReward.knc}
          >
            <span className="text-sm font-medium leading-5">
              {claiming ? <Trans>Claiming</Trans> : <Trans>Claim</Trans>}
            </span>
          </ButtonPrimary>
        </div>
      </div>
    </div>
  )
}
