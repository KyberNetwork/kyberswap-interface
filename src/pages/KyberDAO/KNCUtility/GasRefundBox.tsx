import { Trans } from '@lingui/macro'
import { formatUnits } from 'ethers/lib/utils'
import { darken } from 'polished'
import { useState } from 'react'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ButtonLight, ButtonPrimary } from 'components/Button'
import { RowBetween } from 'components/Row'
import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'

const TotalReward = styled.div`
  padding-bottom: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`

const Wrapper = styled.div`
  width: 100%;
  border-radius: 20px;
  padding: 24px 24px 30px;
  background-color: ${({ theme }) => theme.background};
`

enum Tabs {
  Available,
  Pending,
  Claimed,
}

const Tab = styled(Text)<{ active?: boolean }>`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: left;
  border-radius: 3rem;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.subText};
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;

  ${({ active, theme }) =>
    active &&
    css`
      border-radius: 12px;
      font-weight: 600;
      color: ${theme.primary};
    `}

  :hover {
    color: ${({ theme }) => darken(0.1, theme.primary)};
  }
`

export default function GasRefundBox() {
  const theme = useTheme()
  const totalReward = 20000000000000
  const totalRewardUSD = 2
  const [selectedTab, setSelectedTab] = useState<Tabs>(Tabs.Available)
  return (
    <Wrapper>
      <TotalReward>
        <RowBetween>
          <Flex flexDirection="column" sx={{ gap: '16px' }}>
            <TextDashed fontSize={14} lineHeight="20px" fontWeight={500} color={theme.subText}>
              <MouseoverTooltip
                width="fit-content"
                text={<Trans>Your Total Rewards = Available Reward + Pending Reward + Claimed Reward</Trans>}
                placement="top"
              >
                <Trans>Your Total Rewards</Trans>
              </MouseoverTooltip>
            </TextDashed>
            <Flex flexDirection="column" sx={{ gap: '8px' }}>
              <Text fontSize={20} lineHeight="24px" fontWeight={500} color={theme.text} alignItems="center">
                {formatUnits(totalReward)} KNC
              </Text>
              <Text fontSize={12} lineHeight="16px" fontWeight={500} color={theme.subText} alignItems="center">
                ${totalRewardUSD}
              </Text>
            </Flex>
          </Flex>
          <Flex alignSelf="end">
            <ButtonLight padding="2px 12px">Your Transactions</ButtonLight>
          </Flex>
        </RowBetween>
      </TotalReward>
      <RowBetween>
        <Flex flexDirection="column" sx={{ gap: '16px' }}>
          <Flex>
            <MouseoverTooltip
              width="fit-content"
              text={<Trans>Available rewards: Claimable rewards in this epoch.</Trans>}
              placement="top"
            >
              <Tab active={selectedTab === Tabs.Available} onClick={() => setSelectedTab(Tabs.Available)}>
                Available
              </Tab>
            </MouseoverTooltip>
            &nbsp;|&nbsp;
            <MouseoverTooltip
              width="fit-content"
              text={
                <Trans>
                  Pending rewards: Cumulative rewards not yet can be claim. Will be able to claim in next epoch.
                </Trans>
              }
              placement="top"
            >
              <Tab active={selectedTab === Tabs.Pending} onClick={() => setSelectedTab(Tabs.Pending)}>
                Pending
              </Tab>
            </MouseoverTooltip>
            &nbsp;|&nbsp;
            <MouseoverTooltip
              width="fit-content"
              text={<Trans>Claimed rewards: Rewards claimed and transferred to user wallet.</Trans>}
              placement="top"
            >
              <Tab active={selectedTab === Tabs.Claimed} onClick={() => setSelectedTab(Tabs.Claimed)}>
                Claimed
              </Tab>
            </MouseoverTooltip>
          </Flex>
          <Flex flexDirection="column" sx={{ gap: '8px' }}>
            <Text fontSize={20} lineHeight="24px" fontWeight={500} color={theme.text} alignItems="center">
              {formatUnits(totalReward)} KNC
            </Text>
            <Text fontSize={12} lineHeight="16px" fontWeight={500} color={theme.subText} alignItems="center">
              ${totalRewardUSD}
            </Text>
          </Flex>
        </Flex>
        <Flex alignSelf="end">
          <ButtonPrimary padding="8px 45px">Claim</ButtonPrimary>
        </Flex>
      </RowBetween>
    </Wrapper>
  )
}
