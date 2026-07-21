import { Trans, t } from '@lingui/macro'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'

import { ButtonPrimary } from 'components/Button'
import { HiddenH1, HiddenH2 } from 'components/Seo/components'
import NonEvmProviders from 'components/Web3Provider/NonEvmProviders'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import CampaignStats from 'pages/Campaign/components/CampaignStats'
import RaffleCampaignStats from 'pages/Campaign/components/CampaignStats/RaffleCampaignStats'
import SafePalCampaignStats, { SafePalClaim } from 'pages/Campaign/components/CampaignStats/SafePalCampaignStats'
import Information from 'pages/Campaign/components/Information'
import JoinCampaignModal from 'pages/Campaign/components/JoinCampaignModal'
import JoinReferral from 'pages/Campaign/components/JoinReferral'
import Leaderboard from 'pages/Campaign/components/Leaderboard'
import RaffleLeaderboard from 'pages/Campaign/components/Leaderboard/RaffleLeaderboard'
import SafePalLeaderboard from 'pages/Campaign/components/Leaderboard/SafePalLeaderboard'
import RaffleRewardModal from 'pages/Campaign/components/RaffleRewardModal'
import WeekSelect from 'pages/Campaign/components/WeekSelect'
import { CampaignType, campaignConfig } from 'pages/Campaign/constants'
import { useNearIntentSelectedWallet } from 'pages/Campaign/hooks/useNearIntentSelectedWallet'
import { useRaffleCampaignJoin } from 'pages/Campaign/hooks/useRaffleCampaignJoin'
import { useSafePalCampaignJoin } from 'pages/Campaign/hooks/useSafePalCampaignJoin'
import { StatCard, Tab, Tabs, Wrapper } from 'pages/Campaign/styles'
import { useWalletModalToggle } from 'state/application/hooks'
import { MEDIA_WIDTHS, StyledInternalLink } from 'theme'
import { cn } from 'utils/cn'

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

