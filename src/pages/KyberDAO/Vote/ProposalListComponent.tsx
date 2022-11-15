import { Trans } from '@lingui/macro'
import { lighten } from 'polished'
import React, { useMemo, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import ForumIcon from 'components/Icons/ForumIcon'
import History from 'components/Icons/History'
import Loader from 'components/Loader'
import { RowBetween, RowFit } from 'components/Row'
import { useVotingInfo } from 'hooks/kyberdao'
import { ProposalDetail } from 'hooks/kyberdao/types'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useToggleModal } from 'state/application/hooks'

import YourTransactionsModal from '../StakeKNC/YourTransactionsModal'
import ProposalItem from './ProposalItem'
import SearchProposal from './SearchProposal'
import SelectProposalStatus from './SelectProposalStatus'
import VoteConfirmModal from './VoteConfirmModal'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
  margin-top: 10px;
`

const TextButton = styled.a`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  cursor: pointer;
  ${({ theme }) => css`
    color: ${theme.subText};
    :hover {
      color: ${lighten(0.2, theme.primary)} !important;
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

function ProposalListComponent() {
  const theme = useTheme()
  const { proposals } = useVotingInfo()
  const [status, setStatus] = useState<string | undefined>()
  const [search, setSearch] = useState<string | undefined>()
  const filteredProposals = useMemo(
    () =>
      [
        {
          proposal_id: 13,
          proposal_type: 'BinaryProposal',
          start_timestamp: 1652166600,
          end_timestamp: 1668917822,
          execution_timestamp: 1652588089,
          executor: '0x41f5D722e6471c338392884088bD03340f50b3b5',
          executor_grace_period: 345600,
          executor_vote_differential: '1',
          executor_minimum_quorum: '400',
          max_voting_power: '198281381848103231744926452',
          options: ['YES', 'NO'],
          link: 'https://github.com/KyberNetwork/KIPs/blob/master/KIPs/kip-20.md',
          title: 'KIP:20 KNC Ecosystem Fund Allocation',
          desc: '<p>- We strongly believe that we can effectively utilize the remaining KNC in the ecosystem growth fund to drive adoption for KyberSwap.com and the KNC token itself. Burning KNC would only result in a short-term supply shock but does not support long-term value accrual.</p>\\n<p>- On the other hand, effective utilization of KNC in upcoming initiatives could potentially result in more users, volume, and fees for LPs and KyberDAO voters. This would also increase the number of KNC holders who help expand the Kyber ecosystem, with the ability to stake KNC and vote.</p>\\n<p>- KNC plays a valuable and central role in the Kyber ecosystem. KNC holders not only own a useful asset, but also a stake in DeFi’s liquidity infrastructure. We want to work closely with the community to ensure that KNC is utilized in the most efficient and impactful way possible and enhance its long-term value.',
          opts_desc: ['YES', 'NO'],
          cancelled: false,
          status: 'Active',
          vote_stats: {
            total_vote_count: 28627348.577516407,
            total_address_count: 19,
            options: [
              {
                option: 0,
                vote_count: 28510491.577516407,
              },
              {
                option: 1,
                vote_count: 116857,
              },
            ],
            votes: [],
          },
        } as ProposalDetail,
      ].concat(
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
          .sort((a, b) => b.proposal_id - a.proposal_id) || [],
      ),
    [proposals, status, search],
  )
  const toggleYourTransactions = useToggleModal(ApplicationModal.YOUR_TRANSACTIONS_STAKE_KNC)

  return (
    <Wrapper>
      <RowBetween marginBottom={'10px'}>
        <Flex>
          <Text color={theme.primary} fontSize={20}>
            <Trans>KIPs</Trans>
          </Text>
        </Flex>
        <Flex style={{ gap: '30px' }}>
          <HistoryButton onClick={toggleYourTransactions}>
            <History />
            <Text fontSize={14} hidden={isMobile}>
              {' '}
              <Trans>History</Trans>
            </Text>
          </HistoryButton>
          <TextButton href="https://gov.kyber.org/" target="_blank" rel="noreferrer">
            <ForumIcon />{' '}
            <Text hidden={isMobile}>
              <Trans>Forum</Trans>
            </Text>
          </TextButton>
        </Flex>
      </RowBetween>
      <RowBetween>
        <SelectProposalStatus status={status} setStatus={setStatus} />
        <SearchProposal search={search} setSearch={setSearch} />
      </RowBetween>
      {filteredProposals ? (
        filteredProposals.map((p: ProposalDetail, index: number) => {
          return (
            <ProposalItem
              key={p.proposal_id.toString()}
              proposal={p}
              showByDefault={index === 0}
              onBadgeClick={setStatus}
            />
          )
        })
      ) : (
        <Loader />
      )}
      <YourTransactionsModal />
    </Wrapper>
  )
}

export default React.memo(ProposalListComponent)
