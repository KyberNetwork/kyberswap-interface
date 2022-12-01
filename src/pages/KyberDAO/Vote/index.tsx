import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import RelativeTime from 'dayjs/plugin/relativeTime'
import { transparentize } from 'polished'
import { useCallback, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Clock } from 'react-feather'
import { Box, Text } from 'rebass'
import styled, { css } from 'styled-components'

import bgimg from 'assets/images/about_background.png'
import luxuryGreenBackground from 'assets/images/kyberdao/luxury-green-background-small.jpg'
import { ButtonLight, ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import VoteIcon from 'components/Icons/Vote'
import InfoHelper from 'components/InfoHelper'
import { AutoRow, RowBetween, RowFit } from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import TransactionConfirmationModal from 'components/TransactionConfirmationModal'
import { useActiveWeb3React } from 'hooks'
import { useClaimRewardActions, useStakingInfo, useVotingActions, useVotingInfo } from 'hooks/kyberdao'
import useTotalVotingReward from 'hooks/kyberdao/useTotalVotingRewards'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useKNCPrice, useToggleModal, useWalletModalToggle } from 'state/application/hooks'
import { StyledInternalLink } from 'theme'
import { formattedNumLong } from 'utils'
import { formatUnitsToFixed } from 'utils/formatBalance'

import SwitchToEthereumModal from '../StakeKNC/SwitchToEthereumModal'
import KNCLogo from '../kncLogo'
import ClaimConfirmModal from './ClaimConfirmModal'
import ProposalListComponent from './ProposalListComponent'

dayjs.extend(RelativeTime)

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
  ${({ hasGreenBackground }) =>
    hasGreenBackground &&
    css`
      background-image: url('${luxuryGreenBackground}');
      background-size: cover;
    `}
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

function readableTime(seconds: number) {
  if (seconds < 60) return seconds + 's'

  const levels = [
    [Math.floor(seconds / 31536000), 'years'],
    [Math.floor((seconds % 31536000) / 86400), ' days'],
    [Math.floor(((seconds % 31536000) % 86400) / 3600), 'h'],
    [Math.floor((((seconds % 31536000) % 86400) % 3600) / 60), 'm'],
  ]

  let returntext = ''
  for (let i = 0, max = levels.length; i < max; i++) {
    if (levels[i][0] === 0) continue
    returntext +=
      ' ' +
      levels[i][0] +
      '' +
      (levels[i][0] === 1 && levels[i][1] > 1
        ? levels[i][1].toString().substring(0, levels[i][1].toString().length - 1)
        : levels[i][1])
  }

  return returntext.trim()
}

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

