import { Trans, t } from '@lingui/macro'
import { useCallback, useState } from 'react'
import { useMedia } from 'react-use'
import { useGetGasRefundNextCycleInfoQuery } from 'services/kyberDAO'

import { NotificationType } from 'components/Announcement/type'
import { ButtonLight, ButtonPrimary } from 'components/Button'
import Dots from 'components/Dots'
import { RowBetween } from 'components/Row'
import { TextDashed } from 'components/Text'
import { MouseoverTooltip } from 'components/Tooltip'
import { useActiveWeb3React } from 'hooks'
import {
  isSupportKyberDao,
  useClaimGasRefundRewards,
  useEligibleTransactions,
  useGasRefundInfo,
  useGasRefundTier,
} from 'hooks/kyberdao'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import EligibleTxModal from 'pages/KyberDAO/KNCUtility/EligibleTxModal'
import { KNCUtilityTabs } from 'pages/KyberDAO/KNCUtility/type'
import { useSwitchToEthereum } from 'pages/KyberDAO/StakeKNC/SwitchToEthereumModal'
import TimerCountdown from 'pages/KyberDAO/TimerCountdown'
import { useNotify, useWalletModalToggle } from 'state/application/hooks'
import { LinkStyledButton, MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'
import { friendlyError } from 'utils/errorMessage'
import { formatDisplayNumber } from 'utils/numbers'

const Tab = ({ active, children, onClick }: { active?: boolean; children: React.ReactNode; onClick?: () => void }) => (
  <span
    onClick={onClick}
    className={cn(
      'flex flex-row flex-nowrap items-start rounded-[3rem] text-sm font-medium leading-5 text-subText outline-none hover:cursor-pointer hover:text-[#1f9777] hover:no-underline',
      active && 'rounded-xl font-semibold text-primary',
    )}
  >
    {children}
  </span>
)

export default function GasRefundBox() {
  const { trackingHandler } = useTracking()
  const { account, chainId } = useActiveWeb3React()
  const [selectedTab, setSelectedTab] = useState<KNCUtilityTabs>(KNCUtilityTabs.Available)
  const { totalReward, reward, claimableReward } = useGasRefundInfo({ rewardStatus: selectedTab })
  const toggleWalletModal = useWalletModalToggle()
  const [isShowEligibleTx, setShowEligibleTx] = useState(false)
  const eligibleTxs = useEligibleTransactions(1, 1)
  const upToXXSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToXXSmall}px)`)
  const { userTier, gasRefundPercentage } = useGasRefundTier()
  const { data: nextCycleData } = useGetGasRefundNextCycleInfoQuery(undefined)
  const nextCycleStartTime = nextCycleData?.data.startTime
  const { switchToEthereum } = useSwitchToEthereum()
  const claimReward = useClaimGasRefundRewards()
  const notify = useNotify()
  const [claiming, setClaiming] = useState(false)
  const handleClaimReward = useCallback(async () => {
    try {
      setClaiming(true)
      trackingHandler(TRACKING_EVENT_TYPE.GAS_REFUND_CLAIM_CLICK, {
        source: 'KNC Utility page',
        token_amount: claimableReward?.knc,
      })
      await claimReward()
    } catch (error) {
      notify({
        title: t`Claim Error`,
        summary: friendlyError(error),
        type: NotificationType.ERROR,
      })
    } finally {
      setClaiming(false)
    }
  }, [claimReward, claimableReward?.knc, trackingHandler, notify])

  return (
    <div className="flex w-full flex-col gap-5 rounded-[20px] bg-tableHeader p-5">
      <div className="flex flex-col gap-4">
        <RowBetween className="w-full flex-row items-center gap-4 max-xs:flex-col max-xs:items-start">
          <div className="flex">
            <TextDashed>
              <MouseoverTooltip width="fit-content" text={<Trans>Rewards available to claim.</Trans>} placement="top">
                <Tab
                  active={selectedTab === KNCUtilityTabs.Available}
                  onClick={() => setSelectedTab(KNCUtilityTabs.Available)}
                >
                  <Trans>Available</Trans>
                </Tab>
              </MouseoverTooltip>
            </TextDashed>
            <span className="select-none">&nbsp;|&nbsp;</span>
            <TextDashed>
              <MouseoverTooltip
                width="fit-content"
                text={<Trans>Rewards to claim after the end of the countdown period.</Trans>}
                placement="top"
              >
                <Tab
                  active={selectedTab === KNCUtilityTabs.Pending}
                  onClick={() => setSelectedTab(KNCUtilityTabs.Pending)}
                >
                  <Trans>Pending</Trans>
                </Tab>
              </MouseoverTooltip>
            </TextDashed>
            <span className="select-none">&nbsp;|&nbsp;</span>
            <TextDashed>
              <MouseoverTooltip width="fit-content" text={<Trans>Rewards successfully claimed.</Trans>} placement="top">
                <Tab
                  active={selectedTab === KNCUtilityTabs.Claimed}
                  onClick={() => setSelectedTab(KNCUtilityTabs.Claimed)}
                >
                  <Trans>Claimed</Trans>
                </Tab>
              </MouseoverTooltip>
            </TextDashed>
          </div>
          {!!userTier && !!gasRefundPercentage && (
            <span className="w-fit text-xs font-normal leading-4">
              <Trans>
                Tier {userTier} - {gasRefundPercentage * 100}% Gas Refund
              </Trans>
            </span>
          )}
        </RowBetween>
        <RowBetween className="w-full flex-row items-end gap-4">
          <div className="flex flex-col gap-2">
            <span className="flex items-center text-xl font-medium leading-6 text-text">
              {account ? formatDisplayNumber(reward?.knc ?? 0, { significantDigits: 6 }) : '--'} KNC
            </span>
            <span className="flex items-center text-xs font-medium leading-4 text-subText">
              {account
                ? (reward?.usd ? '~' : '') +
                  formatDisplayNumber(reward?.usd ?? 0, { style: 'currency', significantDigits: 6 })
                : '$ --'}
            </span>
          </div>
          <div className="flex w-fit">
            {selectedTab === KNCUtilityTabs.Available ? (
              account ? (
                isSupportKyberDao(chainId) ? (
                  <ButtonPrimary
                    padding={upToXXSmall ? '8px 28px' : '8px 45px'}
                    onClick={claiming ? undefined : handleClaimReward}
                    disabled={claiming || (claimableReward?.knc ?? 0) <= 0}
                  >
                    {claiming ? (
                      <Dots>
                        <Trans>Claiming</Trans>
                      </Dots>
                    ) : (
                      <Trans>Claim</Trans>
                    )}
                  </ButtonPrimary>
                ) : (
                  <MouseoverTooltip
                    text={
                      <Trans>
                        Gas Refund Rewards is only available on Ethereum chain. Switch your network to continue{' '}
                        <LinkStyledButton onClick={() => switchToEthereum(t`Gas refund program`)}>
                          here
                        </LinkStyledButton>
                      </Trans>
                    }
                    width="244px"
                  >
                    <ButtonPrimary padding={upToXXSmall ? '8px 28px' : '8px 45px'} $disabled>
                      <Trans>Claim</Trans>
                    </ButtonPrimary>
                  </MouseoverTooltip>
                )
              ) : (
                <ButtonLight onClick={toggleWalletModal} padding="10px 12px">
                  <Trans>Connect</Trans>
                </ButtonLight>
              )
            ) : selectedTab === KNCUtilityTabs.Pending && nextCycleStartTime ? (
              <span className="text-xs font-medium leading-4">
                <Trans>
                  Available to claim in{' '}
                  <TimerCountdown endTime={nextCycleStartTime} maxLength={2} style={{ display: 'inline-flex' }} />
                </Trans>
              </span>
            ) : null}
          </div>
        </RowBetween>
      </div>
      <hr className="m-0 h-px w-full border-none bg-border" />
      <RowBetween className="flex-row gap-4">
        <div className="flex flex-col gap-4">
          <TextDashed fontSize={14} lineHeight="20px" fontWeight={500}>
            <MouseoverTooltip
              width="fit-content"
              text={<Trans>Total Gas Refund = Available + Pending + Claimed Gas Refund</Trans>}
              placement="top"
            >
              <Trans>Total Gas Refund</Trans>
            </MouseoverTooltip>
          </TextDashed>
          <div className="flex flex-col gap-2">
            <span className="flex items-center text-xl font-medium leading-6 text-text">
              {account ? formatDisplayNumber(totalReward?.knc ?? 0, { significantDigits: 6 }) : '--'} KNC
            </span>
            <span className="flex items-center text-xs font-medium leading-4 text-subText">
              {account
                ? (totalReward?.usd ? '~' : '') +
                  formatDisplayNumber(totalReward?.usd ?? 0, { style: 'currency', significantDigits: 6 })
                : '$ --'}
            </span>
          </div>
        </div>
        <div className="flex self-end">
          {!!account && !!eligibleTxs?.transactions.length && (
            <ButtonLight
              padding="2px 12px"
              onClick={() => setShowEligibleTx(isShowEligibleTx => !isShowEligibleTx)}
              style={{ whiteSpace: 'nowrap' }}
              width="max-content"
            >
              <span className="text-xs font-medium leading-4">
                <Trans>Your Transactions</Trans>
              </span>
            </ButtonLight>
          )}
        </div>
      </RowBetween>
      <EligibleTxModal isOpen={isShowEligibleTx} closeModal={() => setShowEligibleTx(false)} />
    </div>
  )
}
