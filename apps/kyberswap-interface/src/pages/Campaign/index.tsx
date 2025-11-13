import { Trans, t } from '@lingui/macro'
import { useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import { ButtonPrimary } from 'components/Button'
import { APP_PATHS } from 'constants/index'
import { MEDIA_WIDTHS, StyledInternalLink } from 'theme'

import CampaignStats from './components/CampaignStats'
import RaffleCampaignStats from './components/CampaignStats/RaffleCampaignStats'
import Information from './components/Information'
import JoinReferral from './components/JoinReferral'
import Leaderboard from './components/Leaderboard'
import RaffleLeaderboard from './components/Leaderboard/RaffleLeaderboard'
import WeekSelect from './components/WeekSelect'
import { CampaignType, campaignConfig } from './constants'
import { useNearIntentSelectedWallet } from './hooks/useNearIntentSelectedWallet'
import { useRaffleCampaignJoin } from './hooks/useRaffleCampaignJoin'
import { StatCard, Tab, Tabs, Wrapper } from './styles'

enum TabKey {
  Information = 'information',
  Leaderboard = 'leaderboard',
  YourTransactions = 'your-transactions',
}

export default function CampaignPage() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') || TabKey.Information

  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)

  const type =
    pathname === APP_PATHS.AGGREGATOR_CAMPAIGN
      ? CampaignType.Aggregator
      : pathname === APP_PATHS.LIMIT_ORDER_CAMPAIGN
      ? CampaignType.LimitOrder
      : pathname === APP_PATHS.MAY_TRADING_CAMPAIGN
      ? CampaignType.MayTrading
      : pathname === APP_PATHS.RAFFLE_CAMPAIGN
      ? CampaignType.Raffle
      : pathname === APP_PATHS.NEAR_INTENTS_CAMPAIGN
      ? CampaignType.NearIntents
      : CampaignType.Referrals

  const isRaffleCampaign = type === CampaignType.Raffle
  const { campaign, ctaText, ctaLink, banner, title } = campaignConfig[type]

  // Previously selected week was week number of campaign timelines, but Raffle campaign week is zero-based index
  const [selectedWeek, setSelectedWeek] = useState(-1)

  const {
    onJoin: handleJoinRaffleCampaign,
    isJoinedByWeek: isRaffleJoinedByWeek,
    isNotEligible: isRaffleNotEligible,
  } = useRaffleCampaignJoin({ selectedWeek })

  const params = useNearIntentSelectedWallet()

  return (
    <Wrapper>
      <img src={banner} width="100%" alt="banner" style={{ borderRadius: '12px' }} />
      <Flex justifyContent="space-between" alignItems="center" marginTop="1.5rem">
        <Text fontSize={24} fontWeight="500">
          {title}
        </Text>

        {campaign === 'referral-program' && <JoinReferral />}
        {isRaffleNotEligible && (
          <StatCard style={{ padding: '8px 16px' }}>
            <Text fontSize={14} color="error" textAlign="right">
              <Trans>
                You are{' '}
                <Text as="span" fontWeight="500" color="white">
                  not eligible
                </Text>{' '}
                for this campaign.
              </Trans>
            </Text>
          </StatCard>
        )}
      </Flex>

      {campaign !== 'referral-program' && (
        <Flex
          justifyContent="space-between"
          marginTop="1rem"
          alignItems="center"
          flexDirection={upToExtraSmall ? 'column' : 'row'}
          sx={{ gap: '1rem' }}
        >
          <WeekSelect type={type} selectedWeek={selectedWeek} setSelectedWeek={setSelectedWeek} />

          <ButtonPrimary
            altDisabledStyle
            width={upToExtraSmall ? '100%' : '160px'}
            height="40px"
            disabled={isRaffleNotEligible || isRaffleJoinedByWeek}
            onClick={() => {
              if (isRaffleCampaign) {
                handleJoinRaffleCampaign()
              } else {
                navigate(ctaLink)
              }
            }}
          >
            {isRaffleJoinedByWeek ? t`Joined` : ctaText}
          </ButtonPrimary>
        </Flex>
      )}

      {isRaffleCampaign ? (
        <RaffleCampaignStats selectedWeek={selectedWeek} />
      ) : (
        <CampaignStats type={type} selectedWeek={selectedWeek} />
      )}

      <Flex justifyContent="space-between" alignItems="center" marginTop="1rem" flexWrap="wrap" sx={{ gap: '1rem' }}>
        <Tabs>
          <Tab
            role="button"
            active={tab === TabKey.Information}
            onClick={() => {
              searchParams.set('tab', TabKey.Information)
              setSearchParams(searchParams)
            }}
          >
            <Trans>Information</Trans>
          </Tab>
          <Tab
            role="button"
            active={tab === TabKey.Leaderboard}
            onClick={() => {
              searchParams.set('tab', TabKey.Leaderboard)
              setSearchParams(searchParams)
            }}
          >
            <Trans>Leaderboard</Trans>
          </Tab>
          {isRaffleCampaign && (
            <Tab
              role="button"
              active={tab === TabKey.YourTransactions}
              onClick={() => {
                searchParams.set('tab', TabKey.YourTransactions)
                setSearchParams(searchParams)
              }}
            >
              <Trans>Your Transactions</Trans>
            </Tab>
          )}
        </Tabs>

        <StyledInternalLink to={`${APP_PATHS.MY_DASHBOARD}?tab=${type}`}>
          <Trans>[ My Dashboard ]</Trans>
        </StyledInternalLink>
      </Flex>

      {tab === TabKey.Information && <Information type={type} selectedWeek={selectedWeek} />}

      {tab === TabKey.Leaderboard &&
        (isRaffleCampaign ? (
          <RaffleLeaderboard selectedWeek={selectedWeek} />
        ) : (
          <Leaderboard
            type={type}
            selectedWeek={selectedWeek}
            wallet={
              type === CampaignType.NearIntents && params.selectedWallet && params.address[params.selectedWallet]
                ? params.address[params.selectedWallet] || undefined
                : undefined
            }
          />
        ))}

      {tab === TabKey.YourTransactions && <RaffleLeaderboard type="owner" selectedWeek={selectedWeek} />}
    </Wrapper>
  )
}
