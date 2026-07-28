import { Trans, t } from '@lingui/macro'
import { useCallback, useMemo, useState } from 'react'
import { isMobile } from 'react-device-detect'

import bgimg from 'assets/images/about_background.png'
import luxuryGreenBackground from 'assets/images/kyberdao/luxury-green-background-small.jpg'
import { ButtonLight, ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import VoteIcon from 'components/Icons/Vote'
import InfoHelper from 'components/InfoHelper'
import { AutoRow, RowBetween, RowFit } from 'components/Row'
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
import KNCLogo from 'pages/KyberDAO/kncLogo'
import { ApplicationModal } from 'state/application/actions'
import { useKNCPrice, useToggleModal, useWalletModalToggle } from 'state/application/hooks'
import { StyledInternalLink } from 'theme'
import { cn } from 'utils/cn'
import { formatUnitsToFixed } from 'utils/formatBalance'
import { formatDisplayNumber } from 'utils/numbers'

const Card = ({ hasGreenBackground, children }: { hasGreenBackground?: boolean; children: React.ReactNode }) => (
  <div
    className="flex-1 rounded-[20px] bg-buttonGray/70 px-6 py-5"
    style={
      hasGreenBackground ? { backgroundImage: `url('${luxuryGreenBackground}')`, backgroundSize: 'cover' } : undefined
    }
  >
    {children}
  </div>
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
    switchToEthereum(t`Claim reward`).then(() => {
      trackingHandler(TRACKING_EVENT_TYPE.KYBER_DAO_CLAIM_CLICK)
      toggleClaimConfirmModal()
    })
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
    <div
      className="z-[1] w-full animate-[fadeInUp_0.5s_ease-out_both] bg-transparent bg-[length:100%_auto] bg-top bg-repeat-y motion-reduce:animate-none"
      style={{ backgroundImage: `url(${bgimg})` }}
    >
      <div className="mx-auto flex min-h-[1200px] w-[1224px] flex-col gap-3 py-12 max-lg:w-full max-lg:px-4 max-lg:py-12">
        <RowBetween className={isMobile ? '' : 'mb-9'}>
          <span className={cn('flex-1 font-medium leading-7', isMobile ? 'text-[22px]' : 'text-2xl')}>
            <Trans>Vote - Earn Rewards</Trans>
          </span>
          <RowFit className="gap-1">
            <KNCLogo size={20} />
            <span className="text-base leading-[normal]">KNC: ${kncPrice ? (+kncPrice).toPrecision(4) : '--'}</span>
          </RowFit>
        </RowBetween>
        <RowBetween className="mb-3 w-full items-stretch gap-6 max-md:flex-col">
          <Card>
            <AutoColumn>
              <span className="mb-5 text-sm text-subText">
                <Trans>Total Staked KNC</Trans>
              </span>
              <span className="mb-2 text-xl font-medium leading-[normal]">
                {daoInfo
                  ? formatDisplayNumber(Math.round(daoInfo.total_staked), { significantDigits: 6 }) + ' KNC'
                  : '--'}
              </span>
              <span className="text-xs text-subText">
                {daoInfo && kncPrice
                  ? '~' +
                    formatDisplayNumber(+kncPrice * Math.round(daoInfo.total_staked), { significantDigits: 6 }) +
                    ' USD'
                  : ''}
              </span>
            </AutoColumn>
          </Card>
          {/* <Card>
            <AutoColumn>
              <RowBetween marginBottom="20px">
                <Text color={theme.subText} fontSize="14px">
                  <Trans>Total Voting Rewards</Trans>
                </Text>
                <Text color={theme.subText} fontSize="14px">
                  <Trans>APR</Trans>
                </Text>
              </RowBetween>
              <RowBetween className="mb-2">
                <Text fontSize={20} fontWeight={500}>
                  {(+knc?.toFixed(0)).toLocaleString() ?? '--'} KNC
                </Text>
                <Text fontSize={20} fontWeight={500} color={theme.apr}>
                  {apr.toFixed(2) ?? '--'}%
                </Text>
              </RowBetween>

              <Text fontSize={12} color={theme.subText}>
                ~{(+usd?.toFixed(0)).toLocaleString() ?? '--'} USD
              </Text>
            </AutoColumn>
          </Card> */}
          <Card>
            <AutoColumn>
              <span className="mb-5 text-sm text-subText">
                <Trans>Your Voting Power</Trans>{' '}
                <InfoHelper
                  fontSize={12}
                  placement="top"
                  text={t`Your voting power is calculated by
[Your Staked KNC] / [Total Staked KNC] * 100%.`}
                />
              </span>

              <RowBetween className="mb-2">
                <RowFit>
                  <span
                    className="text-xl font-medium leading-[normal]"
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
                          <AutoColumn className="gap-2">
                            <span className="block w-[260px] leading-[14px] text-subText">
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
                          </AutoColumn>
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
                    <RowFit className="gap-1 text-subText">
                      <VoteIcon size={14} />
                      <span className="text-xs">
                        {stakerInfo?.delegate.slice(0, 5) + '...' + stakerInfo?.delegate.slice(-4)}
                      </span>
                    </RowFit>
                  </MouseoverTooltip>
                )}
              </RowBetween>
              <RowBetween>
                <span className="text-xs text-subText">
                  {totalStakedAmount ? (+totalStakedAmount.toFixed(2)).toLocaleString() + ' KNC Staked' : '--'}
                </span>
                <StyledInternalLink to="/kyberdao/stake-knc" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                  <Trans>Stake KNC ↗</Trans>
                </StyledInternalLink>
              </RowBetween>
            </AutoColumn>
          </Card>
          <Card hasGreenBackground={isHasReward}>
            <AutoColumn className="justify-between">
              <span className="mb-5 text-sm text-subText">
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
              </span>
              {account ? (
                rewardTab === REWARD_TAB.YourReward ? (
                  <RowBetween>
                    <AutoColumn>
                      <span className="mb-2 text-xl font-medium leading-[normal]">
                        {formatUnitsToFixed(remainingCumulativeAmount, undefined, 2)} KNC
                      </span>
                      <span className="text-xs text-subText">
                        {(+(+formatUnitsToFixed(remainingCumulativeAmount) * +(kncPrice || '0')).toFixed(
                          2,
                        )).toLocaleString()}{' '}
                        USD
                      </span>
                    </AutoColumn>
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
                    <AutoColumn>
                      <span className="mb-2 text-xl font-medium leading-[normal]">
                        {(+formatUnitsToFixed(claimedRewardAmount, undefined, 2)).toLocaleString()} KNC
                      </span>
                      <span className="text-xs text-subText">
                        {(+(+formatUnitsToFixed(claimedRewardAmount) * +(kncPrice || 0)).toFixed(2)).toLocaleString()}{' '}
                        USD
                      </span>
                    </AutoColumn>
                  </RowBetween>
                )
              ) : (
                <ButtonLight onClick={toggleWalletModal}>
                  <Trans>Connect</Trans>
                </ButtonLight>
              )}
            </AutoColumn>
          </Card>
        </RowBetween>
        <AutoRow className={cn('text-xs', isMobile ? 'flex-col items-start gap-1' : 'flex-row items-center gap-0')}>
          <RowFit>
            <span>
              <Trans>In Progress: Epoch {daoInfo ? daoInfo.current_epoch : '--'}</Trans>
            </span>
            {daoInfo && (
              <TimerCountdown
                endTime={daoInfo.first_epoch_start_timestamp + daoInfo.current_epoch * daoInfo.epoch_period_in_seconds}
              />
            )}
          </RowFit>
          <span>
            <Trans>Vote on current epoch proposals to get your full reward.</Trans>
          </span>
        </AutoRow>
        <span className="text-xs italic text-subText" hidden={isMobile}>
          <Trans>Note: Voting on KyberDAO is only available on Ethereum chain.</Trans>
        </span>
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
      </div>
    </div>
  )
}
