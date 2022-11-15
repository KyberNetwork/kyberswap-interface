import { Trans } from '@lingui/macro'
import dayjs from 'dayjs'
import { transparentize } from 'polished'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { ChevronDown } from 'react-feather'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ButtonLight, ButtonPrimary } from 'components/Button'
import LaunchIcon from 'components/Icons/LaunchIcon'
import { RowBetween, RowFit, RowFixed } from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import { ProposalDetail, ProposalStatus } from 'hooks/kyberdao/types'
import useTheme from 'hooks/useTheme'
import { useSwitchToEthereum } from 'pages/KyberDAO/StakeKNC/SwitchToEthereumModal'
import { ApplicationModal } from 'state/application/actions'
import { useToggleModal, useWalletModalToggle } from 'state/application/hooks'
import { ExternalLink } from 'theme'

import VoteConfirmModal from '../VoteConfirmModal'
import Participants from './Participants'
import VoteInformation from './VoteInformation'
import VoteProgress from './VoteProgress'

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

const VoteButton = ({ status, onVoteClick }: { status: string; onVoteClick: () => void }) => {
  const { account } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()

  return (
    <>
      {status === ProposalStatus.Active ? (
        account ? (
          <ButtonPrimary width={isMobile ? '100%' : '200px'} fontWeight={500} fontSize="14px" onClick={onVoteClick}>
            <Trans>Vote Now</Trans>
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
}: {
  proposal: ProposalDetail
  showByDefault?: boolean
  onBadgeClick?: (name: string) => void
}) {
  const theme = useTheme()
  const [show, setShow] = useState(!!showByDefault)
  const [selectedVote, setSelectedVote] = useState<string | undefined>()
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
        return 'success'
      default:
        return 'pending'
    }
  }
  const toggleVoteModal = useToggleModal(ApplicationModal.KYBER_DAO_VOTE)
  const { switchToEthereum } = useSwitchToEthereum()
  const handleVote = useCallback(() => {
    switchToEthereum().then(() => {
      console.log('🚀 ~ file: index.tsx ~ line 181 ~ switchToEthereum ~ selectedVote', selectedVote)
      selectedVote && toggleVoteModal()
    })
  }, [switchToEthereum, toggleVoteModal, selectedVote])

  const renderVotes = useMemo(() => {
    return (
      <RowBetween gap={isMobile ? '16px' : '20px'} flexDirection={isMobile ? 'column' : 'row'}>
        {proposal.options.map((option: string, index: number) => {
          return (
            <VoteProgress
              key={option}
              option={option}
              percent={
                proposal.vote_stats.options[index]
                  ? (proposal.vote_stats.options[index]?.vote_count / proposal.vote_stats.total_vote_count) * 100
                  : 0
              }
              title={option}
              checked={option === selectedVote}
              setVote={(o: string) => {
                o && setSelectedVote(o)
              }}
              type={
                proposal.status === ProposalStatus.Active
                  ? option === selectedVote
                    ? 'Choosing'
                    : 'Active'
                  : 'Finished'
              }
            />
          )
        })}
      </RowBetween>
    )
  }, [proposal, selectedVote])
  const isActive = proposal.status === ProposalStatus.Active
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
            <StatusBadged>ID #{proposal.proposal_id}</StatusBadged>
          </RowFit>
        )}
        {(show || isActive) && renderVotes}
        <RowBetween>
          {isActive ? (
            <VoteButton status={proposal.status} onVoteClick={handleVote} />
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
              <StatusBadged>ID #{proposal.proposal_id}</StatusBadged>
            </RowFixed>
          )}
        </RowBetween>
      </ProposalHeader>
      <Content ref={contentRef as any} show={show}>
        <div style={{ flex: 1 }}>
          <ExternalLink href={proposal.link} style={{ marginBottom: '12px' }}>
            <RowFit gap="2px">
              <Trans>Github</Trans>
              <LaunchIcon size={16} />
            </RowFit>
          </ExternalLink>
          <Text
            fontSize={isMobile ? 14 : 16}
            lineHeight={isMobile ? '18px' : '22px'}
            color={theme.subText}
            marginBottom="20px"
            dangerouslySetInnerHTML={{ __html: proposal.desc.replaceAll('\\n', '').replaceAll('\\r', '') }}
          ></Text>
          {isMobile && <VoteInformation proposal={proposal} />}
          <Participants proposalId={show ? proposal.proposal_id : undefined} />
        </div>
        {!isMobile && (
          <div style={{ width: '368px' }}>
            <VoteInformation proposal={proposal} />
          </div>
        )}
      </Content>
      {proposal.status === ProposalStatus.Active && <VoteConfirmModal option={selectedVote} />}
    </ProposalItemWrapper>
  )
}
