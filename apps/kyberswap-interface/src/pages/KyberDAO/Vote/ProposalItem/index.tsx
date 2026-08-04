import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'react-feather'

import { ButtonLight, ButtonPrimary } from 'components/Button'
import LaunchIcon from 'components/Icons/LaunchIcon'
import { RowBetween } from 'components/Row'
import { Center, HStack, Stack } from 'components/Stack'
import { useActiveWeb3React } from 'hooks'
import { useVotingInfo } from 'hooks/kyberdao'
import { ProposalDetail, ProposalStatus, ProposalType } from 'hooks/kyberdao/types'
import useTheme from 'hooks/useTheme'
import { useSwitchToEthereum } from 'pages/KyberDAO/StakeKNC/SwitchToEthereumModal'
import TimerCountdown from 'pages/KyberDAO/TimerCountdown'
import OptionButton from 'pages/KyberDAO/Vote/ProposalItem/OptionButton'
import Participants from 'pages/KyberDAO/Vote/ProposalItem/Participants'
import VoteInformation from 'pages/KyberDAO/Vote/ProposalItem/VoteInformation'
import VoteConfirmModal from 'pages/KyberDAO/Vote/VoteConfirmModal'
import { HARDCODED_OPTION_TITLE } from 'pages/KyberDAO/constants'
import { useWalletModalToggle } from 'state/application/hooks'
import { cn } from 'utils/cn'
import { hexAlpha } from 'utils/colorAlpha'
import { escapeScriptHtml } from 'utils/string'

const Badge = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex h-5 items-center justify-center rounded-lg px-3 py-1 text-xs', className)} {...props} />
)

const StatusBadged = ({ color, className, ...rest }: React.HTMLAttributes<HTMLDivElement> & { color?: string }) => (
  <Badge
    className={cn('cursor-pointer hover:brightness-75', !color && 'bg-buttonBlack text-subText', className)}
    style={color ? { color, backgroundColor: hexAlpha(color, 0.2) } : undefined}
    {...rest}
  />
)

const IDBadged = ({ children }: { children: React.ReactNode }) => (
  <Badge className="bg-buttonBlack text-subText">{children}</Badge>
)

const VoteButton = ({
  status,
  onVoteClick,
  errorMessage,
  voted,
}: {
  status: string
  onVoteClick: () => void
  errorMessage: string | null
  voted: boolean
}) => {
  const { account } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const onLoad = useRef(true)
  useEffect(() => {
    const timeout = setTimeout(() => {
      onLoad.current = false
    }, 1500)
    return () => {
      clearTimeout(timeout)
    }
  }, [])

  return (
    <>
      {status === ProposalStatus.Active ? (
        account ? (
          <div className="w-full sm:w-52">
            <ButtonPrimary
              width="100%"
              fontWeight={500}
              fontSize="14px"
              onClick={onVoteClick}
              disabled={onLoad.current || !!errorMessage}
            >
              {errorMessage && !onLoad.current ? (
                errorMessage
              ) : voted ? (
                <Trans>Update Vote</Trans>
              ) : (
                <Trans>Vote now</Trans>
              )}
            </ButtonPrimary>
          </div>
        ) : (
          <div className="w-full sm:w-52">
            <ButtonLight width="100%" onClick={toggleWalletModal}>
              <Trans>Connect</Trans>
            </ButtonLight>
          </div>
        )
      ) : (
        <></>
      )}
    </>
  )
}

const FORCED_TO_BINARY_OPTION_PROPOSALS = [14, 15, 17, 18, 19, 20, 22]

