import { Trans, t } from '@lingui/macro'
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
import { useWalletModalToggle } from 'state/application/hooks'

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

  :hover {
    filter: brightness(0.8);
  }

  ${({ status, theme }) => {
    if (status === 'pending')
      return css`
        color: ${theme.warning};
        background-color: ${transparentize(0.8, theme.warning)};
      `
    if (status === 'error')
      return css`
        color: ${theme.red};
        background-color: ${transparentize(0.8, theme.red)};
      `
    if (status === 'success')
      return css`
        color: ${theme.primary};
        background-color: ${transparentize(0.8, theme.primary)};
      `
    if (status === 'active')
      return css`
        color: ${theme.blue};
        background-color: ${transparentize(0.8, theme.blue)};
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
  voted,
}: {
  status: string
  onVoteClick: () => void
  errorMessage: string | null
  voted: boolean
}) => {
  const { account } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()

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
            disabled={!!errorMessage}
          >
            {errorMessage ? errorMessage : voted ? <Trans>Update Vote</Trans> : <Trans>Vote now</Trans>}
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

function ProposalItem({
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

  const contentRef = useRef<any>()
  const statusType = () => {
    switch (proposal.status) {
      case ProposalStatus.Active:
        return 'active'
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
  const { switchToEthereum } = useSwitchToEthereum()
  const handleVote = useCallback(() => {
    switchToEthereum().then(() => {
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
  }, [selectedOptions, proposal.proposal_id, voteCallback])

  const votedOfCurrentProposal = useMemo(
    () => votesInfo?.find(v => v.proposal_id === proposal.proposal_id),
    [votesInfo, proposal.proposal_id],
  )

  useEffect(() => {
    setSelectedOptions([])
  }, [votedOfCurrentProposal])
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
            <VoteButton
              status={proposal.status}
              onVoteClick={handleVote}
              errorMessage={errorMessage}
              voted={!!votedOfCurrentProposal?.options && votedOfCurrentProposal.options.length > 0}
            />
          ) : proposal.status !== ProposalStatus.Pending ? (
            <Text color={theme.subText} fontSize={12}>
              Ended {dayjs(proposal.end_timestamp * 1000).format('DD MMM YYYY')}
            </Text>
          ) : (
            <div></div>
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
            {proposal?.link && proposal.link !== '0x0' && (
              <a
                href={proposal.link?.startsWith('http') ? proposal.link : 'http://' + proposal.link}
                style={{ marginBottom: '12px', width: 'fit-content' }}
                target="_blank"
                rel="noreferrer"
              >
                <span style={{ marginRight: '4px' }}>
                  <LaunchIcon size={14} />
                </span>
                <span style={{ fontSize: '14px', verticalAlign: 'top' }}>
                  <Trans>Github</Trans>
                </span>
              </a>
            )}
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
          isShow={showConfirmModal}
          title={proposal.title}
          toggle={() => setShowConfirmModal(false)}
          options={selectedOptions.length > 0 ? selectedOptions.map(option => proposal.options[option]).join(', ') : ''}
          onVoteConfirm={handleVoteConfirm}
        />
      )}
    </ProposalItemWrapper>
  )
}
export default React.memo(ProposalItem)
