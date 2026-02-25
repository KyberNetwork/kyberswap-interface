import { Trans, t } from '@lingui/macro'
import { Link } from 'react-router-dom'

import { CampaignContent, FaqItem } from './types'

const renderSafepalTerms = () => (
  <>
    <li>
      <Trans>
        This campaign page is currently in dummy mode. Final mechanics and reward distribution details will be updated
        once the API integration is completed.
      </Trans>
    </li>
    <li>
      <Trans>
        KyberSwap and SafePal reserve the right to update timelines, eligibility criteria, and reward mechanics before
        official launch.
      </Trans>
    </li>
  </>
)

const safepalTimeline = <Trans>Dummy timeline: 6 weeks from 00:00 UTC, 09 Mar 2026 to 23:59 UTC, 19 Apr 2026.</Trans>

const safepalRewards = (
  <>
    <li>
      <Trans>Dummy reward pool: 10,000 SFP allocated for testing UI flow.</Trans>
    </li>
    <li>
      <Trans>Final reward structure and claim schedule will be announced after API go-live.</Trans>
    </li>
  </>
)

const safepalFaq: FaqItem[] = [
  {
    q: <Trans>Is this campaign live?</Trans>,
    a: <Trans>Not yet. This is a placeholder campaign setup while API endpoints are pending.</Trans>,
  },
  {
    q: <Trans>How do I join?</Trans>,
    a: (
      <Trans>
        For now, no action is required. Once launched, participation steps will be listed here and linked from{' '}
        <Link to="/swap/bsc">KyberSwap Swap</Link>.
      </Trans>
    ),
  },
  {
    q: <Trans>Will leaderboard and rewards be available?</Trans>,
    a: <Trans>Yes, after backend integration is completed. Until then, displayed values are placeholders.</Trans>,
  },
]

const safepalEligibility = (
  <>
    <li>
      <Trans>Dummy eligibility: any connected wallet can view this campaign page.</Trans>
    </li>
    <li>
      <Trans>Final eligibility rules will be published when the campaign is officially announced.</Trans>
    </li>
  </>
)

export const safepalInfo: CampaignContent = {
  getHowTo: (_week: number) => (
    <>
      <Trans>
        This is a SafePal campaign placeholder. Replace these instructions with final participation flow after API is
        ready.
      </Trans>
      <li>{t`Go to KyberSwap and switch to BNB Chain.`}</li>
      <li>{t`Trade eligible pairs to earn points (dummy rule).`}</li>
      <li>{t`Track rank and rewards in this campaign page once API data is available.`}</li>
    </>
  ),
  timeline: safepalTimeline,
  getRewards: (_week: number) => safepalRewards,
  faq: safepalFaq,
  getTerms: (_week: number) => renderSafepalTerms(),
  eligibility: safepalEligibility,
}
