import { Trans } from '@lingui/macro'
import React, { useMemo, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Info } from 'react-feather'

import FAQIcon from 'components/Icons/FAQIcon'
import ForumIcon from 'components/Icons/ForumIcon'
import History from 'components/Icons/History'
import AnimateLoader from 'components/Loader/AnimatedLoader'
import { RowBetween, RowFit } from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import { useVotingInfo } from 'hooks/kyberdao'
import { ProposalDetail, ProposalStatus } from 'hooks/kyberdao/types'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useToggleModal } from 'state/application/hooks'

import YourTransactionsModal from '../StakeKNC/YourTransactionsModal'
import ProposalItem from './ProposalItem'
import SearchProposal from './SearchProposal'
import SelectProposalStatus from './SelectProposalStatus'

const TEXT_BUTTON_CLASS = 'flex cursor-pointer items-center gap-1 text-sm text-subText hover:!brightness-125'

function ProposalListComponent({
  voteCallback,
}: {
  voteCallback?: (proposal_id: number, option: number) => Promise<boolean>
}) {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
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
            return p.title.toLowerCase().includes(search.toLowerCase())
          }
          return true
        })
        .sort((a, b) => b.proposal_id - a.proposal_id)
        .sort((a, b) => {
          if (a.status === ProposalStatus.Active) return -1
          if (b.status === ProposalStatus.Active) return 1
          return 0
        }) || [],
    [proposals, status, search],
  )
  const toggleYourTransactions = useToggleModal(ApplicationModal.YOUR_TRANSACTIONS_STAKE_KNC)

  return (
    <div className="mt-2.5 flex flex-col items-stretch gap-3">
      <RowBetween marginBottom={'10px'}>
        <div className="flex">
          <span className="text-xl text-primary">
            <Trans>KIPs</Trans>
          </span>
        </div>
        <div className="flex gap-[30px]">
          {account && (
            <RowFit onClick={toggleYourTransactions} className={`${TEXT_BUTTON_CLASS} justify-end`}>
              <History />
              <span className="text-sm" hidden={isMobile}>
                {' '}
                <Trans>History</Trans>
              </span>
            </RowFit>
          )}
          <a href="https://gov.kyber.org/" target="_blank" rel="noreferrer" className={TEXT_BUTTON_CLASS}>
            <ForumIcon />{' '}
            <span hidden={isMobile}>
              <Trans>Forum</Trans>
            </span>
          </a>
          <a
            href="https://docs.kyberswap.com/kyber-dao/kyber-dao-introduction"
            target="_blank"
            rel="noreferrer"
            className={TEXT_BUTTON_CLASS}
          >
            <FAQIcon />
            <span hidden={isMobile}>
              <Trans>FAQ</Trans>
            </span>
          </a>
        </div>
      </RowBetween>
      <RowBetween>
        <SelectProposalStatus status={status} setStatus={setStatus} />
        <SearchProposal search={search} setSearch={setSearch} />
      </RowBetween>
      {proposals ? (
        filteredProposals.length > 0 ? (
          filteredProposals.map((p: ProposalDetail, index: number) => {
            return (
              <ProposalItem
                key={p.proposal_id.toString()}
                proposal={p}
                showByDefault={index === 0}
                onBadgeClick={setStatus}
                voteCallback={voteCallback}
              />
            )
          })
        ) : (
          <div className="flex h-[200px] flex-col items-center justify-center gap-3 text-subText">
            <Info size={24} color={theme.subText} />
            <span className="text-subText">
              <Trans>No proposal found</Trans>
            </span>
          </div>
        )
      ) : (
        <div className="flex h-[200px] flex-col items-center justify-center gap-3 text-subText">
          <AnimateLoader />
        </div>
      )}
      <YourTransactionsModal />
    </div>
  )
}

export default React.memo(ProposalListComponent)
