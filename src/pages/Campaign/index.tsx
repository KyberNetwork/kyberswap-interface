import React, { useEffect, useRef, useState } from 'react'
import styled, { css } from 'styled-components'
import { Flex, Text } from 'rebass'
import { t, Trans } from '@lingui/macro'

import Search from 'components/Search'
import useTheme from 'hooks/useTheme'
import { ICampaign, ICampaignStatus } from 'state/campaign/actions'
import { darken, rgba } from 'polished'
import { Button } from 'theme'
import { ChevronDown, Clock, Share2, Star, Users } from 'react-feather'
import { ButtonEmpty, ButtonLight } from 'components/Button'
import { formatNumberWithPrecisionRange, formattedNum } from 'utils'
import { useActiveWeb3React } from 'hooks'
import { useWalletModalToggle } from 'state/application/hooks'
import Divider from 'components/Divider'

const SAMPLE_DATA_SHORT: ICampaign[] = [
  {
    name: '$50,000 AVAX Trading Rewards Campaign For New User',
    status: 'Upcoming',
  },
  {
    name: '$50,000 AVAX Trading Rewards Campaign For New User',
    status: 'Upcoming',
  },
]

const SAMPLE_DATA: ICampaign[] = [
  {
    name: '$50,000 AVAX Trading Rewards Campaign For New User',
    status: 'Upcoming',
  },
  {
    name: '$50,000 AVAX Trading Rewards Campaign For New User',
    status: 'Upcoming',
  },
  {
    name: '$50,000 AVAX Trading Rewards Campaign For New User',
    status: 'Upcoming',
  },
  {
    name: '$50,000 AVAX Trading Rewards Campaign For New User',
    status: 'Ongoing',
  },
  {
    name:
      '$50,000 AVAX Trading Rewards Campaign For New User $50,000 AVAX Trading Rewards Campaign For New User $50,000 AVAX Trading Rewards Campaign For New User',
    status: 'Ongoing',
  },
  {
    name: '$50,000 AVAX Trading Rewards Campaign For New User',
    status: 'Ended',
  },
  {
    name: '$50,000 AVAX Trading Rewards Campaign For New User',
    status: 'Ended',
  },
  {
    name: '$50,000 AVAX Trading Rewards Campaign For New User',
    status: 'Ended',
  },
  {
    name: '$50,000 AVAX Trading Rewards Campaign For New User',
    status: 'Ended',
  },
  {
    name: '$50,000 AVAX Trading Rewards Campaign For New User',
    status: 'Ended',
  },
  {
    name: '$50,000 AVAX Trading Rewards Campaign For New User',
    status: 'Ended',
  },
  {
    name: '$50,000 AVAX Trading Rewards Campaign For New User',
    status: 'Ended',
  },
  {
    name: '$50,000 AVAX Trading Rewards Campaign For New User',
    status: 'Ended',
  },
  {
    name: '$50,000 AVAX Trading Rewards Campaign For New User',
    status: 'Ended',
  },
  {
    name: '$50,000 AVAX Trading Rewards Campaign For New User',
    status: 'Ended',
  },
  {
    name: '$50,000 AVAX Trading Rewards Campaign For New User',
    status: 'Ended',
  },
  {
    name: '$50,000 AVAX Trading Rewards Campaign For New User',
    status: 'Ended',
  },
]

