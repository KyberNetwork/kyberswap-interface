import { Trans, t } from '@lingui/macro'
import { transparentize } from 'polished'
import { useCallback, useMemo, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

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
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useKNCPrice, useToggleModal, useWalletModalToggle } from 'state/application/hooks'
import { StyledInternalLink } from 'theme'
import { formattedNumLong } from 'utils'
import { formatUnitsToFixed } from 'utils/formatBalance'

import SwitchToEthereumModal, { useSwitchToEthereum } from '../StakeKNC/SwitchToEthereumModal'
import TimerCountdown from '../TimerCountdown'
import KNCLogo from '../kncLogo'
import ClaimConfirmModal from './ClaimConfirmModal'
import ProposalListComponent from './ProposalListComponent'

const Wrapper = styled.div`
  width: 100%;
  background-image: url(${bgimg});
  background-size: 100% auto;
  background-repeat: repeat-y;
  z-index: 1;
  background-color: transparent;
  background-position: top;
`

const Container = styled.div`
  width: 1224px;
  margin: auto;
  min-height: 1200px;
  padding: 48px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    width:100%;
    padding: 48px 16px;
  `}
`

const Card = styled.div<{ hasGreenBackground?: boolean }>`
  padding: 20px 24px;
  border-radius: 20px;

  ${({ theme }) => css`
    background-color: ${transparentize(0.3, theme.buttonGray)};
    flex: 1;
  `}
  ${({ theme, hasGreenBackground }) =>
    hasGreenBackground &&
    (theme.darkMode
      ? css`
          background-image: url('${luxuryGreenBackground}');
          background-size: cover;
        `
      : css`
          background: radial-gradient(#daebe6, #daf1ec);
        `)}
`

const CardGroup = styled(RowBetween)`
  width: 100%;
  gap: 24px;
  margin-bottom: 12px;
  align-items: stretch;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    flex-direction: column;
  `}
`

const TabReward = styled.span<{ active?: boolean }>`
  cursor: pointer;
  ${({ active, theme }) => active && `color: ${theme.primary}`};

  :hover {
    filter: brightness(1.2);
  }
`

