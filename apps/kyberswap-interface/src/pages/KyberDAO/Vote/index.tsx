import { Trans, t } from '@lingui/macro'
import { useCallback, useMemo, useState } from 'react'

import luxuryGreenBackground from 'assets/images/kyberdao/luxury-green-background-small.jpg'
import { ButtonLight, ButtonPrimary } from 'components/Button'
import VoteIcon from 'components/Icons/Vote'
import InfoHelper from 'components/InfoHelper'
import { RowBetween, RowFit } from 'components/Row'
import { HStack, Stack } from 'components/Stack'
import { MouseoverTooltip } from 'components/Tooltip'
import TransactionConfirmationModal, { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import { useActiveWeb3React } from 'hooks'
import { useClaimVotingRewards, useVotingActions, useVotingInfo } from 'hooks/kyberdao'
import useTheme from 'hooks/useTheme'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { useSwitchToEthereum } from 'pages/KyberDAO/StakeKNC/SwitchToEthereumModal'
import TimerCountdown from 'pages/KyberDAO/TimerCountdown'
import ClaimConfirmModal from 'pages/KyberDAO/Vote/ClaimConfirmModal'
import ProposalListComponent from 'pages/KyberDAO/Vote/ProposalListComponent'
import {
  KyberDAOCaption,
  KyberDAOPage,
  KyberDAOPageHeader,
  KyberDAOSupportingText,
  KyberDAOValue,
} from 'pages/KyberDAO/common'
import KNCLogo from 'pages/KyberDAO/kncLogo'
import { ApplicationModal } from 'state/application/actions'
import { useKNCPrice, useToggleModal, useWalletModalToggle } from 'state/application/hooks'
import { StyledInternalLink } from 'theme'
import { cn } from 'utils/cn'
import { formatUnitsToFixed } from 'utils/formatBalance'
import { formatDisplayNumber } from 'utils/numbers'

const Card = ({ hasGreenBackground, children }: { hasGreenBackground?: boolean; children: React.ReactNode }) => (
  <Stack
    className="min-w-0 rounded-2xl bg-buttonGray/70 p-5"
    style={
      hasGreenBackground ? { backgroundImage: `url('${luxuryGreenBackground}')`, backgroundSize: 'cover' } : undefined
    }
  >
    {children}
  </Stack>
)

const formatVotingPower = (votingPowerNumber?: number) => {
  if (votingPowerNumber === undefined) return '--'
  if (votingPowerNumber === 0) return '0%'
  if (votingPowerNumber < 0.0001) {
    return '<0.0001 %'
  }
  if (votingPowerNumber < 1) {
    return votingPowerNumber.toFixed(4) + ' %'
  }
  return votingPowerNumber.toPrecision(4) + ' %'
}

enum REWARD_TAB {
  YourReward,
  ClaimedReward,
}

export default function Vote() {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const { trackingHandler } = useTracking()
  const {
    daoInfo,
    remainingCumulativeAmount,
    claimedRewardAmount,
    stakerInfo,
    stakerInfoNextEpoch,
    // rewardStats: { knc, usd, apr },
  } = useVotingInfo()

  const kncPrice = useKNCPrice()

  const claimVotingRewards = useClaimVotingRewards()
  const { vote } = useVotingActions()
  const { switchToEthereum } = useSwitchToEthereum()

  const isHasReward = !!remainingCumulativeAmount && remainingCumulativeAmount !== 0n

  const toggleClaimConfirmModal = useToggleModal(ApplicationModal.KYBER_DAO_CLAIM)
  const toggleWalletModal = useWalletModalToggle()

  const [rewardTab, setRewardTab] = useState<REWARD_TAB>(REWARD_TAB.YourReward)
  const [showConfirm, setShowConfirm] = useState(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false)
  const [pendingText, setPendingText] = useState<string>('')

  const [txHash, setTxHash] = useState<string | undefined>(undefined)
  const [transactionError, setTransactionError] = useState<string | undefined>(undefined)
  const totalStakedAmount = stakerInfo ? stakerInfo?.stake_amount + stakerInfo?.pending_stake_amount : 0
  const votePowerAmount: number = useMemo(
    () =>
      stakerInfo
        ? (stakerInfo.delegate.toLowerCase() === account?.toLowerCase() ? stakerInfo.stake_amount : 0) +
          stakerInfo.delegated_stake_amount
        : 0,
    [stakerInfo, account],
  )
  const nextEpochVotePowerAmount: number = useMemo(
    () =>
      stakerInfoNextEpoch
        ? (stakerInfoNextEpoch.delegate.toLowerCase() === account?.toLowerCase()
            ? stakerInfoNextEpoch.stake_amount
            : 0) + stakerInfoNextEpoch.delegated_stake_amount
        : 0,
    [stakerInfoNextEpoch, account],
  )

  const hasStakeAmount = stakerInfo && stakerInfo.stake_amount > 0
  const hasPendingStakeAmount = stakerInfo && stakerInfo.pending_stake_amount > 0
  const hasDelegatedAmount = stakerInfo && stakerInfo.delegated_stake_amount > 0
  const isDelegated = stakerInfo && account ? stakerInfo.delegate?.toLowerCase() !== account.toLowerCase() : false

  const handleClaim = useCallback(() => {
    switchToEthereum(t`Claim reward`)
      .then(() => {
        trackingHandler(TRACKING_EVENT_TYPE.KYBER_DAO_CLAIM_CLICK)
        toggleClaimConfirmModal()
      })
      .catch(() => undefined)
  }, [toggleClaimConfirmModal, trackingHandler, switchToEthereum])

  const handleConfirmClaim = useCallback(async () => {
    const amount = formatUnitsToFixed(remainingCumulativeAmount)
    setPendingText(t`Claming ${amount} KNC`)
    setShowConfirm(true)
    setAttemptingTxn(true)
    toggleClaimConfirmModal()

    try {
      const tx = await claimVotingRewards()
      setTxHash(tx)
    } catch (error) {
      setTransactionError(error?.message)
      setTxHash(undefined)
    } finally {
      setAttemptingTxn(false)
    }
  }, [claimVotingRewards, remainingCumulativeAmount, toggleClaimConfirmModal])

  const handleVote = useCallback(
    async (proposal_id: number, option: number): Promise<boolean> => {
      // only can vote when user has staked amount
      setPendingText(t`Vote submitting`)
      setShowConfirm(true)
      setAttemptingTxn(true)
      try {
        const tx = await vote(proposal_id, option)
        setAttemptingTxn(false)
        setTxHash(tx)
        return true
      } catch (error) {
        setShowConfirm(false)
        setAttemptingTxn(false)
        setTransactionError(error?.message)
        setTxHash(undefined)
        throw error
      }
    },
    [vote],
  )

  return (
    <KyberDAOPage>
      <KyberDAOPageHeader title={<Trans>Vote - Earn Rewards</Trans>}>
        <HStack className="items-center gap-2">
          <KNCLogo size={20} />
          <span className="text-base">KNC: ${kncPrice ? (+kncPrice).toPrecision(4) : '--'}</span>
        </HStack>
      </KyberDAOPageHeader>

      <div className="grid w-full gap-4 md:grid-cols-3">
        <Card>
          <Stack className="gap-4">
            <KyberDAOSupportingText>
              <Trans>Total Staked KNC</Trans>
            </KyberDAOSupportingText>
            <Stack className="gap-2">
              <KyberDAOValue>
                {daoInfo
                  ? formatDisplayNumber(Math.round(daoInfo.total_staked), { significantDigits: 6 }) + ' KNC'
                  : '--'}
              </KyberDAOValue>
              <KyberDAOCaption>
                {daoInfo && kncPrice
                  ? '~' +
                    formatDisplayNumber(+kncPrice * Math.round(daoInfo.total_staked), { significantDigits: 6 }) +
                    ' USD'
                  : ''}
              </KyberDAOCaption>
            </Stack>
          </Stack>
        </Card>
        <Card>
          <Stack className="gap-4">
            <KyberDAOSupportingText>
              <Trans>Your Voting Power</Trans>{' '}
              <InfoHelper
                fontSize={12}
                placement="top"
                text={t`Your voting power is calculated by
[Your Staked KNC] / [Total Staked KNC] * 100%.`}
              />
            </KyberDAOSupportingText>

            <Stack className="gap-2">
              <RowBetween>
                <RowFit>
                  <span
                    className="text-xl font-medium"
                    style={{ color: hasPendingStakeAmount && !hasStakeAmount ? theme.border : theme.text }}
                  >
                    {formatVotingPower(
                      daoInfo?.total_staked && votePowerAmount && (votePowerAmount / daoInfo.total_staked) * 100,
                    )}
                    {(hasPendingStakeAmount && hasStakeAmount) || hasDelegatedAmount ? (
                      <InfoHelper
                        fontSize={12}
                        placement="top"
                        width="fit-content"
                        className="text-warning"
                        size={14}
                        text={
                          <Stack className="gap-2">
                            <span className="block w-64 text-subText">
                              {hasPendingStakeAmount ? (
                                <Trans>
                                  A portion of your voting power can only be used from the next Epoch onward
                                </Trans>
                              ) : (
                                <Trans>You have been delegated voting power from other address(es)</Trans>
                              )}
                            </span>
                            <span className="text-text">
                              <Trans>
                                Voting Power this Epoch:{' '}
                                {formatVotingPower(
                                  votePowerAmount &&
                                    daoInfo?.total_staked &&
                                    (votePowerAmount / daoInfo.total_staked) * 100,
                                )}
                              </Trans>
                            </span>
                            {stakerInfo?.delegated_stake_amount ? (
                              <span className="text-text">
                                <Trans>
                                  Delegated Voting Power:{' '}
                                  {formatVotingPower(
                                    stakerInfo?.delegated_stake_amount &&
                                      daoInfo?.total_staked &&
                                      (stakerInfo?.delegated_stake_amount / daoInfo.total_staked) * 100,
                                  )}
                                </Trans>
                              </span>
                            ) : null}
                            <span className="text-warning">
                              <Trans>
                                Voting Power next Epoch:{' '}
                                {formatVotingPower(
                                  nextEpochVotePowerAmount &&
                                    daoInfo?.total_staked &&
                                    (nextEpochVotePowerAmount / daoInfo.total_staked) * 100,
                                )}
                              </Trans>
                            </span>
                          </Stack>
                        }
                      />
                    ) : null}
                    {totalStakedAmount && stakerInfo?.stake_amount === 0 && !isDelegated ? (
                      <InfoHelper
                        fontSize={12}
                        size={14}
                        className="text-subText"
                        placement="top"
                        text={t`You can only vote from the next Epoch onward`}
                      />
                    ) : null}
                  </span>
                  {!totalStakedAmount ? (
                    <InfoHelper
                      placement="top"
                      fontSize={12}
                      text={t`You have to stake KNC to be able to vote and earn voting reward.`}
                    />
                  ) : null}
                </RowFit>
                {isDelegated && (
                  <MouseoverTooltip
                    text={t`You have already delegated your voting power to this address.`}
                    placement="top"
                  >
                    <RowFit className="gap-2 text-subText">
                      <VoteIcon size={14} />
                      <span className="text-xs">
                        {stakerInfo?.delegate.slice(0, 5) + '...' + stakerInfo?.delegate.slice(-4)}
                      </span>
                    </RowFit>
                  </MouseoverTooltip>
                )}
              </RowBetween>
              <RowBetween>
                <KyberDAOCaption>
                  {totalStakedAmount ? (+totalStakedAmount.toFixed(2)).toLocaleString() + ' KNC Staked' : '--'}
                </KyberDAOCaption>
                <StyledInternalLink to="/kyberdao/stake-knc" className="whitespace-nowrap text-xs">
                  <Trans>Stake KNC ↗</Trans>
                </StyledInternalLink>
              </RowBetween>
            </Stack>
          </Stack>
        </Card>
        <Card hasGreenBackground={isHasReward}>
          <Stack className="h-full justify-between gap-4">
            <KyberDAOSupportingText>
              <span
                className={cn(
                  'cursor-pointer hover:brightness-125',
                  rewardTab === REWARD_TAB.YourReward && 'text-primary',
                )}
                onClick={() => setRewardTab(REWARD_TAB.YourReward)}
              >
                <Trans>Your Reward</Trans>
              </span>{' '}
              |{' '}
              <span
                className={cn(
                  'cursor-pointer hover:brightness-125',
                  rewardTab === REWARD_TAB.ClaimedReward && 'text-primary',
                )}
                onClick={() => setRewardTab(REWARD_TAB.ClaimedReward)}
              >
                <Trans>Claimed Reward</Trans>
              </span>
            </KyberDAOSupportingText>
            {account ? (
              rewardTab === REWARD_TAB.YourReward ? (
                <RowBetween>
                  <Stack className="gap-2">
                    <KyberDAOValue>{formatUnitsToFixed(remainingCumulativeAmount, undefined, 2)} KNC</KyberDAOValue>
                    <KyberDAOCaption>
                      {(+(+formatUnitsToFixed(remainingCumulativeAmount) * +(kncPrice || '0')).toFixed(
                        2,
                      )).toLocaleString()}{' '}
                      USD
                    </KyberDAOCaption>
                  </Stack>
                  <ButtonPrimary
                    width="75px"
                    disabled={!isHasReward}
                    style={{ filter: 'drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.16))' }}
                    onClick={handleClaim}
                  >
                    <Trans>Claim</Trans>
                  </ButtonPrimary>
                </RowBetween>
              ) : (
                <RowBetween>
                  <Stack className="gap-2">
                    <KyberDAOValue>
                      {(+formatUnitsToFixed(claimedRewardAmount, undefined, 2)).toLocaleString()} KNC
                    </KyberDAOValue>
                    <KyberDAOCaption>
                      {(+(+formatUnitsToFixed(claimedRewardAmount) * +(kncPrice || 0)).toFixed(2)).toLocaleString()} USD
                    </KyberDAOCaption>
                  </Stack>
                </RowBetween>
              )
            ) : (
              <ButtonLight onClick={toggleWalletModal}>
                <Trans>Connect</Trans>
              </ButtonLight>
            )}
          </Stack>
        </Card>
      </div>

      <Stack className="gap-2 text-xs">
        <HStack className="items-center gap-2 max-sm:flex-col max-sm:items-start">
          <HStack className="items-center gap-2">
            <span>
              <Trans>In Progress: Epoch {daoInfo ? daoInfo.current_epoch : '--'}</Trans>
            </span>
            {daoInfo && (
              <TimerCountdown
                endTime={daoInfo.first_epoch_start_timestamp + daoInfo.current_epoch * daoInfo.epoch_period_in_seconds}
              />
            )}
          </HStack>
          <span>
            <Trans>Vote on current epoch proposals to get your full reward.</Trans>
          </span>
        </HStack>
        <span className="text-xs italic text-subText max-sm:hidden">
          <Trans>Note: Voting on KyberDAO is only available on Ethereum chain.</Trans>
        </span>
      </Stack>

      <ProposalListComponent voteCallback={handleVote} />
      <ClaimConfirmModal amount={formatUnitsToFixed(remainingCumulativeAmount)} onConfirmClaim={handleConfirmClaim} />
      <TransactionConfirmationModal
        isOpen={showConfirm}
        onDismiss={() => setShowConfirm(false)}
        attemptingTxn={attemptingTxn}
        hash={txHash}
        pendingText={pendingText}
        content={() => {
          if (transactionError) {
            return <TransactionErrorContent message={transactionError} onDismiss={() => setShowConfirm(false)} />
          }
          return <></>
        }}
      />
    </KyberDAOPage>
  )
}