function CampaignPageContent() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') || TabKey.Information

  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)
  const { account } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()

  const type = CAMPAIGN_TYPE_BY_PATHNAME[pathname] ?? CampaignType.Referrals
  const { campaign, ctaText, ctaLink, banner, title, weeks } = campaignConfig[type]

  const isRaffleCampaign = type === CampaignType.Raffle
  const isSafePalCampaign = type === CampaignType.SafePal
  const isReferralCampaign = campaign === 'referral-program'

  const isCampagainAvailable = useMemo(() => {
    const now = Math.floor(Date.now() / 1000)
    return weeks.some(week => now >= week.start && now <= week.end)
  }, [weeks])

  // Previously selected week was week number of campaign timelines, but NOW campaigns' week is zero-based index
  const [selectedWeek, setSelectedWeek] = useState(-1)
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false)

  const isSelectedWeekAvailable = useMemo(() => {
    const selectedRange = weeks.find(week => week.value === selectedWeek)
    if (!selectedRange) return false

    const now = Math.floor(Date.now() / 1000)
    return now >= selectedRange.start && now <= selectedRange.end
  }, [selectedWeek, weeks])

  const {
    onJoin: handleJoinRaffleCampaign,
    isJoinedByWeek: isRaffleJoinedByWeek,
    isNotEligible: isRaffleNotEligible,
    participant,
  } = useRaffleCampaignJoin({ selectedWeek, enabled: isRaffleCampaign })

  const { onJoin: handleJoinSafePalCampaign, isJoinedByWeek: isSafePalJoined } = useSafePalCampaignJoin({
    selectedWeek,
    enabled: isSafePalCampaign,
  })

  const isJoinedCampaign = isRaffleCampaign ? isRaffleJoinedByWeek : isSafePalCampaign ? isSafePalJoined : false
  const isJoinAvailable = isRaffleCampaign || isSafePalCampaign ? isSelectedWeekAvailable : isCampagainAvailable
  const params = useNearIntentSelectedWallet()

  useEffect(() => {
    if (isRaffleCampaign && participant?.reward_all) {
      setIsRewardModalOpen(true)
    }
  }, [isRaffleCampaign, participant])

  const handleRequestJoin = () => {
    if (!account) {
      toggleWalletModal()
    } else {
      setIsJoinModalOpen(true)
    }
  }

  const handleViewTerms = () => {
    setIsJoinModalOpen(false)
    searchParams.set('tab', TabKey.Information)
    setSearchParams(searchParams)

    setTimeout(() => {
      requestAnimationFrame(() => {
        document.getElementById('terms-and-conditions')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      })
    }, 300)
  }

  return (
    <Wrapper className="animate-[fadeInUp_0.5s_ease-out_both] motion-reduce:animate-none">
      <HiddenH1>Earn bonus rewards and incentives while you swap, provide liquidity, or trade.</HiddenH1>
      <HiddenH2>Join active campaigns across supported chains - no lock-up required.</HiddenH2>
      <img src={banner} width="100%" alt="banner" className="rounded-xl" />
      <div className="mt-6 flex items-center justify-between">
        <span className="text-2xl font-medium">{title}</span>

        {isReferralCampaign && <JoinReferral />}
        {isRaffleNotEligible && (
          <StatCard className="px-4 py-2">
            <span className="block text-right text-sm text-red">
              <Trans>
                You are <span className="font-medium text-white">not eligible</span> for this campaign
              </Trans>
            </span>
          </StatCard>
        )}
      </div>

      {!isReferralCampaign && (
        <div className={cn('mt-4 flex items-center justify-between gap-4', upToExtraSmall ? 'flex-col' : 'flex-row')}>
          <WeekSelect type={type} selectedWeek={selectedWeek} setSelectedWeek={setSelectedWeek} />

          {isSafePalCampaign && isSafePalJoined ? (
            <ButtonPrimary
              altDisabledStyle
              width={upToExtraSmall ? '100%' : '160px'}
              height="40px"
              onClick={() => {
                navigate('/')
              }}
            >
              {t`Trade Now`}
            </ButtonPrimary>
          ) : (
            <ButtonPrimary
              altDisabledStyle
              width={upToExtraSmall ? '100%' : '160px'}
              height="40px"
              disabled={isJoinedCampaign || isRaffleNotEligible || !isJoinAvailable}
              onClick={() => {
                if (isRaffleCampaign || isSafePalCampaign) {
                  handleRequestJoin()
                } else {
                  navigate(ctaLink)
                }
              }}
            >
              {isRaffleJoinedByWeek || isSafePalJoined ? t`Joined` : ctaText}
            </ButtonPrimary>
          )}
        </div>
      )}

      {isRaffleCampaign ? (
        <RaffleCampaignStats selectedWeek={selectedWeek} />
      ) : isSafePalCampaign ? (
        <SafePalCampaignStats selectedWeek={selectedWeek} />
      ) : (
        <CampaignStats type={type} selectedWeek={selectedWeek} />
      )}
      {isSafePalCampaign && <SafePalClaim selectedWeek={selectedWeek} />}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
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
          {(isRaffleCampaign || isSafePalCampaign) && (
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
      </div>

      {tab === TabKey.Information && <Information type={type} selectedWeek={selectedWeek} />}

      {tab === TabKey.Leaderboard &&
        (isRaffleCampaign ? (
          <RaffleLeaderboard selectedWeek={selectedWeek} />
        ) : isSafePalCampaign ? (
          <SafePalLeaderboard selectedWeek={selectedWeek} onRequestJoin={handleRequestJoin} />
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

      {tab === TabKey.YourTransactions &&
        (isRaffleCampaign ? (
          <RaffleLeaderboard type="owner" selectedWeek={selectedWeek} />
        ) : isSafePalCampaign ? (
          <SafePalLeaderboard type="owner" selectedWeek={selectedWeek} onRequestJoin={handleRequestJoin} />
        ) : null)}

      {(isRaffleCampaign || isSafePalCampaign) && (
        <JoinCampaignModal
          isOpen={isJoinModalOpen}
          onDismiss={() => setIsJoinModalOpen(false)}
          onConfirm={() => {
            setIsJoinModalOpen(false)
            if (isRaffleCampaign) {
              void handleJoinRaffleCampaign()
            }
            if (isSafePalCampaign) {
              void handleJoinSafePalCampaign()
            }
          }}
          onViewTerms={handleViewTerms}
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

export default function CampaignPage() {
  return (
    <NonEvmProviders>
      <CampaignPageContent />
    </NonEvmProviders>
  )
}
