import { Fraction } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import dayjs from 'dayjs'
import JSBI from 'jsbi'
import { useMemo } from 'react'

import Divider from 'components/Divider'
import WarningIcon from 'components/Icons/WarningIcon'
import InfoHelper from 'components/InfoHelper'
import Row, { RowBetween } from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import { BIPS_BASE } from 'constants/trade'
import { useActiveWeb3React } from 'hooks'
import { useVotingInfo } from 'hooks/kyberdao'
import { ProposalDetail } from 'hooks/kyberdao/types'

function getEpochInformation(
  epochPeriodInSeconds: number,
  firstEpochStartTimestamp: number,
  proposalStartTimestamp: number,
) {
  const epochNumber = Math.floor((proposalStartTimestamp - firstEpochStartTimestamp) / epochPeriodInSeconds)
  const epochStartTimestamp = firstEpochStartTimestamp + epochNumber * epochPeriodInSeconds
  return { epochNumber, epochStartTimestamp }
}

const InfoRow = ({ children }: { children: React.ReactNode }) => (
  <RowBetween className="py-1.5 text-xs">{children}</RowBetween>
)

export default function VoteInformation({ proposal }: { proposal: ProposalDetail }) {
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
    <div className="mb-5 rounded-[20px] border border-solid border-border bg-buttonBlack px-4 py-3">
      <div>
        <Trans>Vote Information</Trans>
      </div>
      <Divider className="my-2.5" />
      <InfoRow>
        <span className="text-subText">
          <Trans>Voting System</Trans>
        </span>
        <span className="text-text">{proposal.proposal_type}</span>
      </InfoRow>
      <InfoRow>
        <span className="text-subText">
          <Trans>Start Date</Trans>
        </span>
        <span className="text-text">{dayjs(proposal.start_timestamp * 1000).format('DD MMMM YYYY')}</span>
      </InfoRow>
      <InfoRow>
        <span className="text-subText">
          <Trans>End Date</Trans>
        </span>
        <span className="text-text">{dayjs(proposal.end_timestamp * 1000).format('DD MMMM YYYY')}</span>
      </InfoRow>
      <InfoRow>
        <span className="text-subText">
          <Trans>Total Addresses</Trans>
        </span>
        <span className="text-text">{proposal.vote_stats.total_address_count}</span>
      </InfoRow>
      <InfoRow>
        <span className="text-subText">
          <Trans>KNC Amount</Trans>
        </span>
        <span className="text-text">{Math.floor(proposal.vote_stats.total_vote_count).toLocaleString()}</span>
      </InfoRow>
      <InfoRow>
        <span className="text-subText">
          <Trans>Epoch {epochNumber} Start Date</Trans>
        </span>
        <span className="text-text">{dayjs(epochStartTimestamp * 1000).format('DD MMMM YYYY')}</span>
      </InfoRow>
      <InfoRow>
        <span className="text-subText">
          <Trans>Quorum Status</Trans>
        </span>
        {proposal.vote_stats.quorum_status === 1 ? (
          <span className="text-text">
            <Trans>Reached</Trans>
          </span>
        ) : (
          <MouseoverTooltip
            text={`Total amount required: ${Math.floor(+totalAmountRequired.toFixed(0)).toLocaleString()} KNC`}
            placement="bottom"
            width="fit-content"
          >
            <Row className="w-fit gap-1.5 text-warning">
              <WarningIcon size="16" solid />
              <span className="font-medium text-warning">
                <Trans>Not Reached</Trans>
              </span>
            </Row>
          </MouseoverTooltip>
        )}
      </InfoRow>
      <InfoRow>
        <span className="text-subText">
          <Trans>Your KIP Voting Power</Trans>{' '}
          <InfoHelper
            placement="top"
            text="Your KIP Voting Power is calculated by
            [Your Staked KNC] / [Total Voted KNC in this KIP] * 100%."
          />
        </span>
        <span className="text-text">
          {votePowerAmount > 0 && proposal.vote_stats.total_vote_count > 0
            ? +((votePowerAmount / proposal.vote_stats.total_vote_count) * 100).toPrecision(4)
            : proposal.vote_stats.total_vote_count === 0
            ? 100
            : 0}
          %
        </span>
      </InfoRow>
    </div>
  )
}
