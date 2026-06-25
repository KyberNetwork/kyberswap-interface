import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { ChevronDown } from 'react-feather'

import { ButtonLight, ButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import LaunchIcon from 'components/Icons/LaunchIcon'
import Row, { RowBetween, RowFit } from 'components/Row'
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

const BADGE_BASE = 'flex h-5 items-center justify-center rounded-[10px] px-3.5 py-0.5 text-xs'

const StatusBadged = ({ color, className, ...rest }: React.HTMLAttributes<HTMLDivElement> & { color?: string }) => (
  <div
    className={cn(BADGE_BASE, 'cursor-pointer hover:brightness-75', !color && 'bg-buttonBlack text-subText', className)}
    style={color ? { color, backgroundColor: hexAlpha(color, 0.2) } : undefined}
    {...rest}
  />
)

const IDBadged = ({ children }: { children: React.ReactNode }) => (
  <div className={cn(BADGE_BASE, 'bg-buttonBlack text-subText')}>{children}</div>
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
          <ButtonPrimary
            width={isMobile ? '100%' : 'fit-content'}
            minWidth={'200px'}
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
        ) : (
          <ButtonLight width={isMobile ? '100%' : '200px'} onClick={toggleWalletModal}>
            <Trans>Connect</Trans>
          </ButtonLight>
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
  showByDefault,
  onBadgeClick,
  voteCallback,
}: {
  proposal: ProposalDetail
  showByDefault?: boolean
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

  const [show, setShow] = useState(!!showByDefault)
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

  const contentRef = useRef<any>(null)
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
    switchToEthereum(t`This action`).then(() => {
      selectedOptions.length > 0 && setShowConfirmModal(true)
    })
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
      <RowBetween
        className={cn(
          isMobile ? 'flex-col gap-4' : 'flex-row gap-5',
          manyOptions &&
            'flex-wrap !justify-start [&>*]:w-[calc(33.33%-40px/3)] [&>*]:max-md:w-[calc(50%-10px)] [&>*]:max-sm:w-full',
        )}
      >
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
      </RowBetween>
    )
  }, [proposal, selectedOptions, votedOfCurrentProposal?.options, handleOptionClick, isActive, isForcedBinaryOption])

  return (
    <div
      className={cn(
        'overflow-hidden rounded-[20px] bg-background shadow-[0px_2px_34px_rgba(0,0,0,0.0467931)]',
        isMobile ? 'p-4' : 'px-6 py-5',
      )}
      style={{ contentVisibility: 'auto', containIntrinsicSize: '60px' } as React.CSSProperties}
    >
      <div
        className={cn(
          'z-[1] flex flex-col bg-background [&>*:first-child]:cursor-pointer',
          isMobile ? 'gap-4' : 'gap-5',
        )}
      >
        <RowBetween onClick={() => setShow(s => !s)}>
          <span>{proposal.title}</span>
          <div className="flex cursor-pointer items-center justify-center rounded-full bg-subText-20 text-subText">
            <ChevronDown
              size={24}
              style={{ transition: 'all 0.2s ease', transform: show ? 'rotate(180deg)' : undefined }}
            />
          </div>
        </RowBetween>
        {(show || isActive) && isMobile && (
          <RowBetween>
            <RowFit className="flex-wrap gap-2">
              <StatusBadged color={tagColor()} onClick={() => onBadgeClick?.(proposal.status)}>
                {proposal.status}
              </StatusBadged>
              <IDBadged>ID #{proposal.proposal_id}</IDBadged>
            </RowFit>
            {isActive && (
              <RowFit className="shrink-0 gap-1">
                <span className="text-xs text-subText">
                  <Trans>Voting ends in: </Trans>
                </span>
                <TimerCountdown endTime={proposal.end_timestamp} />
              </RowFit>
            )}
          </RowBetween>
        )}
        {(show || isActive) && renderVotes}
        <RowBetween>
          {isActive ? (
            <Column className="gap-1">
              <VoteButton
                status={proposal.status}
                onVoteClick={handleVote}
                errorMessage={errorMessage}
                voted={!!votedOfCurrentProposal?.options && votedOfCurrentProposal.options.length > 0}
              />
            </Column>
          ) : proposal.status === ProposalStatus.Pending ? (
            <RowFit className="gap-1">
              <span className="text-xs text-subText">
                <Trans>Voting starts in: </Trans>
              </span>
              <TimerCountdown endTime={proposal.start_timestamp} />
            </RowFit>
          ) : (
            <span className="text-xs text-subText">
              Ended {dayjs(proposal.end_timestamp * 1000).format('DD MMM YYYY')}
            </span>
          )}
          {!((show || isActive) && isMobile) && (
            <Column className="gap-2">
              <Row className="justify-end gap-2">
                <StatusBadged color={tagColor()} onClick={() => onBadgeClick?.(proposal.status)}>
                  {proposal.status}
                </StatusBadged>
                <IDBadged>ID #{proposal.proposal_id}</IDBadged>
              </Row>
              {isActive && (
                <Row className="gap-1">
                  <span className="text-xs text-subText">
                    <Trans>Voting ends in: </Trans>
                  </span>
                  <TimerCountdown endTime={proposal.end_timestamp} />
                </Row>
              )}
            </Column>
          )}
        </RowBetween>
      </div>
      {show && (
        <div ref={contentRef as any} className="z-0 flex flex-col gap-5 py-6 transition-all duration-200">
          <Row className="items-start gap-4">
            <div className="flex-1">
              {proposal?.link && proposal.link !== '0x0' && (
                <a
                  href={proposal.link?.startsWith('http') ? proposal.link : 'http://' + proposal.link}
                  className="mb-3 w-fit"
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="mr-1">
                    <LaunchIcon size={14} />
                  </span>
                  <span className="align-top text-sm">
                    <Trans>Github</Trans>
                  </span>
                </a>
              )}
              <p
                className={cn(
                  'mb-5 break-words text-subText',
                  isMobile ? 'text-sm leading-[18px]' : 'text-base leading-[22px]',
                )}
                dangerouslySetInnerHTML={{
                  __html: escapeScriptHtml(proposal.desc.replaceAll('\\n', '').replaceAll('\\r', '')),
                }}
              ></p>
              {isMobile && <VoteInformation proposal={proposal} />}
            </div>
            {!isMobile && (
              <div className="w-[368px]">
                <VoteInformation proposal={proposal} />
              </div>
            )}
          </Row>
          <Participants proposalId={proposal.proposal_id} />
        </div>
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
    </div>
  )
}
export default React.memo(ProposalItem)
