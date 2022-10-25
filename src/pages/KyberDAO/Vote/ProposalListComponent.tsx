import { Trans } from '@lingui/macro'
import { lighten } from 'polished'
import { Flex } from 'rebass'
import styled, { css } from 'styled-components'

import ForumIcon from 'components/Icons/ForumIcon'
import History from 'components/Icons/History'
import { RowBetween } from 'components/Row'

import ProposalItem from './ProposalItem'
import SearchProposal from './SearchProposal'
import SelectProposalStatus from './SelectProposalStatus'
import { Proposal, ProposalStatus } from './type'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
`

const Tab = styled.div<{ $active?: boolean }>`
  font-size: 20px;
  font-weight: 500;
  ${({ theme, $active }) => css`
    color: ${$active ? theme.primary : theme.subText};
    :hover {
      color: ${lighten(0.1, theme.primary)};
    }
  `}
`
const TextButton = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  cursor: pointer;
  ${({ theme }) => css`
    color: ${theme.subText};
    :hover {
      color: ${lighten(0.1, theme.subText)} !important;
    }
  `}
`

const proposalData: Proposal[] = [
  {
    title: 'KIP-18: Advance KNC Allocation for Small-Scale Liquidity Mining Activities',
    status: ProposalStatus.Pending,
    id: 'ID #10',
  },
  {
    title: 'KIP-17: Allocate additional 5M KNC from the ecosystem fund & transfer ~1.78M KNC for Avalanche LM',
    status: ProposalStatus.Cancelled,
    id: 'ID #7',
  },
  {
    title: 'KIP-16: Allocate additional 5M KNC from the ecosystem fund & transfer ~1.78M KNC for Avalanche LM',
    status: ProposalStatus.Failed,
    id: 'ID #6',
  },
  {
    title: 'KIP-15: KyberDMM Expansion and Liquidity Mining on Avalanche',
    status: ProposalStatus.Executed,
    id: 'ID #5',
  },
  {
    title: 'KIP-14: KyberDMM Expansion and Liquidity Mining on BSC',
    status: ProposalStatus.Approved,
    id: 'ID #4',
  },
]

export default function ProposalListComponent() {
  return (
    <Wrapper>
      <RowBetween marginBottom={'20px'}>
        <Flex style={{ gap: '30px' }}>
          <Tab>
            <Trans>KIPs</Trans>
          </Tab>
          <Tab>
            <Trans>Polls</Trans>
          </Tab>
        </Flex>
        <Flex style={{ gap: '30px' }}>
          <TextButton>
            <History /> <Trans>History</Trans>
          </TextButton>
          <TextButton>
            <ForumIcon /> <Trans>Forum</Trans>
          </TextButton>
        </Flex>
      </RowBetween>
      <RowBetween>
        <SelectProposalStatus />
        <SearchProposal />
      </RowBetween>
      {proposalData.map(p => {
        return <ProposalItem key={p.id} {...p} />
      })}
    </Wrapper>
  )
}