export default function Campaign() {
  const { account } = useActiveWeb3React()
  const theme = useTheme()

  const [searchCampaign, setSearchCampaign] = useState('')
  const [activeTab, setActiveTab] = useState<'how_to_win' | 'rewards' | 'leaderboard' | 'lucky_winners'>('how_to_win')

  const toggleWalletModal = useWalletModalToggle()

  const rules = `<p>- Top 200 participants with the most trading points will share a total prize pool of 35,000 BUSD. Winners will receive their winnings in BUSD. Winnings can be claimed in the Reward page on Krystal DeFi Mobile app after final results are published until 30 June 2022, 23:59 (GMT+8). After that time, unclaimed prizes will be voided.<br><br>- For participants who rank 201 and beyond, 100 winners will be selected at random, and awarded 40 BUSD each.<br><br>- User performs any swap. Trading amount will be converted to USD value, and for every USD, the user will be awarded 1 point, up to 4 decimal places, except during the last 4 hours of the campaign. No minimum or maximum value.<br><br>- Exception: token X → Wrapped X and Wrapped X → X trades WILL NOT be counted and will not increase trading points. Example below (non-exhaustive)<br><br>WBNB → BNB<br><br>BNB → WBNB<br><br>WETH → ETH<br><br>ETH → WETH<br><br>- Trades on Ethereum, BNB Smart Chain, Polygon, Avalanche, Fantom and Cronos are eligible.&nbsp;<br><br>- During the last 4 hours of the campaign, for every trade, participants will be awarded half the trading point compared to before, up to 4 decimal places. No minimum or maximum value.&nbsp;<br><br>- Krystal reserves the right to disqualify any user that violates, cheats or abuses the campaign at its own discretion.</p>`
  const termsAndConditions = `<p>- Top 200 participants with the most trading points will share a total prize pool of 35,000 BUSD. Winners will receive their winnings in BUSD. Winnings can be claimed in the Reward page on Krystal DeFi Mobile app after final results are published until 30 June 2022, 23:59 (GMT+8). After that time, unclaimed prizes will be voided.<br><br>- For participants who rank 201 and beyond, 100 winners will be selected at random, and awarded 40 BUSD each.<br><br>- User performs any swap. Trading amount will be converted to USD value, and for every USD, the user will be awarded 1 point, up to 4 decimal places, except during the last 4 hours of the campaign. No minimum or maximum value.<br><br>- Exception: token X → Wrapped X and Wrapped X → X trades WILL NOT be counted and will not increase trading points. Example below (non-exhaustive)<br><br>WBNB → BNB<br><br>BNB → WBNB<br><br>WETH → ETH<br><br>ETH → WETH<br><br>- Trades on Ethereum, BNB Smart Chain, Polygon, Avalanche, Fantom and Cronos are eligible.&nbsp;<br><br>- During the last 4 hours of the campaign, for every trade, participants will be awarded half the trading point compared to before, up to 4 decimal places. No minimum or maximum value.&nbsp;<br><br>- Krystal reserves the right to disqualify any user that violates, cheats or abuses the campaign at its own discretion.</p>`
  const otherDetails = `<p>- Top 200 participants with the most trading points will share a total prize pool of 35,000 BUSD. Winners will receive their winnings in BUSD. Winnings can be claimed in the Reward page on Krystal DeFi Mobile app after final results are published until 30 June 2022, 23:59 (GMT+8). After that time, unclaimed prizes will be voided.<br><br>- For participants who rank 201 and beyond, 100 winners will be selected at random, and awarded 40 BUSD each.<br><br>- User performs any swap. Trading amount will be converted to USD value, and for every USD, the user will be awarded 1 point, up to 4 decimal places, except during the last 4 hours of the campaign. No minimum or maximum value.<br><br>- Exception: token X → Wrapped X and Wrapped X → X trades WILL NOT be counted and will not increase trading points. Example below (non-exhaustive)<br><br>WBNB → BNB<br><br>BNB → WBNB<br><br>WETH → ETH<br><br>ETH → WETH<br><br>- Trades on Ethereum, BNB Smart Chain, Polygon, Avalanche, Fantom and Cronos are eligible.&nbsp;<br><br>- During the last 4 hours of the campaign, for every trade, participants will be awarded half the trading point compared to before, up to 4 decimal places. No minimum or maximum value.&nbsp;<br><br>- Krystal reserves the right to disqualify any user that violates, cheats or abuses the campaign at its own discretion.</p>`
  const rewardDetails = `<p>- Top 200 participants with the most trading points will share a total prize pool of 35,000 BUSD. Winners will receive their winnings in BUSD. Winnings can be claimed in the Reward page on Krystal DeFi Mobile app after final results are published until 30 June 2022, 23:59 (GMT+8). After that time, unclaimed prizes will be voided.<br><br>- For participants who rank 201 and beyond, 100 winners will be selected at random, and awarded 40 BUSD each.<br><br>- User performs any swap. Trading amount will be converted to USD value, and for every USD, the user will be awarded 1 point, up to 4 decimal places, except during the last 4 hours of the campaign. No minimum or maximum value.<br><br>- Exception: token X → Wrapped X and Wrapped X → X trades WILL NOT be counted and will not increase trading points. Example below (non-exhaustive)<br><br>WBNB → BNB<br><br>BNB → WBNB<br><br>WETH → ETH<br><br>ETH → WETH<br><br>- Trades on Ethereum, BNB Smart Chain, Polygon, Avalanche, Fantom and Cronos are eligible.&nbsp;<br><br>- During the last 4 hours of the campaign, for every trade, participants will be awarded half the trading point compared to before, up to 4 decimal places. No minimum or maximum value.&nbsp;<br><br>- Krystal reserves the right to disqualify any user that violates, cheats or abuses the campaign at its own discretion.</p>`

  const [showRules, setShowRules] = useState(false)
  const [showTermsAndConditions, setShowTermsAndConditions] = useState(false)
  const [showOtherDetails, setShowOtherDetails] = useState(false)
  const TabHowToWinContent = () => (
    <Flex flexDirection="column" style={{ gap: '20px' }}>
      <Flex justifyContent="space-between" alignItems="center" style={{ cursor: 'pointer' }}>
        <Text fontSize={20} fontWeight={500}>
          Rules
        </Text>
        <ButtonEmpty width="fit-content" style={{ padding: '0' }} onClick={() => setShowRules(prev => !prev)}>
          <ChevronDown size={24} color={theme.subText} />
        </ButtonEmpty>
      </Flex>
      {showRules && <div dangerouslySetInnerHTML={{ __html: rules }} />}
      <Divider />
      <Flex justifyContent="space-between" alignItems="center" style={{ cursor: 'pointer' }}>
        <Text fontSize={20} fontWeight={500}>
          Terms and Conditions
        </Text>
        <ButtonEmpty
          width="fit-content"
          style={{ padding: '0' }}
          onClick={() => setShowTermsAndConditions(prev => !prev)}
        >
          <ChevronDown size={24} color={theme.subText} />
        </ButtonEmpty>
      </Flex>
      {showTermsAndConditions && <div dangerouslySetInnerHTML={{ __html: termsAndConditions }} />}
      <Divider />
      <Flex justifyContent="space-between" alignItems="center" style={{ cursor: 'pointer' }}>
        <Text fontSize={20} fontWeight={500}>
          Other Details
        </Text>
        <ButtonEmpty width="fit-content" style={{ padding: '0' }} onClick={() => setShowOtherDetails(prev => !prev)}>
          <ChevronDown size={24} color={theme.subText} />
        </ButtonEmpty>
      </Flex>
      {showOtherDetails && <div dangerouslySetInnerHTML={{ __html: otherDetails }} />}
      <Divider />
    </Flex>
  )
  const TabRewardsContent = () => (
    <Flex flexDirection="column" style={{ gap: '20px' }}>
      <Text fontSize={20} fontWeight={500}>
        Rules
      </Text>
      <div dangerouslySetInnerHTML={{ __html: rewardDetails }} />
    </Flex>
  )
  const TabLeaderboardContent = () => <Flex>ok</Flex>
  const TabLuckyWinnersContent = () => <Flex>ok</Flex>

  return (
    <PageWrapper>
      <CampaignContainer>
        <CampaignListAndSearch>
          <Text fontSize="20px" lineHeight="24px">
            <Trans>Events</Trans>
          </Text>
          <Search
            searchValue={searchCampaign}
            onSearch={(newSearchCampaign: string) => setSearchCampaign(newSearchCampaign)}
            style={{ background: theme.buttonBlack, borderRadius: '18px' }}
            placeholder={t`Search for event`}
          />
          <CampaignList>
            {SAMPLE_DATA.map((campaign, index) => {
              return (
                <CampaignItem key={index}>
                  <Text fontWeight={500}>{campaign.name}</Text>
                  <CampaignStatusText status={campaign.status}>{campaign.status}</CampaignStatusText>
                </CampaignItem>
              )
            })}
          </CampaignList>
        </CampaignListAndSearch>

        <CampaignDetail>
          <CampaignDetailImage src="https://picsum.photos/2000/1000" alt="campaign-image" />
          <CampaignDetailHeader>
            <Text fontSize="20px" fontWeight={500}>
              $50,000 AVAX Trading Rewards Campaign
            </Text>
            <EnterNowAndShareContainer>
              <Button
                style={{ padding: '12px 58px', minWidth: 'fit-content', height: 'fit-content', lineHeight: '20px' }}
              >
                <Trans>Enter now</Trans>
              </Button>
              <ButtonLight borderRadius="50%" style={{ padding: '8px 11px' }}>
                <Share2 size={20} color={theme.primary} style={{ minWidth: '20px', minHeight: '20px' }} />
              </ButtonLight>
            </EnterNowAndShareContainer>
          </CampaignDetailHeader>
          <CampaignDetailBoxGroup>
            <CampaignDetailBoxGroupItem>
              <Text fontSize={14} fontWeight={500} color={theme.subText}>
                <Trans>Starting In</Trans>
              </Text>
              <Clock size={20} color={theme.primary} />
              <Text fontSize={20} fontWeight={500} style={{ gridColumn: '1 / -1' }}>
                14D 22H 59M 34S
              </Text>
            </CampaignDetailBoxGroupItem>
            <CampaignDetailBoxGroupItem>
              <Text fontSize={14} fontWeight={500} color={theme.subText}>
                <Trans>Participants</Trans>
              </Text>
              <Users size={20} color={theme.primary} />
              <Text fontSize={20} fontWeight={500} style={{ gridColumn: '1 / -1' }}>
                {formatNumberWithPrecisionRange(12345678, 0, 0)}
              </Text>
            </CampaignDetailBoxGroupItem>
            <CampaignDetailBoxGroupItem>
              <Text fontSize={14} fontWeight={500} color={theme.subText}>
                <Trans>Your Rank</Trans>
              </Text>
              <Star size={20} color={theme.primary} />
              {account ? (
                <Text fontSize={20} fontWeight={500} style={{ gridColumn: '1 / -1' }}>
                  5022
                </Text>
              ) : (
                <ButtonLight
                  style={{ gridColumn: '1 / -1', padding: '8px', margin: '0', borderRadius: '18px' }}
                  onClick={toggleWalletModal}
                >
                  <Trans>Connect Wallet</Trans>
                </ButtonLight>
              )}
            </CampaignDetailBoxGroupItem>
          </CampaignDetailBoxGroup>

          <CampaignDetailTabRow>
            <CampaignDetailTab active={activeTab === 'how_to_win'} onClick={() => setActiveTab('how_to_win')}>
              <Trans>How to win</Trans>
            </CampaignDetailTab>
            <CampaignDetailTab active={activeTab === 'rewards'} onClick={() => setActiveTab('rewards')}>
              <Trans>Rewards</Trans>
            </CampaignDetailTab>
            <CampaignDetailTab active={activeTab === 'leaderboard'} onClick={() => setActiveTab('leaderboard')}>
              <Trans>Leaderboard</Trans>
            </CampaignDetailTab>
            <CampaignDetailTab active={activeTab === 'lucky_winners'} onClick={() => setActiveTab('lucky_winners')}>
              <Trans>Lucky Winners</Trans>
            </CampaignDetailTab>
          </CampaignDetailTabRow>

          <CampaignDetailContent>
            {activeTab === 'how_to_win' && <TabHowToWinContent />}
            {activeTab === 'rewards' && <TabRewardsContent />}
            {activeTab === 'leaderboard' && <TabLeaderboardContent />}
            {activeTab === 'lucky_winners' && <TabLuckyWinnersContent />}
          </CampaignDetailContent>
        </CampaignDetail>
      </CampaignContainer>
    </PageWrapper>
  )
}