function ProposalItem({
  proposal,
  onBadgeClick,
  voteCallback,
}: {
  proposal: ProposalDetail
  onBadgeClick?: (name: string) => void
  voteCallback?: (proposal_id: number, option: number) => Promise<boolean>
}) {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const { votesInfo, stakerInfo } = useVotingInfo()
  const totalVotePowerAmount = stakerInfo
    ? (stakerInfo.delegate.toLowerCase() === account?.toLowerCase() ? stakerInfo.stake_amount : 0) +
      stakerInfo.delegated_stake_amount
    : 0

  const isDelegated = !!stakerInfo && stakerInfo.delegate.toLowerCase() !== account?.toLowerCase()

  const [show, setShow] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState<number[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  useEffect(() => {
    if (isDelegated) {
      setErrorMessage(t`You already delegated your Voting power`)
    } else if (!totalVotePowerAmount) {
      setErrorMessage(t`You dont have Voting power`)
    } else if (selectedOptions?.length === 0) {
      setErrorMessage(t`Not selected option`)
    } else {
      setErrorMessage(null)
    }
  }, [selectedOptions.length, stakerInfo?.stake_amount, isDelegated, totalVotePowerAmount])

  const tagColor = () => {
    switch (proposal.status) {
      case ProposalStatus.Pending:
        return theme.warning
      case ProposalStatus.Active:
        return theme.blue
      case ProposalStatus.Approved:
      case ProposalStatus.Executed:
        return theme.primary
      case ProposalStatus.Canceled:
      case ProposalStatus.Failed:
        return theme.red
      default:
        return theme.blue
    }
  }
  const { switchToEthereum } = useSwitchToEthereum()
  const handleVote = useCallback(() => {
    switchToEthereum(t`This action`)
      .then(() => {
        if (selectedOptions.length > 0) setShowConfirmModal(true)
      })
      .catch(() => undefined)
  }, [switchToEthereum, setShowConfirmModal, selectedOptions])

  const handleVoteConfirm = useCallback(() => {
    setShowConfirmModal(false)
    selectedOptions.length > 0 &&
      voteCallback?.(
        proposal.proposal_id,
        selectedOptions.map(i => i + 1).reduce((acc, item) => (acc += 1 << (item - 1)), 0),
      )
        .then(() => {
          setSelectedOptions([])
        })
        .catch(error => {
          setErrorMessage(error.message)
        })
  }, [selectedOptions, proposal.proposal_id, voteCallback])

  const votedOfCurrentProposal = useMemo(
    () => votesInfo?.find(v => v.proposal_id === proposal.proposal_id),
    [votesInfo, proposal.proposal_id],
  )

  useEffect(() => {
    setSelectedOptions([])
  }, [votedOfCurrentProposal])

  // Proposals is Generic but force to be Binary option
  const isForcedBinaryOption = FORCED_TO_BINARY_OPTION_PROPOSALS.includes(proposal.proposal_id)

  const handleOptionClick = useCallback(
    (option: number) => {
      if (proposal.proposal_type === ProposalType.BinaryProposal || isForcedBinaryOption) {
        setSelectedOptions([option])
      } else if (proposal.proposal_type === ProposalType.GenericProposal) {
        if (selectedOptions.length === 0) {
          setSelectedOptions([option])
        } else {
          const newOptions: number[] = [...selectedOptions]
          const index = newOptions.indexOf(option)
          if (index !== -1) {
            newOptions.splice(index, index + 1)
          } else {
            newOptions.push(option)
          }
          setSelectedOptions(newOptions)
        }
      }
    },
    [proposal.proposal_type, setSelectedOptions, selectedOptions, isForcedBinaryOption],
  )
  const isActive = proposal.status === ProposalStatus.Active

  const renderVotes = useMemo(() => {
    const manyOptions = proposal.options.length > 2
    return (
      <div className={cn('grid grid-cols-1 gap-4', manyOptions ? 'sm:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2')}>
        {proposal.options.map((option: string, index: number) => {
          const voted = votedOfCurrentProposal?.options?.includes(index) || false
          const voteStat = proposal?.vote_stats?.options?.find(o => o.option === index)
          return (
            <OptionButton
              disabled={!isActive}
              key={option}
              percent={voteStat ? (voteStat.vote_count / proposal.vote_stats.total_vote_count) * 100 : 0}
              title={option}
              checked={selectedOptions?.includes(index) || voted}
              onOptionClick={() => handleOptionClick(index)}
              type={
                proposal.status === ProposalStatus.Pending
                  ? 'Pending'
                  : selectedOptions?.includes(index)
                  ? 'Choosing'
                  : voted
                  ? 'Active'
                  : 'Finished'
              }
              isCheckBox={proposal.proposal_type === ProposalType.GenericProposal && !isForcedBinaryOption}
              proposalId={proposal.proposal_id}
              id={index}
            />
          )
        })}
      </div>
    )
  }, [proposal, selectedOptions, votedOfCurrentProposal?.options, handleOptionClick, isActive, isForcedBinaryOption])

  return (
    <Stack
      className="gap-4 overflow-hidden rounded-2xl bg-background p-4 shadow-[0px_2px_34px_rgba(0,0,0,0.0467931)] sm:p-6"
      style={{ contentVisibility: 'auto', containIntrinsicSize: '60px' } as React.CSSProperties}
    >
      <Stack className="z-[1] gap-4 bg-background">
        <RowBetween>
          <span>{proposal.title}</span>
          <Center
            className="size-6 cursor-pointer rounded-full bg-subText-20 text-subText hover:bg-subText-40"
            onClick={() => setShow(v => !v)}
          >
            <ChevronDown
              size={20}
              style={{ transition: 'all 0.2s ease', transform: show ? 'rotate(180deg)' : undefined }}
            />
          </Center>
        </RowBetween>

        <HStack className="items-center justify-between gap-4 max-sm:flex-col max-sm:items-start">
          <HStack className="flex-wrap gap-2">
            <StatusBadged color={tagColor()} onClick={() => onBadgeClick?.(proposal.status)}>
              {proposal.status}
            </StatusBadged>
            <IDBadged>ID #{proposal.proposal_id}</IDBadged>
          </HStack>
          {isActive && (
            <HStack className="shrink-0 items-center gap-2">
              <span className="text-xs text-subText">
                <Trans>Voting ends in: </Trans>
              </span>
              <TimerCountdown endTime={proposal.end_timestamp} />
            </HStack>
          )}
        </HStack>

        {(show || isActive) && renderVotes}

        <HStack className="items-center justify-between gap-4 max-sm:flex-col max-sm:items-start">
          {isActive ? (
            <VoteButton
              status={proposal.status}
              onVoteClick={handleVote}
              errorMessage={errorMessage}
              voted={!!votedOfCurrentProposal?.options && votedOfCurrentProposal.options.length > 0}
            />
          ) : proposal.status === ProposalStatus.Pending ? (
            <HStack className="items-center gap-2">
              <span className="text-xs text-subText">
                <Trans>Voting starts in: </Trans>
              </span>
              <TimerCountdown endTime={proposal.start_timestamp} />
            </HStack>
          ) : (
            <span className="text-xs text-subText">
              Ended {dayjs(proposal.end_timestamp * 1000).format('DD MMM YYYY')}
            </span>
          )}
        </HStack>
      </Stack>

      {show && (
        <Stack className="z-0 gap-8 pt-4 transition-all duration-200">
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_368px]">
            <Stack className="gap-4">
              {proposal?.link && proposal.link !== '0x0' && (
                <a
                  href={proposal.link?.startsWith('http') ? proposal.link : 'http://' + proposal.link}
                  className="flex w-fit items-center gap-2 text-sm"
                  target="_blank"
                  rel="noreferrer"
                >
                  <LaunchIcon size={14} />
                  <span>
                    <Trans>Github</Trans>
                  </span>
                </a>
              )}
              <p
                className="break-words text-base text-subText"
                dangerouslySetInnerHTML={{
                  __html: escapeScriptHtml(proposal.desc.replaceAll('\\n', '').replaceAll('\\r', '')),
                }}
              />
            </Stack>
            <VoteInformation proposal={proposal} />
          </div>
          <Participants proposalId={proposal.proposal_id} />
        </Stack>
      )}
      {proposal.status === ProposalStatus.Active && (
        <VoteConfirmModal
          isShow={showConfirmModal}
          title={proposal.title}
          toggle={() => setShowConfirmModal(false)}
          options={
            selectedOptions.length > 0
              ? selectedOptions
                  .map(option => HARDCODED_OPTION_TITLE[proposal.proposal_id]?.[option] || proposal.options[option])
                  .join(', ')
              : ''
          }
          onVoteConfirm={handleVoteConfirm}
        />
      )}
    </Stack>
  )
}
export default React.memo(ProposalItem)
