import { Trans } from '@lingui/macro'
import dayjs from 'dayjs'
import { transparentize } from 'polished'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { ChevronDown } from 'react-feather'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ButtonLight, ButtonPrimary } from 'components/Button'
import LaunchIcon from 'components/Icons/LaunchIcon'
import Row, { RowBetween, RowFit, RowFixed } from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import { useVotingInfo } from 'hooks/kyberdao'
import { ProposalDetail, ProposalStatus, ProposalType } from 'hooks/kyberdao/types'
import useTheme from 'hooks/useTheme'
import { useSwitchToEthereum } from 'pages/KyberDAO/StakeKNC/SwitchToEthereumModal'
import { ApplicationModal } from 'state/application/actions'
import { useToggleModal, useWalletModalToggle } from 'state/application/hooks'
import { ExternalLink } from 'theme'

import VoteConfirmModal from '../VoteConfirmModal'
import OptionButton from './OptionButton'
import Participants from './Participants'
import VoteInformation from './VoteInformation'

const ProposalItemWrapper = styled.div`
  padding: ${isMobile ? '16px' : '20px 24px'};
  border-radius: 20px;
  box-shadow: 0px 2px 34px rgba(0, 0, 0, 0.0467931);
  overflow: hidden;
  ${({ theme }) => css`
    background-color: ${theme.background};
  `}
`

const ProposalHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${isMobile ? '16px' : '20px'};
  z-index: 1;
  & > *:first-child {
    cursor: pointer;
  }
  ${({ theme }) => css`
    background-color: ${theme.background};
  `}
`

const ExpandButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
  ${({ theme }) => css`
    color: ${theme.subText};
    background-color: ${transparentize(0.8, theme.subText)};
  `}
`
const Badged = css`
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
`
const IDBadged = styled.div`
  ${Badged}
  font-size: 12px;
  padding: 2px 14px;
  color: ${({ theme }) => theme.subText};
  background-color: ${({ theme }) => theme.buttonBlack};
`

const StatusBadged = styled.div<{ status?: string }>`
  ${Badged}
  font-size: 12px;
  padding: 2px 14px;
  cursor: pointer;

  ${({ status, theme }) => {
    if (status === 'pending')
      return css`
        color: ${theme.blue};
        background-color: ${transparentize(0.8, theme.blue)};
        :hover {
          background-color: ${transparentize(0.7, theme.blue)};
        }
      `
    if (status === 'error')
      return css`
        color: ${theme.red};
        background-color: ${transparentize(0.8, theme.red)};
        :hover {
          background-color: ${transparentize(0.7, theme.red)};
        }
      `
    if (status === 'success')
      return css`
        color: ${theme.primary};
        background-color: ${transparentize(0.8, theme.primary)};
        :hover {
          background-color: ${transparentize(0.7, theme.primary)};
        }
      `
    return css`
      color: ${theme.subText};
      background-color: ${theme.buttonBlack};
    `
  }}
`

const Content = styled.div<{ show?: boolean }>`
  gap: 24px;
  padding: 24px 0;
  transition: all 0.2s ease;
  z-index: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  ${({ show }) =>
    show
      ? css`
          opacity: 1;
          max-height: 'max-content';
        `
      : css`
          opacity: 0;
          padding: 0;
          max-height: 0;
        `}
`

const OptionsWrapper = styled(RowBetween)<{ optionCount?: number }>`
  ${({ optionCount, theme }) => {
    if (optionCount && optionCount > 2) {
      return css`
        flex-wrap: wrap;
        justify-content: flex-start;
        > * {
          width: calc(25% - 20px * 3 / 4);
        }
        ${theme.mediaWidth.upToMedium`
          > * {
            width: calc(50% - 20px / 2);
          }
        `}
        ${theme.mediaWidth.upToSmall`
          > * {
            width: 100%;
          }
        `}
      `
    }

    return ''
  }}
`