export default function Vote() {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const { daoInfo, remainingCumulativeAmount, userRewards, stakerInfo } = useVotingInfo()
  const { isDelegated, delegatedAccount } = useStakingInfo()
  const kncPrice = useKNCPrice()
  const { knc, usd } = useTotalVotingReward()
  const { claim } = useClaimRewardActions()
  const { vote } = useVotingActions()
  const isHasReward = !!remainingCumulativeAmount && !remainingCumulativeAmount.eq(0)

  const toggleClaimConfirmModal = useToggleModal(ApplicationModal.KYBER_DAO_CLAIM)
  const toggleWalletModal = useWalletModalToggle()

  const [showConfirm, setShowConfirm] = useState(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false)
  const [pendingText, setPendingText] = useState<string>('')

  const [txHash, setTxHash] = useState<string | undefined>(undefined)

  const totalStakedAmount = stakerInfo ? stakerInfo?.stake_amount + stakerInfo?.pending_stake_amount : 0
  const hasStakeAmount = stakerInfo && stakerInfo.stake_amount > 0
  const hasPendingStakeAmount = stakerInfo && stakerInfo.pending_stake_amount > 0
  const handleClaim = useCallback(() => {
    toggleClaimConfirmModal()
  }, [toggleClaimConfirmModal])

  const handleConfirmClaim = useCallback(async () => {
    if (!userRewards || !userRewards.userReward || !account) return
    const { cycle, userReward } = userRewards
    const { index, tokens, cumulativeAmounts, proof } = userReward
    setPendingText(t`Claming ${formatUnitsToFixed(remainingCumulativeAmount)} KNC`)
    setShowConfirm(true)
    setAttemptingTxn(true)
    claim(cycle, index, account, tokens, cumulativeAmounts, proof)
      .then(tx => {
        setAttemptingTxn(false)
        setTxHash(tx)
      })
      .catch(() => {
        setShowConfirm(false)
        setAttemptingTxn(false)
        setTxHash(undefined)
      })
  }, [userRewards, account, claim, remainingCumulativeAmount])

  const handleVote = useCallback(
    async (proposal_id: number, option: number) => {
      // only can vote when user has staked amount
      if (!!stakerInfo?.stake_amount) {
        setPendingText(t`Vote submitting`)
        setShowConfirm(true)
        setAttemptingTxn(true)
        vote(proposal_id, option)
          .then(tx => {
            setAttemptingTxn(false)
            setTxHash(tx)
          })
          .catch(error => {
            console.log(error)
            setShowConfirm(false)
            setAttemptingTxn(false)
            setTxHash(undefined)
          })
      }
    },
    [vote, stakerInfo?.stake_amount],
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
            <Text fontSize={16}>KNC: ${kncPrice ? parseFloat(kncPrice).toFixed(2) : '--'}</Text>
          </RowFit>
        </RowBetween>
        <CardGroup>
          <Card>
            <AutoColumn>
              <Text color={theme.subText} marginBottom="20px">
                <Trans>Total Staked KNC</Trans>
              </Text>
              <Text fontSize={20} marginBottom="8px" fontWeight={500}>
                {daoInfo ? formattedNumLong(Math.round(daoInfo.total_staked)) + ' KNC' : '--'}
              </Text>
              <Text fontSize={12} color={theme.subText}>
                {daoInfo && kncPrice
                  ? '~' + formattedNumLong(parseFloat(kncPrice) * Math.round(daoInfo.total_staked)) + ' USD'
                  : ''}
              </Text>
            </AutoColumn>
          </Card>
          <Card>
            <AutoColumn>
              <Text color={theme.subText} marginBottom="20px">
                <Trans>Total Voting Rewards</Trans>
              </Text>
              <Text fontSize={20} marginBottom="8px" fontWeight={500}>
                {knc?.toLocaleString() ?? '--'} KNC
              </Text>
              <Text fontSize={12} color={theme.subText}>
                ~{usd?.toLocaleString() ?? '--'} USD
              </Text>
            </AutoColumn>
          </Card>
          <Card>
            <AutoColumn>
              <Text color={theme.subText} marginBottom="20px">
                <Trans>Your Voting Power</Trans>{' '}
                <InfoHelper
                  text={t`Your voting power is calculated by
[Your Staked KNC] / [Total Staked KNC] * 100%`}
                />
              </Text>

              <RowBetween marginBottom="8px">
                <RowFit>
                  <Text
                    fontSize={20}
                    color={hasPendingStakeAmount ? (hasStakeAmount ? theme.warning : theme.border) : theme.text}
                    fontWeight={500}
                  >
                    {formatVotingPower(
                      daoInfo.total_staked && totalStakedAmount && (totalStakedAmount / daoInfo.total_staked) * 100,
                    )}
                    {hasPendingStakeAmount && hasStakeAmount && (
                      <InfoHelper
                        fontSize={12}
                        placement="top"
                        color={theme.warning}
                        size={14}
                        text={
                          <AutoColumn gap="8px">
                            <Text color={theme.subText} lineHeight="14px">
                              <Trans>A portion of your voting power can only be used from the next Epoch onward</Trans>
                            </Text>
                            <Text color={theme.warning}>
                              <Trans>
                                Voting Power this Epoch:{' '}
                                {formatVotingPower(
                                  stakerInfo?.stake_amount &&
                                    daoInfo?.total_staked &&
                                    (stakerInfo.stake_amount / daoInfo.total_staked) * 100,
                                )}
                              </Trans>
                            </Text>
                            <Text color={theme.text}>
                              <Trans>
                                Voting Power next Epoch:{' '}
                                {formatVotingPower(
                                  totalStakedAmount &&
                                    daoInfo?.total_staked &&
                                    (totalStakedAmount / daoInfo?.total_staked) * 100,
                                )}
                              </Trans>
                            </Text>
                          </AutoColumn>
                        }
                      />
                    )}
                    {hasPendingStakeAmount && !hasStakeAmount && (
                      <InfoHelper
                        fontSize={12}
                        size={14}
                        color={theme.subText}
                        placement="top"
                        text={t`You can only vote from the next Epoch onward`}
                      />
                    )}
                  </Text>
                  {!totalStakedAmount && (
                    <InfoHelper text={t`You have to stake KNC to be able to vote and earn voting reward`} />
                  )}
                </RowFit>
                {isDelegated && delegatedAccount && (
                  <MouseoverTooltip
                    text={t`You have already delegated your voting power to this address`}
                    placement="top"
                  >
                    <RowFit gap="4px" color={theme.subText}>
                      <VoteIcon size={14} />
                      <Text fontSize={12}>{delegatedAccount.slice(0, 5) + '...' + delegatedAccount.slice(-4)}</Text>
                    </RowFit>
                  </MouseoverTooltip>
                )}
              </RowBetween>
              <RowBetween>
                <Text fontSize={12} color={theme.subText}>
                  {stakerInfo ? totalStakedAmount + ' KNC Staked' : '--'}
                </Text>
                <StyledInternalLink to="/kyberdao/stake-knc" style={{ fontSize: '12px' }}>
                  <Trans>Stake KNC ↗</Trans>
                </StyledInternalLink>
              </RowBetween>
            </AutoColumn>
          </Card>
          <Card hasGreenBackground={isHasReward}>
            <AutoColumn justify="space-between">
              <Text color={theme.subText} marginBottom={20}>
                <Trans>Your Voting Reward</Trans>
              </Text>
              {account ? (
                <RowBetween>
                  <AutoColumn>
                    <Text fontSize={20} marginBottom="8px" fontWeight={500}>
                      {formatUnitsToFixed(remainingCumulativeAmount)} KNC
                    </Text>
                    <Text fontSize={12} color={theme.subText}>
                      {(
                        parseFloat(formatUnitsToFixed(remainingCumulativeAmount)) * parseFloat(kncPrice || '0')
                      ).toFixed(2)}{' '}
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
            <Box
              backgroundColor={transparentize(0.8, theme.primary)}
              color={theme.primary}
              padding="2px 8px"
              margin="0px 4px"
              style={{ borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '3px' }}
            >
              <Clock size="12px" />{' '}
              {daoInfo
                ? readableTime(
                    daoInfo.first_epoch_start_timestamp +
                      daoInfo.current_epoch * daoInfo.epoch_period_in_seconds -
                      Date.now() / 1000,
                  ) + ' left'
                : '--:--:--'}
            </Box>
          </RowFit>
          <Text>
            <Trans>Vote on current epoch proposals to get your full reward.</Trans>
          </Text>
        </AutoRow>
        <Text color={theme.subText} fontStyle="italic" fontSize={12} hidden={isMobile}>
          <Trans>Note: Voting on KyberDAO is only available on Ethereum chain</Trans>
        </Text>
        <ProposalListComponent voteCallback={handleVote} />
        <SwitchToEthereumModal featureText={t`Vote`} />
        <ClaimConfirmModal amount={formatUnitsToFixed(remainingCumulativeAmount)} onConfirmClaim={handleConfirmClaim} />
        <TransactionConfirmationModal
          isOpen={showConfirm}
          onDismiss={() => setShowConfirm(false)}
          attemptingTxn={attemptingTxn}
          hash={txHash}
          pendingText={pendingText}
          content={() => {
            return <></>
          }}
        />
      </Container>
    </Wrapper>
  )
}
