import { Trans, t } from '@lingui/macro'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import { ButtonPrimary } from 'components/Button'
import { APP_PATHS } from 'constants/index'
import { MEDIA_WIDTHS, StyledInternalLink } from 'theme'

import CampaignStats from './components/CampaignStats'
import RaffleCampaignStats from './components/CampaignStats/RaffleCampaignStats'
import Information from './components/Information'
import JoinRaffleCampaignModal from './components/JoinRaffleCampaignModal'
import JoinReferral from './components/JoinReferral'
import Leaderboard from './components/Leaderboard'
import RaffleLeaderboard from './components/Leaderboard/RaffleLeaderboard'
import RaffleRewardModal from './components/RaffleRewardModal'
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

const CAMPAIGN_TYPE_BY_PATHNAME: Record<string, CampaignType> = {
  [APP_PATHS.SAFEPAL_CAMPAIGN]: CampaignType.SafePal,
  [APP_PATHS.RAFFLE_CAMPAIGN]: CampaignType.Raffle,
  [APP_PATHS.NEAR_INTENTS_CAMPAIGN]: CampaignType.NearIntents,
  [APP_PATHS.MAY_TRADING_CAMPAIGN]: CampaignType.MayTrading,
  [APP_PATHS.AGGREGATOR_CAMPAIGN]: CampaignType.Aggregator,
  [APP_PATHS.LIMIT_ORDER_CAMPAIGN]: CampaignType.LimitOrder,
  [APP_PATHS.REFFERAL_CAMPAIGN]: CampaignType.Referrals,
}

export default function CampaignPage() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') || TabKey.Information

  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)

  const type = CAMPAIGN_TYPE_BY_PATHNAME[pathname] ?? CampaignType.Referrals

  const { campaign, ctaText, ctaLink, banner, title, weeks } = campaignConfig[type]

  const isRaffleCampaign = type === CampaignType.Raffle
  const isReferralCampaign = campaign === 'referral-program'

  const isCampagainAvailable = useMemo(() => {
    const now = Math.floor(Date.now() / 1000)
    return weeks.some(week => now >= week.start && now <= week.end)
  }, [weeks])

  // Previously selected week was week number of campaign timelines, but NOW campaigns' week is zero-based index
  const [selectedWeek, setSelectedWeek] = useState(-1)
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false)

  const {
    onJoin: handleJoinRaffleCampaign,
    isJoinedByWeek: isRaffleJoinedByWeek,
    isNotEligible: isRaffleNotEligible,
    participant,
  } = useRaffleCampaignJoin({ selectedWeek })

  const params = useNearIntentSelectedWallet()

  useEffect(() => {
    if (isRaffleCampaign && participant?.reward_all) {
      setIsRewardModalOpen(true)
    }
  }, [isRaffleCampaign, participant])

  return (
    <Wrapper>
      <img src={banner} width="100%" alt="banner" style={{ borderRadius: '12px' }} />
      <Flex justifyContent="space-between" alignItems="center" marginTop="1.5rem">
        <Text fontSize={24} fontWeight="500">
          {title}
        </Text>

        {isReferralCampaign && <JoinReferral />}
        {isRaffleNotEligible && (
          <StatCard style={{ padding: '8px 16px' }}>
            <Text fontSize={14} color="error" textAlign="right">
              <Trans>
                You are{' '}
                <Text as="span" fontWeight="500" color="white">
                  not eligible
                </Text>{' '}
                for this campaign
              </Trans>
            </Text>
          </StatCard>
        )}
      </Flex>

      {!isReferralCampaign && (
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
            disabled={isRaffleCampaign || !isCampagainAvailable}
            onClick={() => {
              if (isRaffleCampaign) {
                setIsJoinModalOpen(true)
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

      {isRaffleCampaign && (
        <JoinRaffleCampaignModal
          isOpen={isJoinModalOpen}
          onDismiss={() => setIsJoinModalOpen(false)}
          onConfirm={() => {
            setIsJoinModalOpen(false)
            void handleJoinRaffleCampaign()
          }}
        />
      )}

      {isRaffleCampaign && (
        <RaffleRewardModal
          isOpen={isRewardModalOpen}
          onDismiss={() => setIsRewardModalOpen(false)}
          onConfirm={() => {
            setIsRewardModalOpen(false)
            navigate(`${APP_PATHS.MY_DASHBOARD}?tab=${CampaignType.Raffle}`)
          }}
          participant={participant}
        />
      )}
    </Wrapper>
  )
}
