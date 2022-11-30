import { Trans } from '@lingui/macro'
import { BigNumber } from 'ethers'
import { useMemo } from 'react'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import Divider from 'components/Divider'
import { RowBetween } from 'components/Row'
import { useProposalInfoById } from 'hooks/kyberdao'
import useTheme from 'hooks/useTheme'
import { getFullDisplayBalance } from 'utils/formatBalance'

const Wrapper = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 20px;
  & > * {
    width: calc(25% - 20px * 3 / 4);
  }
  flex-wrap: wrap;

  ${({ theme }) => theme.mediaWidth.upToMedium`
     & > * {
      width: calc(33.33% - 20px * 2 / 3);
    }
  `}
  ${({ theme }) => theme.mediaWidth.upToSmall`
     & > * {
      width: calc(50% - 20px / 2);
    }
  `}
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
     & > * {
      width: 100%;
    }
  `}
`
const OptionWrapper = styled.div`
  border-radius: 20px;
  padding: 12px 16px;
  ${({ theme }) => css`
    border: 1px solid ${theme.border};
    background-color: ${theme.buttonBlack};
  `}
`
const ParticipantWrapper = styled.div`
  height: 150px;
  overflow: auto;
  user-select: none;
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
     height: 130px;
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
  }, [proposalInfo])
  const options = proposalInfo?.options
  return (
    <Wrapper>
      {options && participants
        ? options.map((o, index) => {
            const participantOptionList = participants.filter(p => p.option === index)
            const sumPower = participantOptionList.reduce((sum, p) => sum + parseFloat(p.power.replaceAll(',', '')), 0)
            return (
              <OptionWrapper key={o}>
                <RowBetween>
                  <Text>{o}</Text>
                  <Text>{sumPower.toLocaleString()}</Text>
                </RowBetween>
                <Divider margin="10px 0" />
                <TableHeaderWrapper fontSize={12} color={theme.subText}>
                  <Text>
                    <Trans>Wallet</Trans>
                  </Text>
                  <Text>
                    <Trans>Amount</Trans>
                  </Text>
                </TableHeaderWrapper>
                <Divider margin="10px 0" />

                <ParticipantWrapper>
                  {participants
                    .filter(p => p.option === index)
                    .map(vote => {
                      return (
                        <InfoRow key={vote.staker}>
                          <Text>{vote.staker}</Text>
                          <Text color={theme.subText}>{vote.power}</Text>
                        </InfoRow>
                      )
                    })}
                </ParticipantWrapper>
              </OptionWrapper>
            )
          })
        : null}
    </Wrapper>
  )
}
