import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { isMobile } from 'react-device-detect'

import { KNC } from 'constants/tokens'

import loBanner from './assets/limit_order.png'
import mayTradingBanner from './assets/may_trading.png'
import nearIntentBanner from './assets/near_intents.png'
import nearIntentBannerMobile from './assets/near_intents_mobile.png'
import raffleBanner from './assets/raffle_banner.png'
import raffleBannerMobile from './assets/raffle_banner_mobile.png'
import referralBanner from './assets/referral.png'
import safepalBanner from './assets/safepal.png'
import tradingBanner from './assets/trading.png'
import { type CampaignWeek, mayTradingWeeks, nearIntentWeeks, raffleWeeks, safepalWeeks, stipWeeks } from './timelines'

const stipInfo = {
  year: 2024,
  baseWeek: 27,
  reward: {
    chainId: ChainId.ARBITRUM,
    symbol: 'ARB',
    logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/11841.png',
    address: '0x912CE59144191C1204E64559FE8253a0e49E6548', // ARB
    decimals: 18,
  },
  weeks: stipWeeks,
  program: 'stip' as const,
}

const rewardKNC = {
  chainId: ChainId.BASE,
  symbol: 'KNC',
  logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/9444.png',
  address: KNC[ChainId.BASE].address,
  decimals: KNC[ChainId.BASE].decimals,
}

export enum CampaignType {
  SafePal = 'SafePal',
  Raffle = 'Raffle',
  NearIntents = 'NearIntents',
  MayTrading = 'MayTrading',
  Aggregator = 'Aggregator',
  LimitOrder = 'LimitOrder',
  Referrals = 'Referrals',
}

type CampaignConfig = {
  year: number
  baseWeek: number
  reward: {
    chainId: ChainId
    address: string
    symbol: string
    decimals: number
    logo: string
  }
  type: CampaignType
  ctaText: JSX.Element
  weeks: CampaignWeek[]
  program?: 'stip' | 'grind/base'
  campaign?: 'trading-incentive' | 'limit-order-farming' | 'referral-program'
  url?: string

  banner: string
  ctaLink: string
  title: JSX.Element
  apiKey?: string
}

export const campaignConfig: Record<CampaignType, CampaignConfig> = {
  [CampaignType.SafePal]: {
    year: 2026,
    baseWeek: 10,
    reward: rewardKNC,
    ctaLink: '/swap',
    ctaText: <Trans>Join Now</Trans>,
    type: CampaignType.SafePal,
    weeks: safepalWeeks,
    banner: safepalBanner,
    title: <Trans>SafePal Campaign</Trans>,
  },
  [CampaignType.Raffle]: {
    year: 2025,
    baseWeek: 45,
    reward: rewardKNC,
    ctaLink: '/swap',
    ctaText: <Trans>Join Now</Trans>,
    type: CampaignType.Raffle,
    weeks: raffleWeeks,
    banner: isMobile ? raffleBannerMobile : raffleBanner,
    title: <Trans>Weekly Rewards</Trans>,
  },
  [CampaignType.NearIntents]: {
    year: 2025,
    baseWeek: 29,
    reward: {
      chainId: ChainId.BASE,
      address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
      symbol: 'USDT',
      logo: 'https://storage.googleapis.com/ks-setting-1d682dca/c4a56ed4-79bd-4af9-9ea5-c691fd560ef8.png',
      decimals: 6,
    },
    type: CampaignType.NearIntents,
    ctaText: <Trans>Trade Now</Trans>,
    weeks: nearIntentWeeks,
    url: 'https://kyberswap-near-intents.kyberengineering.io/api/v1',
    banner: isMobile ? nearIntentBannerMobile : nearIntentBanner,
    ctaLink: '/cross-chain',
    title: <Trans>Cross-Chain Race x NEAR Intents</Trans>,
  },
  [CampaignType.MayTrading]: {
    ctaLink: '/swap/base',
    baseWeek: 21,
    year: 2025,
    reward: rewardKNC,
    ctaText: <Trans>Trade Now</Trans>,
    type: CampaignType.MayTrading,
    weeks: mayTradingWeeks,
    program: 'grind/base',
    campaign: 'trading-incentive',
    banner: mayTradingBanner,
    title: <Trans>May Trading Campaign</Trans>,
  },
  [CampaignType.Aggregator]: {
    ...stipInfo,
    ctaLink: '/swap/arbitrum/eth-to-arb',
    ctaText: <Trans>Trade Now</Trans>,
    type: CampaignType.Aggregator,
    campaign: 'trading-incentive' as const,
    banner: tradingBanner,
    title: <Trans>Aggregator Trading Campaign</Trans>,
  },
  [CampaignType.LimitOrder]: {
    ...stipInfo,
    ctaLink: '/limit/arbitrum',
    ctaText: <Trans>Place Order</Trans>,
    type: CampaignType.LimitOrder,
    campaign: 'limit-order-farming' as const,
    banner: loBanner,
    title: <Trans>Limit Order Campaign</Trans>,
  },
  [CampaignType.Referrals]: {
    ...stipInfo,
    ctaText: <Trans>Trade Now</Trans>,
    ctaLink: '/swap/arbitrum/eth-to-arb',
    type: CampaignType.Referrals,
    campaign: 'referral-program' as const,
    banner: referralBanner,
    title: <Trans>Referral Program</Trans>,
  },
}