const formatVotingPower = (votingPowerNumber: number) => {
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
  const { mixpanelHandler } = useMixpanel()
  const {
    daoInfo,
    remainingCumulativeAmount,
    claimedRewardAmount,
    stakerInfo,
    stakerInfoNextEpoch,
    rewardStats: { knc, usd },
  } = useVotingInfo()

  const kncPrice = useKNCPrice()

  const claimVotingRewards = useClaimVotingRewards()
  const { vote } = useVotingActions()
  const { switchToEthereum } = useSwitchToEthereum()

  const isHasReward = !!remainingCumulativeAmount && !remainingCumulativeAmount.eq(0)

  const toggleClaimConfirmModal = useToggleModal(ApplicationModal.KYBER_DAO_CLAIM)
  const toggleWalletModal = useWalletModalToggle()

  const [rewardTab, setRewardTab] = useState<REWARD_TAB>(REWARD_TAB.YourReward)
  const [showConfirm, setShowConfirm] = useState(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false)
  const [pendingText, setPendingText] = useState<string>('')

  const [txHash, setTxHash] = useState<string | undefined>(undefined)
  const [transactionError, setTransactionError] = useState()
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
    switchToEthereum().then(() => {
      mixpanelHandler(MIXPANEL_TYPE.KYBER_DAO_CLAIM_CLICK)
      toggleClaimConfirmModal()
    })
  }, [toggleClaimConfirmModal, mixpanelHandler, switchToEthereum])

  const handleConfirmClaim = useCallback(async () => {
    setPendingText(t`Claming ${formatUnitsToFixed(remainingCumulativeAmount)} KNC`)
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
    async (proposal_id: number, option: number) => {
      // only can vote when user has staked amount
      setPendingText(t`Vote submitting`)
      setShowConfirm(true)
      setAttemptingTxn(true)
      try {
        const tx = await vote(proposal_id, option)
        setAttemptingTxn(false)
        setTxHash(tx)
        return Promise.resolve(true)
      } catch (error) {
        setShowConfirm(false)
        setTransactionError(error?.message)
        setTxHash(undefined)
        return Promise.reject(error)
      }
    },
    [vote],
  )

  return (
    <Wrapper>
      <Container>
        <RowBetween marginBottom={isMobile ? 0 : 36}>
          <Text fontSize={isMobile ? 22 : 24} lineHeight="28px" fontWeight={500} flex={1}>
            <Trans>Vote - Earn Rewards</Trans>
          </Text>
          <RowFit gap="4px">
            <KNCLogo size={20} />
            <Text fontSize={16}>KNC: ${kncPrice ? (+kncPrice).toPrecision(4) : '--'}</Text>
          </RowFit>
        </RowBetween>
        <CardGroup>
          <Card>
            <AutoColumn>
              <Text color={theme.subText} fontSize="14px" marginBottom="20px">
                <Trans>Total Staked KNC</Trans>
              </Text>
              <Text fontSize={20} marginBottom="8px" fontWeight={500}>
                {daoInfo ? formattedNumLong(Math.round(daoInfo.total_staked)) + ' KNC' : '--'}
              </Text>
              <Text fontSize={12} color={theme.subText}>
                {daoInfo && kncPrice
                  ? '~' + formattedNumLong(+kncPrice * Math.round(daoInfo.total_staked)) + ' USD'
                  : ''}
              </Text>
            </AutoColumn>
          </Card>
          <Card>
            <AutoColumn>
              <Text color={theme.subText} fontSize="14px" marginBottom="20px">
                <Trans>Total Voting Rewards</Trans>
              </Text>
              <Text fontSize={20} marginBottom="8px" fontWeight={500}>
                {(+knc?.toFixed(0)).toLocaleString() ?? '--'} KNC
              </Text>
              <Text fontSize={12} color={theme.subText}>
                ~{(+usd?.toFixed(0)).toLocaleString() ?? '--'} USD
              </Text>
            </AutoColumn>
          </Card>
          <Card>
            <AutoColumn>
              <Text color={theme.subText} fontSize="14px" marginBottom="20px">
                <Trans>Your Voting Power</Trans>{' '}
                <InfoHelper
                  fontSize={12}
                  placement="top"
                  text={t`Your voting power is calculated by
[Your Staked KNC] / [Total Staked KNC] * 100%`}
                />
              </Text>

              <RowBetween marginBottom="8px">
                <RowFit>
                  <Text
                    fontSize={20}
                    color={hasPendingStakeAmount && !hasStakeAmount ? theme.border : theme.text}
                    fontWeight={500}
                  >
                    {formatVotingPower(
                      daoInfo?.total_staked && votePowerAmount && (votePowerAmount / daoInfo.total_staked) * 100,
                    )}
                    {(hasPendingStakeAmount && hasStakeAmount) || hasDelegatedAmount ? (
                      <InfoHelper
                        fontSize={12}
                        placement="top"
                        width="fit-content"
                        color={theme.warning}
                        size={14}
                        text={
                          <AutoColumn gap="8px">
                            <Text color={theme.subText} lineHeight="14px" style={{ width: '260px' }}>
                              {hasPendingStakeAmount ? (
                                <Trans>
                                  A portion of your voting power can only be used from the next Epoch onward
                                </Trans>
                              ) : (
                                <Trans>You have been delegated voting power from other address(es)</Trans>
                              )}
                            </Text>
                            <Text color={theme.text}>
                              <Trans>
                                Voting Power this Epoch:{' '}
                                {formatVotingPower(
                                  votePowerAmount &&
                                    daoInfo?.total_staked &&
                                    (votePowerAmount / daoInfo.total_staked) * 100,
                                )}
                              </Trans>
                            </Text>
                            {stakerInfo?.delegated_stake_amount ? (
                              <Text color={theme.text}>
                                <Trans>
                                  Delegated Voting Power:{' '}
                                  {formatVotingPower(
                                    stakerInfo?.delegated_stake_amount &&
                                      daoInfo?.total_staked &&
                                      (stakerInfo?.delegated_stake_amount / daoInfo.total_staked) * 100,
                                  )}
                                </Trans>
                              </Text>
                            ) : null}
                            <Text color={theme.warning}>
                              <Trans>
                                Voting Power next Epoch:{' '}
                                {formatVotingPower(
                                  nextEpochVotePowerAmount &&
                                    daoInfo?.total_staked &&
                                    (nextEpochVotePowerAmount / daoInfo.total_staked) * 100,
                                )}
                              </Trans>
                            </Text>
                          </AutoColumn>
                        }
                      />
                    ) : null}
                    {totalStakedAmount && stakerInfo?.stake_amount === 0 && !isDelegated ? (
                      <InfoHelper
                        fontSize={12}
                        size={14}
                        color={theme.subText}
                        placement="top"
                        text={t`You can only vote from the next Epoch onward`}
                      />
                    ) : null}
                  </Text>
                  {!totalStakedAmount ? (
                    <InfoHelper
                      placement="top"
                      fontSize={12}
                      text={t`You have to stake KNC to be able to vote and earn voting reward`}
                    />
                  ) : null}
                </RowFit>
                {isDelegated && (
                  <MouseoverTooltip
                    text={t`You have already delegated your voting power to this address`}
                    placement="top"
                  >
                    <RowFit gap="4px" color={theme.subText}>
                      <VoteIcon size={14} />
                      <Text fontSize={12}>
                        {stakerInfo?.delegate.slice(0, 5) + '...' + stakerInfo?.delegate.slice(-4)}
                      </Text>
                    </RowFit>
                  </MouseoverTooltip>
                )}
              </RowBetween>
              <RowBetween>
                <Text fontSize={12} color={theme.subText}>
                  {totalStakedAmount ? (+totalStakedAmount.toFixed(2)).toLocaleString() + ' KNC Staked' : '--'}
                </Text>
                <StyledInternalLink to="/kyberdao/stake-knc" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                  <Trans>Stake KNC ↗</Trans>
                </StyledInternalLink>
              </RowBetween>
            </AutoColumn>
          </Card>
          <Card hasGreenBackground={isHasReward}>
            <AutoColumn justify="space-between">
              <Text color={theme.subText} fontSize="14px" marginBottom={20}>
                <TabReward
                  active={rewardTab === REWARD_TAB.YourReward}
                  onClick={() => setRewardTab(REWARD_TAB.YourReward)}
                >
                  <Trans>Your Reward</Trans>
                </TabReward>{' '}
                |{' '}
                <TabReward
                  active={rewardTab === REWARD_TAB.ClaimedReward}
                  onClick={() => setRewardTab(REWARD_TAB.ClaimedReward)}
                >
                  <Trans>Claimed Reward</Trans>
                </TabReward>
              </Text>
              {account ? (
                rewardTab === REWARD_TAB.YourReward ? (
                  <RowBetween>
                    <AutoColumn>
                      <Text fontSize={20} marginBottom="8px" fontWeight={500}>
                        {formatUnitsToFixed(remainingCumulativeAmount, undefined, 2)} KNC
                      </Text>
                      <Text fontSize={12} color={theme.subText}>
                        {(+(+formatUnitsToFixed(remainingCumulativeAmount) * +(kncPrice || '0')).toFixed(
                          2,
                        )).toLocaleString()}{' '}
                        USD
                      </Text>
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
                      <Text fontSize={20} marginBottom="8px" fontWeight={500}>
                        {(+formatUnitsToFixed(claimedRewardAmount, undefined, 2)).toLocaleString()} KNC
                      </Text>
                      <Text fontSize={12} color={theme.subText}>
                        {(+(+formatUnitsToFixed(claimedRewardAmount) * +(kncPrice || 0)).toFixed(2)).toLocaleString()}{' '}
                        USD
                      </Text>
                    </AutoColumn>
                  </RowBetween>
                )
              ) : (
                <ButtonLight onClick={toggleWalletModal}>
                  <Trans>Connect Your Wallet</Trans>
                </ButtonLight>
              )}
            </AutoColumn>
          </Card>
        </CardGroup>
        <AutoRow
          fontSize={12}
          flexDirection={isMobile ? 'column' : 'row'}
          alignItems={isMobile ? 'start !important' : 'center'}
          gap={isMobile ? '4px' : '0px'}
        >
          <RowFit>
            <Text>
              <Trans>In Progress: Epoch {daoInfo ? daoInfo.current_epoch : '--'}</Trans>
            </Text>
            {daoInfo && (
              <TimerCountdown
                endTime={daoInfo.first_epoch_start_timestamp + daoInfo.current_epoch * daoInfo.epoch_period_in_seconds}
              />
            )}
          </RowFit>
          <Text>
            <Trans>Vote on current epoch proposals to get your full reward.</Trans>
          </Text>
        </AutoRow>
        <Text color={theme.subText} fontStyle="italic" fontSize={12} hidden={isMobile}>
          <Trans>Note: Voting on KyberDAO is only available on Ethereum chain</Trans>
        </Text>
        <ProposalListComponent voteCallback={handleVote} />
        <SwitchToEthereumModal featureText={t`This action`} />
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
      </Container>
    </Wrapper>
  )
}
