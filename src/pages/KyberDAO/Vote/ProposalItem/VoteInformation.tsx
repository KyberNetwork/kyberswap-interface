import { Trans } from '@lingui/macro'
import dayjs from 'dayjs'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import Divider from 'components/Divider'
import InfoHelper from 'components/InfoHelper'
import { RowBetween } from 'components/Row'
import { useStakingInfo } from 'hooks/kyberdao'
import { ProposalDetail } from 'hooks/kyberdao/types'
import useTheme from 'hooks/useTheme'
import { getFullDisplayBalance } from 'utils/formatBalance'

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
export default function VoteInformation({ proposal }: { proposal: ProposalDetail }) {
  const theme = useTheme()
  const { stakedBalance } = useStakingInfo()
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
          <Trans>Your KIP Voting Power</Trans>{' '}
          <InfoHelper
            placement="top"
            text="Your KIP Voting Power is calculated by
            [Your Staked KNC] / [Total Voted KNC in this KIP] * 100%"
          />
        </Text>
        <Text color={theme.text}>
          {stakedBalance && proposal.vote_stats.total_vote_count
            ? parseFloat(
                (
                  (parseFloat(getFullDisplayBalance(stakedBalance, 18)) / proposal.vote_stats.total_vote_count) *
                  100
                ).toFixed(6),
              )
            : 0}
          %
        </Text>
      </InfoRow>
    </Wrapper>
  )
}
