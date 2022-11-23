import { Trans } from '@lingui/macro'
import { BigNumber } from 'ethers'
import { lighten } from 'polished'
import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import Divider from 'components/Divider'
import Loader from 'components/Loader'
import { RowBetween, RowFit } from 'components/Row'
import { useProposalInfoById } from 'hooks/kyberdao'
import useTheme from 'hooks/useTheme'
import { getFullDisplayBalance } from 'utils/formatBalance'

const Wrapper = styled.div`
  border-radius: 20px;
  padding: 12px 16px;
  ${({ theme }) => css`
    border: 1px solid ${theme.border};
    background-color: ${theme.buttonBlack};
  `}
`

const InfoRow = styled(RowBetween)`
  font-size: 12px;
  padding: 6px 0;
  & > * {
    flex: 1;
  }
  & > *:nth-child(2) {
    text-align: center;
  }
  & > *:last-child {
    text-align: right;
  }
`
const TextButton = styled.button`
  border: none;
  outline: none;
  background: none;
  cursor: pointer;
  padding: 0;
  ${({ theme }) => css`
    color: ${theme.primary};
    :hover {
      color: ${lighten(0.2, theme.primary)};
    }
  `}
`
const TableHeaderWrapper = styled(RowBetween)`
  & > * {
    flex: 1;
  }
  & > *:nth-child(2) {
    text-align: center;
  }
  & > *:last-child {
    text-align: right;
  }
`

export default function Participants({ proposalId }: { proposalId?: number }) {
  const { proposalInfo } = useProposalInfoById(proposalId)
  const [showMore, setShowMore] = useState(false)
  const theme = useTheme()
  const participants = useMemo(() => {
    if (!proposalInfo?.vote_stats?.votes) return
    return proposalInfo.vote_stats.votes
      .sort((a, b) => (BigNumber.from(a.power).sub(BigNumber.from(b.power)).gt(0) ? -1 : 1))
      .map(v => {
        return {
          ...v,
          staker: v.staker.slice(0, 9) + '...' + v.staker.slice(-4),
          power: Math.floor(parseFloat(getFullDisplayBalance(BigNumber.from(v.power), 18))).toLocaleString(),
        }
      })
      .slice(0, showMore ? proposalInfo.vote_stats.votes.length : 5)
  }, [proposalInfo, showMore])
  return (
    <Wrapper>
      <Text>
        <Trans>Participants</Trans>
      </Text>
      <Divider margin="10px 0" />
      <TableHeaderWrapper fontSize={12} color={theme.subText}>
        <Text>
          <Trans>Wallet</Trans>
        </Text>
        <Text>
          <Trans>Vote</Trans>
        </Text>
        <Text>
          <Trans>Amount</Trans>
        </Text>
      </TableHeaderWrapper>
      <Divider margin="10px 0" />
      {participants ? (
        participants.map(vote => {
          return (
            <InfoRow key={vote.staker}>
              <Text>{vote.staker}</Text>
              <Text>{proposalInfo?.options[vote.option]}</Text>
              <Text color={theme.subText}>{vote.power}</Text>
            </InfoRow>
          )
        })
      ) : (
        <Loader />
      )}
      <Divider margin="10px 0" />
      <Flex justifyContent="center">
        {showMore ? (
          <TextButton onClick={() => setShowMore(false)}>
            <RowFit>
              <Trans>Show less</Trans> <ArrowUp size={14} />
            </RowFit>
          </TextButton>
        ) : (
          <TextButton onClick={() => setShowMore(true)}>
            <RowFit>
              <Trans>Load more</Trans> <ArrowDown size={14} />
            </RowFit>
          </TextButton>
        )}
      </Flex>
    </Wrapper>
  )
}