const CampaignDetailContent = styled.div`
  padding: 28px 24px;
  background: ${({ theme }) => theme.background};
  border-radius: 8px;
`

const CampaignDetailTab = styled(ButtonEmpty)<{ active: boolean }>`
  padding: 0 0 4px 0;
  color: ${({ theme }) => theme.subText};
  border-radius: 0;
  cursor: pointer;
  width: fit-content;

  &:hover {
    opacity: 0.72;
  }

  ${({ theme, active }) =>
    active &&
    css`
      color: ${theme.text};
      border-bottom: 1px solid ${theme.primary};
    `}
`

const CampaignDetailTabRow = styled.div`
  display: flex;
  gap: 24px;
`

const CampaignDetailBoxGroup = styled.div`
  display: flex;
  gap: 24px;
`

const CampaignDetailBoxGroupItem = styled.div`
  flex: 1;
  padding: 20px 24px;
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
  gap: 16px;
  background: ${({ theme }) => theme.background};
  border-radius: 8px;
`

const CampaignDetailHeader = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    flex-direction: column;
    align-items: flex-start; 
  `}
`

const EnterNowAndShareContainer = styled.div`
  gap: 12px;
  min-width: fit-content;
  display: flex;
`

const PageWrapper = styled.div`
  padding: 24px 16px 100px;
  width: 100%;
  max-width: 1300px;

  @media only screen and (min-width: 768px) {
    padding: 24px 64px;
  }
`

