import { Trans } from '@lingui/macro'
import { lighten } from 'polished'
import { useMemo, useState } from 'react'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import ForumIcon from 'components/Icons/ForumIcon'
import History from 'components/Icons/History'
import Loader from 'components/Loader'
import { RowBetween, RowFit } from 'components/Row'
import { useVotingInfo } from 'hooks/kyberdao'
import { ApplicationModal } from 'state/application/actions'
import { useToggleModal } from 'state/application/hooks'

import YourTransactionsModal from '../StakeKNC/YourTransactionsModal'
import ProposalItem from './ProposalItem'
import SearchProposal from './SearchProposal'
import SelectProposalStatus from './SelectProposalStatus'

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
    color: ${theme.primary};
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
const HistoryButton = styled(RowFit)`
  justify-content: flex-end;
  gap: 4px;
  cursor: pointer;
  color: ${({ theme }) => theme.subText};
  :hover {
    color: ${({ theme }) => lighten(0.2, theme.primary)};
  }
`

export default function ProposalListComponent() {
  const { proposals } = useVotingInfo()
  const [status, setStatus] = useState<string | undefined>()
  const [search, setSearch] = useState<string | undefined>()
  const filteredProposals = useMemo(
    () =>
      proposals
        ?.filter(p => {
          if (!!status) {
            return p.status === status
          }
          if (!!search) {
            return p.title.toLowerCase().search(search.toLowerCase()) >= 0
          }
          return true
        })
        .sort((a, b) => b.proposal_id - a.proposal_id),
    [proposals, status, search],
  )
  const toggleYourTransactions = useToggleModal(ApplicationModal.YOUR_TRANSACTIONS_STAKE_KNC)

  return (
    <Wrapper>
      <RowBetween marginBottom={'20px'}>
        <Flex style={{ gap: '30px' }}>
          <Tab>
            <Trans>KIPs</Trans>
          </Tab>
        </Flex>
        <Flex style={{ gap: '30px' }}>
          <HistoryButton onClick={toggleYourTransactions}>
            <History /> <Text fontSize={14}>History</Text>
          </HistoryButton>
          <TextButton>
            <ForumIcon /> <Trans>Forum</Trans>
          </TextButton>
        </Flex>
      </RowBetween>
      <RowBetween>
        <SelectProposalStatus status={status} setStatus={setStatus} />
        <SearchProposal search={search} setSearch={setSearch} />
      </RowBetween>
      {filteredProposals ? (
        filteredProposals.map(p => {
          return <ProposalItem key={p.proposal_id.toString()} proposal={p} />
        })
      ) : (
        <Loader />
      )}
      <YourTransactionsModal />
    </Wrapper>
  )
}
