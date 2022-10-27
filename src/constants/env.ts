import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import invariant from 'tiny-invariant'

// required
invariant(process.env.REACT_APP_MAINNET_ENV, 'env REACT_APP_MAINNET_ENV is missing')
invariant(
  process.env.REACT_APP_MAINNET_ENV === 'staging' || process.env.REACT_APP_MAINNET_ENV === 'production',
  'env REACT_APP_MAINNET_ENV is incorrect',
)
export const MAINNET_ENV: 'staging' | 'production' = process.env.REACT_APP_MAINNET_ENV

invariant(process.env.REACT_APP_GOOGLE_RECAPTCHA_KEY, 'env REACT_APP_GOOGLE_RECAPTCHA_KEY is missing')
export const GOOGLE_RECAPTCHA_KEY: string = process.env.REACT_APP_GOOGLE_RECAPTCHA_KEY

invariant(process.env.REACT_APP_PRICE_API, 'env REACT_APP_PRICE_API is missing')
export const PRICE_API: string = process.env.REACT_APP_PRICE_API

invariant(process.env.REACT_APP_AGGREGATOR_API, 'env REACT_APP_AGGREGATOR_API is missing')
export const AGGREGATOR_API: string = process.env.REACT_APP_AGGREGATOR_API

invariant(process.env.REACT_APP_SENTRY_DNS, 'env REACT_APP_SENTRY_DNS is missing')
export const SENTRY_DNS: string = process.env.REACT_APP_SENTRY_DNS

invariant(process.env.REACT_APP_REWARD_SERVICE_API, 'env REACT_APP_REWARD_SERVICE_API is missing')
export const REWARD_SERVICE_API: string = process.env.REACT_APP_REWARD_SERVICE_API

invariant(process.env.REACT_APP_KS_SETTING_API, 'env REACT_APP_KS_SETTING_API is missing')
export const KS_SETTING_API: string = process.env.REACT_APP_KS_SETTING_API
console.log('🚀 namgold ------------------------------------------🚀 namgold')
console.log('🚀 namgold ~ KS_SETTING_API', KS_SETTING_API)
console.log('🚀 namgold ------------------------------------------🚀 namgold')

invariant(process.env.REACT_APP_PRICE_CHART_API, 'env REACT_APP_PRICE_CHART_API is missing')
export const PRICE_CHART_API: string = process.env.REACT_APP_PRICE_CHART_API

invariant(process.env.REACT_APP_AGGREGATOR_STATS_API, 'env REACT_APP_AGGREGATOR_STATS_API is missing')
export const AGGREGATOR_STATS_API: string = process.env.REACT_APP_AGGREGATOR_STATS_API

invariant(process.env.REACT_APP_FIREBASE_API_KEY, 'env REACT_APP_FIREBASE_API_KEY is missing')
export const FIREBASE_API_KEY: string = process.env.REACT_APP_FIREBASE_API_KEY

invariant(process.env.REACT_APP_FIREBASE_AUTH_DOMAIN, 'env REACT_APP_FIREBASE_AUTH_DOMAIN is missing')
export const FIREBASE_AUTH_DOMAIN: string = process.env.REACT_APP_FIREBASE_AUTH_DOMAIN

invariant(process.env.REACT_APP_FIREBASE_PROJECT_ID, 'env REACT_APP_FIREBASE_PROJECT_ID is missing')
export const FIREBASE_PROJECT_ID: string = process.env.REACT_APP_FIREBASE_PROJECT_ID

invariant(process.env.REACT_APP_FIREBASE_STORAGE_BUCKET, 'env REACT_APP_FIREBASE_STORAGE_BUCKET is missing')
export const FIREBASE_STORAGE_BUCKET: string = process.env.REACT_APP_FIREBASE_STORAGE_BUCKET

invariant(process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID, 'env REACT_APP_FIREBASE_MESSAGING_SENDER_ID is missing')
export const FIREBASE_MESSAGING_SENDER_ID: string = process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID

invariant(process.env.REACT_APP_FIREBASE_APP_ID, 'env REACT_APP_FIREBASE_APP_ID is missing')
export const FIREBASE_APP_ID: string = process.env.REACT_APP_FIREBASE_APP_ID

invariant(process.env.REACT_APP_FIREBASE_VAPID_KEY, 'env REACT_APP_FIREBASE_VAPID_KEY is missing')
export const FIREBASE_VAPID_KEY: string = process.env.REACT_APP_FIREBASE_VAPID_KEY

invariant(process.env.REACT_APP_NOTIFICATION_API, 'env REACT_APP_NOTIFICATION_API is missing')
export const NOTIFICATION_API: string = process.env.REACT_APP_NOTIFICATION_API

invariant(process.env.REACT_APP_TRUESIGHT_API, 'env REACT_APP_TRUESIGHT_API is missing')
export const TRUESIGHT_API: string = process.env.REACT_APP_TRUESIGHT_API

invariant(process.env.REACT_APP_TRANSAK_URL, 'env REACT_APP_TRANSAK_URL is missing')
export const TRANSAK_URL: string = process.env.REACT_APP_TRANSAK_URL

invariant(process.env.REACT_APP_TRANSAK_API_KEY, 'env REACT_APP_TRANSAK_API_KEY is missing')
export const TRANSAK_API_KEY: string = process.env.REACT_APP_TRANSAK_API_KEY

invariant(process.env.REACT_APP_TYPE_AND_SWAP_URL, 'env REACT_APP_TYPE_AND_SWAP_URL is missing')
export const TYPE_AND_SWAP_URL: string = process.env.REACT_APP_TYPE_AND_SWAP_URL

invariant(process.env.REACT_APP_MIXPANEL_PROJECT_TOKEN, 'env REACT_APP_MIXPANEL_PROJECT_TOKEN is missing')
export const MIXPANEL_PROJECT_TOKEN: string = process.env.REACT_APP_MIXPANEL_PROJECT_TOKEN

invariant(process.env.REACT_APP_CAMPAIGN_BASE_URL, 'env REACT_APP_CAMPAIGN_BASE_URL is missing')
export const CAMPAIGN_BASE_URL: string = process.env.REACT_APP_CAMPAIGN_BASE_URL

invariant(process.env.REACT_APP_SOLANA_NETWORK, 'env REACT_APP_SOLANA_NETWORK is missing')
invariant(process.env.REACT_APP_SOLANA_NETWORK in WalletAdapterNetwork, 'env REACT_APP_SOLANA_NETWORK is incorrect')
export const SOLANA_NETWORK: keyof typeof WalletAdapterNetwork = process.env
  .REACT_APP_SOLANA_NETWORK as keyof typeof WalletAdapterNetwork

// Not required
export const GTM_ID: string | undefined = process.env.REACT_APP_GTM_ID

export const TAG: string = process.env.REACT_APP_TAG || 'localhost'