const CampaignContainer = styled.div`
  display: flex;
  gap: 24px;
  height: calc(100vh - 84.34px - 24px - 24px - 62px);
  overflow: auto;
`

const CampaignListAndSearch = styled.div`
  max-width: 400px;
  background: ${({ theme }) => theme.background};
  border-radius: 8px;
  padding: 24px 20px 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow: hidden;
  position: sticky;
  top: 0;
`

const CampaignDetail = styled.div`
  flex: 2;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 28px;
`

const CampaignDetailImage = styled.img`
  max-height: 180px;
  object-fit: cover;
  border-radius: 8px;
`

const CampaignList = styled.div`
  flex: 1;
  overflow-y: auto;
  width: calc(100% + 40px);
  margin: 0 -20px;
  border-top: 1px solid ${({ theme }) => theme.border};

  &::-webkit-scrollbar {
    display: block;
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.disableText};
  }
`

const CampaignItem = styled.div`
  display: flex;
  gap: 12px;
  padding: 20px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => darken(0.03, theme.background)};
  }
`

const CampaignStatusText = styled.div<{ status: ICampaignStatus }>`
  font-size: 12px;
  line-height: 10px;
  padding: 5px 8px;
  min-width: 76px;
  text-align: center;
  height: fit-content;
  border-radius: 24px;

  ${({ theme, status }) =>
    status === 'Upcoming' &&
    css`
      background: ${rgba(theme.warning, 0.2)};
      color: ${theme.warning};
    `}

  ${({ theme, status }) =>
    status === 'Ongoing' &&
    css`
      background: ${rgba(theme.primary, 0.2)};
      color: ${theme.primary};
    `}

  ${({ theme, status }) =>
    status === 'Ended' &&
    css`
      background: ${rgba(theme.red, 0.2)};
      color: ${theme.red};
    `}
`