const VoteButton = ({
  status,
  onVoteClick,
  errorMessage,
}: {
  status: string
  onVoteClick: () => void
  errorMessage: string | null
}) => {
  const { account } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()

  return (
    <>
      {status === ProposalStatus.Active ? (
        account ? (
          <ButtonPrimary
            width={isMobile ? '100%' : '200px'}
            fontWeight={500}
            fontSize="14px"
            onClick={onVoteClick}
            disabled={!!errorMessage}
          >
            {errorMessage ? errorMessage : <Trans>Vote now</Trans>}
          </ButtonPrimary>
        ) : (
          <ButtonLight width={isMobile ? '100%' : '200px'} onClick={toggleWalletModal}>
            <Trans>Connect Wallet</Trans>
          </ButtonLight>
        )
      ) : (
        <></>
      )}
    </>
  )
}

export default function ProposalItem({
  proposal,
  showByDefault,
  onBadgeClick,
  voteCallback,
}: {
  proposal: ProposalDetail
  showByDefault?: boolean
  onBadgeClick?: (name: string) => void
  voteCallback?: (proposal_id: number, option: number) => void
}) {
  const theme = useTheme()
  const { votesInfo, stakerInfo } = useVotingInfo()

  const [show, setShow] = useState(!!showByDefault)
  const [selectedOptions, setSelectedOptions] = useState<number[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (selectedOptions.length === 0) {
      setErrorMessage('Not selected option')
    }
    if (!stakerInfo?.stake_amount) {
      setErrorMessage('You dont have voting power')
    } else {
      setErrorMessage(null)
    }
  }, [selectedOptions.length, stakerInfo?.stake_amount])

  const contentRef = useRef<any>()
  const statusType = () => {
    switch (proposal.status) {
      case ProposalStatus.Pending:
        return 'pending'
      case ProposalStatus.Canceled:
      case ProposalStatus.Failed:
        return 'error'
      case ProposalStatus.Executed:
      case ProposalStatus.Succeeded:
      case ProposalStatus.Finalized:
        return 'success'
      default:
        return 'pending'
    }
  }
  const toggleVoteModal = useToggleModal(ApplicationModal.KYBER_DAO_VOTE)
  const { switchToEthereum } = useSwitchToEthereum()
  const handleVote = useCallback(() => {
    switchToEthereum().then(() => {
      selectedOptions.length > 0 && toggleVoteModal()
    })
  }, [switchToEthereum, toggleVoteModal, selectedOptions])

  const handleVoteConfirm = useCallback(() => {
    toggleVoteModal()
    selectedOptions.length > 0 &&
      voteCallback?.(
        proposal.proposal_id,
        selectedOptions.map(i => i + 1).reduce((acc, item) => (acc += 1 << (item - 1)), 0),
      )
  }, [selectedOptions, proposal.proposal_id, voteCallback, toggleVoteModal])

  const votedOfCurrentProposal = useMemo(
    () => votesInfo?.find(v => v.proposal_id === proposal.proposal_id),
    [votesInfo, proposal.proposal_id],
  )

  const handleOptionClick = useCallback(
    (option: number) => {
      if (proposal.proposal_type === ProposalType.BinaryProposal) {
        setSelectedOptions([option])
      }
      if (proposal.proposal_type === ProposalType.GenericProposal) {
        if (selectedOptions.length === 0) {
          setSelectedOptions([option])
        } else {
          const newOptions: number[] = [...selectedOptions] || []
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
    [proposal.proposal_type, setSelectedOptions, selectedOptions],
  )
  const isActive = proposal.status === ProposalStatus.Active

  const renderVotes = useMemo(() => {
    return (
      <OptionsWrapper
        gap={isMobile ? '16px' : '20px'}
        flexDirection={isMobile ? 'column' : 'row'}
        optionCount={proposal.options.length}
      >
        {proposal.options.map((option: string, index: number) => {
          const voted = votedOfCurrentProposal?.options?.includes(index) || false
          return (
            <OptionButton
              disabled={!isActive}
              key={option}
              percent={
                proposal?.vote_stats?.options?.[index]
                  ? (proposal.vote_stats.options[index]?.vote_count / proposal.vote_stats.total_vote_count) * 100
                  : 0
              }
              title={option}
              checked={selectedOptions?.includes(index) || voted}
              onOptionClick={() => handleOptionClick(index)}
              type={selectedOptions?.includes(index) ? 'Choosing' : voted ? 'Active' : 'Finished'}
              isCheckBox={proposal.proposal_type === ProposalType.GenericProposal}
            />
          )
        })}
      </OptionsWrapper>
    )
  }, [proposal, selectedOptions, votedOfCurrentProposal?.options, handleOptionClick, isActive])

  return (
    <ProposalItemWrapper>
      <ProposalHeader>
        <RowBetween onClick={() => setShow(s => !s)}>
          <Text>
            <Trans>{proposal.title}</Trans>
          </Text>
          <ExpandButton>
            <ChevronDown
              size={24}
              style={{ transition: 'all 0.2s ease', transform: show ? 'rotate(180deg)' : undefined }}
            />
          </ExpandButton>
        </RowBetween>
        {(show || isActive) && isMobile && (
          <RowFit gap="8px">
            <StatusBadged status={statusType()} onClick={() => onBadgeClick?.(proposal.status)}>
              {proposal.status}
            </StatusBadged>
            <IDBadged>ID #{proposal.proposal_id}</IDBadged>
          </RowFit>
        )}
        {(show || isActive) && renderVotes}
        <RowBetween>
          {isActive ? (
            <VoteButton status={proposal.status} onVoteClick={handleVote} errorMessage={errorMessage} />
          ) : (
            <Text color={theme.subText} fontSize={12}>
              Ended {dayjs(proposal.end_timestamp * 1000).format('DD MMM YYYY')}
            </Text>
          )}
          {!((show || isActive) && isMobile) && (
            <RowFixed gap="8px">
              <StatusBadged status={statusType()} onClick={() => onBadgeClick?.(proposal.status)}>
                {proposal.status}
              </StatusBadged>
              <IDBadged>ID #{proposal.proposal_id}</IDBadged>
            </RowFixed>
          )}
        </RowBetween>
      </ProposalHeader>
      <Content ref={contentRef as any} show={show}>
        <Row align="flex-start" gap="16px">
          <div style={{ flex: 1 }}>
            <ExternalLink href={proposal.link} style={{ marginBottom: '12px', width: 'fit-content' }}>
              <RowFit gap="4px">
                <LaunchIcon size={14} />
                <Text fontSize={14}>
                  <Trans>Github</Trans>
                </Text>
              </RowFit>
            </ExternalLink>
            <Text
              fontSize={isMobile ? 14 : 16}
              lineHeight={isMobile ? '18px' : '22px'}
              color={theme.subText}
              marginBottom="20px"
              dangerouslySetInnerHTML={{ __html: proposal.desc.replaceAll('\\n', '').replaceAll('\\r', '') }}
              style={{ wordBreak: 'break-word' }}
            ></Text>
            {isMobile && <VoteInformation proposal={proposal} />}
          </div>
          {!isMobile && (
            <div style={{ width: '368px' }}>
              <VoteInformation proposal={proposal} />
            </div>
          )}
        </Row>
        <Participants proposalId={show ? proposal.proposal_id : undefined} />
      </Content>
      {proposal.status === ProposalStatus.Active && (
        <VoteConfirmModal
          options={selectedOptions.length > 0 ? selectedOptions.map(option => proposal.options[option]).join(', ') : ''}
          onVoteConfirm={handleVoteConfirm}
        />
      )}
    </ProposalItemWrapper>
  )
}
