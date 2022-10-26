import { Trans } from '@lingui/macro'
import { lighten, transparentize } from 'polished'
import React, { useRef, useState } from 'react'
import { ChevronDown } from 'react-feather'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import LaunchIcon from 'components/Icons/LaunchIcon'
import { RowBetween, RowFixed } from 'components/Row'
import useTheme from 'hooks/useTheme'

import { ProposalStatus } from '../type'
import Participants from './Participants'
import VoteInformation from './VoteInformation'
import VoteProgress from './VoteProgress'

const ProposalItemWrapper = styled.div`
  padding: 20px 24px;
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
  gap: 20px;
  z-index: 1;
  cursor: pointer;
  ${({ theme }) => css`
    background-color: ${theme.background};
  `}
`

const ExpandButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  width: 28px;
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
  ${({ status, theme }) => {
    if (status === 'pending')
      return css`
        color: ${theme.blue};
        background-color: ${transparentize(0.8, theme.blue)};
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
    return css`
      color: ${theme.subText};
      background-color: ${theme.buttonBlack};
    `
  }}
`

const Content = styled.div<{ show?: boolean; height?: number }>`
  gap: 24px;
  padding: 24px 0;
  transition: all 0.2s ease-in-out;
  z-index: 0;
  display: flex;
  gap: 20px;
  ${({ show }) =>
    show
      ? css`
          opacity: 1;
          max-height: 1000px;
        `
      : css`
          opacity: 0;
          max-height: 0;
          padding: 0;
        `}
`
const TextButton = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  cursor: pointer;
  ${({ theme }) => css`
    color: ${theme.primary};
    :hover {
      color: ${lighten(0.1, theme.primary)} !important;
    }
  `}
`

export default function ProposalItem({ title, status, id }: { title?: string; status?: ProposalStatus; id?: string }) {
  const theme = useTheme()
  const [show, setShow] = useState(false)
  const contentRef = useRef<any>()
  const contentHeight = contentRef.current?.getBoundingClientRect().height
  const statusType = () => {
    switch (status) {
      case ProposalStatus.Pending:
        return 'pending'
      case ProposalStatus.Cancelled:
      case ProposalStatus.Failed:
        return 'error'
      case ProposalStatus.Executed:
      case ProposalStatus.Approved:
        return 'success'
      default:
        return 'pending'
    }
  }
  return (
    <ProposalItemWrapper>
      <ProposalHeader>
        <RowBetween onClick={() => setShow(s => !s)}>
          <Text>
            <Trans>{title}</Trans>
          </Text>
          <ExpandButton>
            <ChevronDown
              size={24}
              style={{ transition: 'all 0.2s ease', transform: show ? 'rotate(180deg)' : undefined }}
            />
          </ExpandButton>
        </RowBetween>
        {status === ProposalStatus.Pending && (
          <RowBetween gap="20px">
            <VoteProgress />
            <VoteProgress checked />
          </RowBetween>
        )}
        <RowBetween>
          <Text color={theme.subText} fontSize={12}>
            Ended 14 May 2022
          </Text>
          <RowFixed gap="8px">
            <StatusBadged status={statusType()}>{status}</StatusBadged>
            <StatusBadged>{id}</StatusBadged>
          </RowFixed>
        </RowBetween>
      </ProposalHeader>
      <Content ref={contentRef as any} show={show} height={contentHeight}>
        <div style={{ flex: 1 }}>
          <RowFixed marginBottom="12px">
            <TextButton style={{ marginRight: '36px' }}>
              <Trans>Forum</Trans>
              <LaunchIcon size={16} />
            </TextButton>
            <TextButton>
              <Trans>Github</Trans>
              <LaunchIcon size={16} />
            </TextButton>
          </RowFixed>
          <Text fontSize={16} color={theme.subText} marginBottom="20px">
            - We strongly believe that we can effectively utilize the remaining KNC in the ecosystem growth fund to
            drive adoption for KyberSwap.com and the KNC token itself. Burning KNC would only result in a short-term
            supply shock but does not support long-term value accrual.
            <br />
            <br /> - On the other hand, effective utilization of KNC in upcoming initiatives could potentially result in
            more users, volume, and fees for LPs and KyberDAO voters. This would also increase the number of KNC holders
            who help expand the Kyber ecosystem, with the ability to stake KNC and vote.
            <br />
            <br /> - KNC plays a valuable and central role in the Kyber ecosystem. KNC holders not only own a useful
            asset, but also a stake in DeFi’s liquidity infrastructure. We want to work closely with the community to
            ensure that KNC is utilized in the most efficient and impactful way possible and enhance its long-term
            value.
          </Text>
          <Participants />
        </div>
        <div style={{ width: '368px' }}>
          <VoteInformation />
        </div>
      </Content>
    </ProposalItemWrapper>
  )
}
