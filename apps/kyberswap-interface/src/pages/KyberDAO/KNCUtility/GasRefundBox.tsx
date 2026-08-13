import { Trans, t } from '@lingui/macro'
import { useCallback, useState } from 'react'
import { useGetGasRefundNextCycleInfoQuery } from 'services/kyberDAO'

import { NotificationType } from 'components/Announcement/type'
import { ButtonLight, ButtonPrimary } from 'components/Button'
import Dots from 'components/Dots'
import { RowBetween } from 'components/Row'
import { HStack, Stack } from 'components/Stack'
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
import { KyberDAOCaption, KyberDAOCardDivider, KyberDAOValue } from 'pages/KyberDAO/common'
import { useNotify, useWalletModalToggle } from 'state/application/hooks'
import { LinkStyledButton } from 'theme'
import { cn } from 'utils/cn'
import { friendlyError } from 'utils/errorMessage'
import { formatDisplayNumber } from 'utils/numbers'

const Tab = ({ active, children, onClick }: { active?: boolean; children: React.ReactNode; onClick?: () => void }) => (
  <span
    onClick={onClick}
    className={cn(
      'flex flex-row flex-nowrap items-start rounded-full text-sm font-medium text-subText outline-none hover:cursor-pointer hover:text-primary hover:no-underline',
      active && 'rounded-xl font-semibold text-primary',
    )}
  >
    <TextDashed>{children}</TextDashed>
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
    <Stack className="w-full overflow-hidden rounded-2xl bg-background/80">
      <Stack className="gap-4 p-5">
        <RowBetween className="w-full flex-row items-center gap-4 max-xs:flex-col max-xs:items-start">
          <HStack className="items-center gap-2">
            <MouseoverTooltip width="fit-content" text={<Trans>Rewards available to claim.</Trans>} placement="top">
              <Tab
                active={selectedTab === KNCUtilityTabs.Available}
                onClick={() => setSelectedTab(KNCUtilityTabs.Available)}
              >
                <Trans>Available</Trans>
              </Tab>
            </MouseoverTooltip>
            <span className="select-none text-subText">|</span>
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
            <span className="select-none text-subText">|</span>
            <MouseoverTooltip width="fit-content" text={<Trans>Rewards successfully claimed.</Trans>} placement="top">
              <Tab
                active={selectedTab === KNCUtilityTabs.Claimed}
                onClick={() => setSelectedTab(KNCUtilityTabs.Claimed)}
              >
                <Trans>Claimed</Trans>
              </Tab>
            </MouseoverTooltip>
          </HStack>
          {!!userTier && !!gasRefundPercentage && (
            <KyberDAOCaption className="w-fit text-text">
              <Trans>
                Tier {userTier} - {gasRefundPercentage * 100}% Gas Refund
              </Trans>
            </KyberDAOCaption>
          )}
        </RowBetween>
        <RowBetween className="w-full flex-row items-end gap-4">
          <Stack className="gap-2">
            <KyberDAOValue className="flex items-center">
              {account ? formatDisplayNumber(reward?.knc ?? 0, { significantDigits: 6 }) : '--'} KNC
            </KyberDAOValue>
            <KyberDAOCaption className="flex items-center">
              {account
                ? (reward?.usd ? '~' : '') +
                  formatDisplayNumber(reward?.usd ?? 0, { style: 'currency', significantDigits: 6 })
                : '$ --'}
            </KyberDAOCaption>
          </Stack>
          <div className="w-fit">
            {selectedTab === KNCUtilityTabs.Available ? (
              account ? (
                isSupportKyberDao(chainId) ? (
                  <ButtonPrimary
                    padding="8px 28px"
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
                        <LinkStyledButton
                          onClick={() => {
                            switchToEthereum(t`Gas refund program`).catch(() => undefined)
                          }}
                        >
                          here
                        </LinkStyledButton>
                      </Trans>
                    }
                    width="244px"
                  >
                    <ButtonPrimary padding="8px 28px" $disabled>
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
              <span className="text-xs font-medium">
                <Trans>
                  Available to claim in{' '}
                  <TimerCountdown endTime={nextCycleStartTime} maxLength={2} className="inline-flex" />
                </Trans>
              </span>
            ) : null}
          </div>
        </RowBetween>
      </Stack>

      <KyberDAOCardDivider />

      <RowBetween className="flex-row gap-4 p-5">
        <Stack className="gap-4">
          <TextDashed fontSize={14} lineHeight="20px" fontWeight={500}>
            <MouseoverTooltip
              width="fit-content"
              text={<Trans>Total Gas Refund = Available + Pending + Claimed Gas Refund</Trans>}
              placement="top"
            >
              <Trans>Total Gas Refund</Trans>
            </MouseoverTooltip>
          </TextDashed>
          <Stack className="gap-2">
            <KyberDAOValue className="flex items-center">
              {account ? formatDisplayNumber(totalReward?.knc ?? 0, { significantDigits: 6 }) : '--'} KNC
            </KyberDAOValue>
            <KyberDAOCaption className="flex items-center">
              {account
                ? (totalReward?.usd ? '~' : '') +
                  formatDisplayNumber(totalReward?.usd ?? 0, { style: 'currency', significantDigits: 6 })
                : '$ --'}
            </KyberDAOCaption>
          </Stack>
        </Stack>
        <div className="self-end">
          {!!account && !!eligibleTxs?.transactions.length && (
            <ButtonLight
              padding="2px 12px"
              onClick={() => setShowEligibleTx(isShowEligibleTx => !isShowEligibleTx)}
              style={{ whiteSpace: 'nowrap' }}
              width="max-content"
            >
              <span className="text-xs font-medium">
                <Trans>Your Transactions</Trans>
              </span>
            </ButtonLight>
          )}
        </div>
      </RowBetween>
      <EligibleTxModal isOpen={isShowEligibleTx} closeModal={() => setShowEligibleTx(false)} />
    </Stack>
  )
}
