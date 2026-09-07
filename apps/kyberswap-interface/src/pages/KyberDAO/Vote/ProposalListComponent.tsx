import { Trans } from '@lingui/macro'
import React, { useMemo, useState } from 'react'
import { Info } from 'react-feather'

import FAQIcon from 'components/Icons/FAQIcon'
import ForumIcon from 'components/Icons/ForumIcon'
import History from 'components/Icons/History'
import AnimateLoader from 'components/Loader/AnimatedLoader'
import { Center, HStack, Stack } from 'components/Stack'
import { useActiveWeb3React } from 'hooks'
import { useVotingInfo } from 'hooks/kyberdao'
import { ProposalDetail, ProposalStatus } from 'hooks/kyberdao/types'
import YourTransactionsModal from 'pages/KyberDAO/StakeKNC/YourTransactionsModal'
import ProposalItem from 'pages/KyberDAO/Vote/ProposalItem'
import SearchProposal from 'pages/KyberDAO/Vote/SearchProposal'
import SelectProposalStatus from 'pages/KyberDAO/Vote/SelectProposalStatus'
import { KyberDAOSectionTitle } from 'pages/KyberDAO/common'
import { ApplicationModal } from 'state/application/actions'
import { useToggleModal } from 'state/application/hooks'

function ProposalListComponent({
  voteCallback,
}: {
  voteCallback?: (proposal_id: number, option: number) => Promise<boolean>
}) {
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
    <Stack className="items-stretch gap-4">
      <HStack className="items-center justify-between gap-4">
        <KyberDAOSectionTitle className="text-primary">
          <Trans>KIPs</Trans>
        </KyberDAOSectionTitle>
        <HStack className="gap-8">
          {account && (
            <button
              onClick={toggleYourTransactions}
              className="flex cursor-pointer items-center gap-2 border-none bg-transparent text-sm text-subText hover:brightness-125"
            >
              <History />
              <span className="max-sm:hidden">
                <Trans>History</Trans>
              </span>
            </button>
          )}
          <a
            href="https://gov.kyber.org/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-sm text-subText hover:brightness-125"
          >
            <ForumIcon />
            <span className="max-sm:hidden">
              <Trans>Forum</Trans>
            </span>
          </a>
          <a
            href="https://docs.kyberswap.com/kyber-dao/kyber-dao-introduction"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-sm text-subText hover:brightness-125"
          >
            <FAQIcon />
            <span className="max-sm:hidden">
              <Trans>FAQ</Trans>
            </span>
          </a>
        </HStack>
      </HStack>
      <HStack className="items-center justify-between gap-4 max-sm:flex-col">
        <SelectProposalStatus status={status} setStatus={setStatus} />
        <SearchProposal search={search} setSearch={setSearch} />
      </HStack>
      {proposals ? (
        filteredProposals.length > 0 ? (
          filteredProposals.map((p: ProposalDetail) => {
            return (
              <ProposalItem
                key={p.proposal_id.toString()}
                proposal={p}
                onBadgeClick={setStatus}
                voteCallback={voteCallback}
              />
            )
          })
        ) : (
          <Center className="h-52 gap-4 text-subText">
            <Info size={24} className="text-subText" />
            <span className="text-subText">
              <Trans>No proposal found</Trans>
            </span>
          </Center>
        )
      ) : (
        <Center className="h-52 gap-4 text-subText">
          <AnimateLoader />
        </Center>
      )}
      <YourTransactionsModal />
    </Stack>
  )
}

export default React.memo(ProposalListComponent)
