import { Fraction } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import dayjs from 'dayjs'
import JSBI from 'jsbi'
import { useMemo } from 'react'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import Divider from 'components/Divider'
import WarningIcon from 'components/Icons/WarningIcon'
import InfoHelper from 'components/InfoHelper'
import Row, { RowBetween } from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import { BIPS_BASE } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useVotingInfo } from 'hooks/kyberdao'
import { ProposalDetail } from 'hooks/kyberdao/types'
import useTheme from 'hooks/useTheme'

const Wrapper = styled.div`
  border-radius: 20px;
  padding: 12px 16px;
  margin-bottom: 20px;
  ${({ theme }) => css`
    border: 1px solid ${theme.border};
    background-color: ${theme.buttonBlack};
  `}
`

const InfoRow = styled(RowBetween)`
  font-size: 12px;
  padding: 6px 0;
`

function getEpochInformation(
  epochPeriodInSeconds: number,
  firstEpochStartTimestamp: number,
  proposalStartTimestamp: number,
) {
  const epochNumber = Math.floor((proposalStartTimestamp - firstEpochStartTimestamp) / epochPeriodInSeconds)
  const epochStartTimestamp = firstEpochStartTimestamp + epochNumber * epochPeriodInSeconds
  return { epochNumber, epochStartTimestamp }
}

export default function VoteInformation({ proposal }: { proposal: ProposalDetail }) {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const { stakerInfo, daoInfo } = useVotingInfo()
  const votePowerAmount: number = useMemo(
    () =>
      stakerInfo
        ? (stakerInfo.delegate.toLowerCase() === account?.toLowerCase() ? stakerInfo.stake_amount : 0) +
          stakerInfo.delegated_stake_amount
        : 0,
    [stakerInfo, account],
  )
  const totalAmountRequired = new Fraction(
    proposal.max_voting_power,
    JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18)),
  )
    .multiply(proposal.executor_minimum_quorum)
    .divide(BIPS_BASE)
  const { epochNumber, epochStartTimestamp } = getEpochInformation(
    daoInfo?.epoch_period_in_seconds ?? 0,
    daoInfo?.first_epoch_start_timestamp ?? 0,
    proposal.start_timestamp,
  )

  return (
    <Wrapper>
      <Text>
        <Trans>Vote Information</Trans>
      </Text>
      <Divider margin="10px 0" />
      <InfoRow>
        <Text color={theme.subText}>
          <Trans>Voting System</Trans>
        </Text>
        <Text color={theme.text}>{proposal.proposal_type}</Text>
      </InfoRow>
      <InfoRow>
        <Text color={theme.subText}>
          <Trans>Start Date</Trans>
        </Text>
        <Text color={theme.text}>{dayjs(proposal.start_timestamp * 1000).format('DD MMMM YYYY')}</Text>
      </InfoRow>
      <InfoRow>
        <Text color={theme.subText}>
          <Trans>End Date</Trans>
        </Text>
        <Text color={theme.text}>{dayjs(proposal.end_timestamp * 1000).format('DD MMMM YYYY')}</Text>
      </InfoRow>
      <InfoRow>
        <Text color={theme.subText}>
          <Trans>Total Addresses</Trans>
        </Text>
        <Text color={theme.text}>{proposal.vote_stats.total_address_count}</Text>
      </InfoRow>
      <InfoRow>
        <Text color={theme.subText}>
          <Trans>KNC Amount</Trans>
        </Text>
        <Text color={theme.text}>{Math.floor(proposal.vote_stats.total_vote_count).toLocaleString()}</Text>
      </InfoRow>
      <InfoRow>
        <Text color={theme.subText}>
          <Trans>Epoch {epochNumber} Start Date</Trans>
        </Text>
        <Text color={theme.text}>{dayjs(epochStartTimestamp * 1000).format('DD MMMM YYYY')}</Text>
      </InfoRow>
      <InfoRow>
        <Text color={theme.subText}>
          <Trans>Quorum Status</Trans>
        </Text>
        {proposal.vote_stats.quorum_status === 1 ? (
          <Text color={theme.text}>
            <Trans>Reached</Trans>
          </Text>
        ) : (
          <MouseoverTooltip
            text={`Total amount required: ${Math.floor(+totalAmountRequired.toFixed(0)).toLocaleString()} KNC`}
            placement="bottom"
            width="fit-content"
          >
            <Row width="fit-content" gap="6px" color={theme.warning}>
              <WarningIcon size="16" solid />
              <Text color={theme.warning} fontWeight={500}>
                <Trans>Not Reached</Trans>
              </Text>
            </Row>
          </MouseoverTooltip>
        )}
      </InfoRow>
      <InfoRow>
        <Text color={theme.subText}>
          <Trans>Your KIP Voting Power</Trans>{' '}
          <InfoHelper
            placement="top"
            text="Your KIP Voting Power is calculated by
            [Your Staked KNC] / [Total Voted KNC in this KIP] * 100%."
          />
        </Text>
        <Text color={theme.text}>
          {votePowerAmount > 0 && proposal.vote_stats.total_vote_count > 0
            ? +((votePowerAmount / proposal.vote_stats.total_vote_count) * 100).toPrecision(4)
            : proposal.vote_stats.total_vote_count === 0
            ? 100
            : 0}
          %
        </Text>
      </InfoRow>
    </Wrapper>
  )
}
