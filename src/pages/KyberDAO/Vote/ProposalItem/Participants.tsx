import { Trans } from '@lingui/macro'
import { Component } from 'react'
import { ArrowDown } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import Divider from 'components/Divider'
import { RowBetween } from 'components/Row'
import useTheme from 'hooks/useTheme'

const Wrapper = styled.div`
  border-radius: 20px;
  padding: 12px 16px;
  ${({ theme }) => css`
    border: 1px solid ${theme.border};
    background-color: ${theme.buttonBlack};
  `}
`

const InfoRow = styled(RowBetween)`
  font-size: 12px;
  padding: 6px 0;
`
export default function Participants() {
  const theme = useTheme()
  return (
    <Wrapper>
      <Text>
        <Trans>Participants</Trans>
      </Text>
      <Divider margin="10px 0" />
      <RowBetween fontSize={12} color={theme.subText}>
        <Text>Wallet</Text>
        <Text>Vote</Text>
        <Text>Amount</Text>
      </RowBetween>
      <Divider margin="10px 0" />
      <InfoRow>
        <Text color={theme.subText}>Voting System</Text>
        <Text color={theme.text}>Binary Proposal</Text>
      </InfoRow>
      <InfoRow>
        <Text color={theme.subText}>Start Date</Text>
        <Text color={theme.text}>12 May 2022</Text>
      </InfoRow>
      <InfoRow>
        <Text color={theme.subText}>End Date</Text>
        <Text color={theme.text}>12 August 2022</Text>
      </InfoRow>
      <InfoRow>
        <Text color={theme.subText}>Total Addresses</Text>
        <Text color={theme.text}>29</Text>
      </InfoRow>
      <InfoRow>
        <Text color={theme.subText}>KNC Amount</Text>
        <Text color={theme.text}>50,309,000</Text>
      </InfoRow>
      <InfoRow>
        <Text color={theme.subText}>Your KIP Voting Power</Text>
        <Text color={theme.text}>2.4%</Text>
      </InfoRow>
      <Divider margin="10px 0" />
      <Flex justifyContent="center">
        <Flex alignItems="center" style={{ color: theme.primary, fontSize: '12px', gap: '6px', cursor: 'pointer' }}>
          Load more <ArrowDown size={14} />
        </Flex>
      </Flex>
    </Wrapper>
  )
}
