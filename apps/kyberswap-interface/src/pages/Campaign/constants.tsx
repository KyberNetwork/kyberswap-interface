import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { isMobile } from 'react-device-detect'
import { Text } from 'rebass'

import { KNC } from 'constants/tokens'

import loBanner from './assets/limit_order.png'
import mayTradingBanner from './assets/may_trading.png'
import nearIntentBanner from './assets/near_intents.png'
import nearIntentBannerMobile from './assets/near_intents_mobile.png'
import referralBanner from './assets/referral.png'
import tradingBanner from './assets/trading.png'

export const stipWeeks = [
  {
    value: 37,
    label: (
      <Text>
        <Trans>
          <Text as="span" color="#ffffff">
            Week 10
          </Text>{' '}
          Sep 09 - Sep 15
        </Trans>
      </Text>
    ),
    start: 1725840000,
    end: 1726444800,
  },
  {
    value: 36,
    label: (
      <Text>
        <Trans>
          <Text as="span" color="#ffffff">
            Week 9
          </Text>{' '}
          Sep 02 - Sep 08
        </Trans>
      </Text>
    ),
    start: 1725235200,
    end: 1725840000,
  },
  {
    value: 35,
    label: (
      <Text>
        <Trans>
          <Text as="span" color="#ffffff">
            Week 8
          </Text>{' '}
          Aug 26 - Sep 01
        </Trans>
      </Text>
    ),
    start: 1724630400,
    end: 1725235200,
  },
  {
    value: 34,
    label: (
      <Text>
        <Trans>
          <Text as="span" color="#ffffff">
            Week 7
          </Text>{' '}
          Aug 19 - Aug 25
        </Trans>
      </Text>
    ),
    start: 1724025600,
    end: 1724630400,
  },
  {
    value: 33,
    label: (
      <Text>
        <Trans>
          <Text as="span" color="#ffffff">
            Week 6
          </Text>{' '}
          Aug 12 - Aug 18
        </Trans>
      </Text>
    ),
    start: 1723420800,
    end: 1724025600,
  },
  {
    value: 32,
    label: (
      <Text>
        <Trans>
          <Text as="span" color="#ffffff">
            Week 5
          </Text>{' '}
          Aug 05 - Aug 11
        </Trans>
      </Text>
    ),
    start: 1722816000,
    end: 1723420800,
  },
  {
    value: 31,
    label: (
      <Text>
        <Trans>
          <Text as="span" color="#ffffff">
            Week 4
          </Text>{' '}
          July 29 - Aug 04
        </Trans>
      </Text>
    ),
    start: 1722211200,
    end: 1722816000,
  },
  {
    value: 30,
    label: (
      <Text>
        <Trans>
          <Text as="span" color="#ffffff">
            Week 3
          </Text>{' '}
          July 22 - July 28
        </Trans>
      </Text>
    ),
    start: 1721606400,
    end: 1722211200,
  },
  {
    value: 29,
    label: (
      <Text>
        <Trans>
          <Text as="span" color="#ffffff">
            Week 2
          </Text>{' '}
          July 15 - July 21
        </Trans>
      </Text>
    ),
    start: 1721001600,
    end: 1721606400,
  },
  {
    value: 28,
    label: (
      <Text>
        <Trans>
          <Text as="span" color="#ffffff">
            Week 1
          </Text>{' '}
          July 08 - July 14
        </Trans>
      </Text>
    ),
    start: 1720396800,
    end: 1721001600,
  },
].reverse()

export const mayTradingWeeks = [
  {
    value: 22,
    label: (
      <Text>
        <Trans>
          <Text as="span" color="#ffffff">
            Week 1
          </Text>{' '}
          May 19 - May 25
        </Trans>
      </Text>
    ),
    start: 1748304000,
    end: 1748822400,
  },
]

export const nearIntentWeeks = [
  {
    value: 31,
    label: (
      <Text>
        <Trans>
          <Text as="span" color="#ffffff">
            Week 2
          </Text>{' '}
          Jul 28 - Aug 03
        </Trans>
      </Text>
    ),
    start: 1753660800,
    end: 1754265600,
  },
  {
    value: 30,
    label: (
      <Text>
        <Trans>
          <Text as="span" color="#ffffff">
            Week 1
          </Text>{' '}
          Jul 21 - Jul 27
        </Trans>
      </Text>
    ),
    start: 1753056000,
    end: 1753660800,
  },
].reverse()

export enum CampaignType {
  NearIntents = 'NearIntents',
  MayTrading = 'MayTrading',
  Aggregator = 'Aggregator',
  LimitOrder = 'LimitOrder',
  Referrals = 'Referrals',
}

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

export type CampaignConfig = {
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
  weeks: any[]
  program: 'stip' | 'grind/base'
  campaign: 'trading-incentive' | 'limit-order-farming' | 'referral-program'
  url?: string

  banner: string
  ctaLink: string
  title: JSX.Element
}

export const campaignConfig: Record<CampaignType, CampaignConfig> = {
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
    ctaText: <Trans>Place order</Trans>,
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
  [CampaignType.MayTrading]: {
    ctaLink: '/swap/base',
    baseWeek: 21,
    year: 2025,
    reward: {
      chainId: ChainId.MAINNET,
      symbol: 'KNC',
      logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/9444.png',
      address: KNC[ChainId.MAINNET].address,
      decimals: KNC[ChainId.MAINNET].decimals,
    },
    ctaText: <Trans>Trade Now</Trans>,
    type: CampaignType.MayTrading,
    weeks: mayTradingWeeks,
    program: 'grind/base' as const,
    campaign: 'trading-incentive' as const,
    banner: mayTradingBanner,
    title: <Trans>May Trading Campaign</Trans>,
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
    // dont use for near intents
    program: 'grind/base' as const,
    // dont use too
    campaign: 'trading-incentive' as const,
    url: 'https://kyberswap-near-intents.kyberengineering.io/api/v1',
    banner: isMobile ? nearIntentBannerMobile : nearIntentBanner,
    ctaLink: '/cross-chain',
    title: <Trans>Cross-Chain Race x NEAR Intents</Trans>,
  },
}
