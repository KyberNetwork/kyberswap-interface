import EtherFiLogo from 'assets/svg/earn/ic_logo_etherfi.svg'
import { AllChainsOption } from 'pages/Earns/hooks/useSupportedDexesAndChains'

import { ChartDataPoint, UserVaultPosition, VaultInfo, WithdrawalStatus } from './types'

const ETH_ICON = 'https://assets.coingecko.com/coins/images/279/small/ethereum.png'
const USDC_ICON = 'https://assets.coingecko.com/coins/images/6319/small/usdc.png'
const USDT_ICON = 'https://assets.coingecko.com/coins/images/325/small/Tether.png'
const BTC_ICON = 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png'

const ETH_CHAIN_ICON = 'https://assets.coingecko.com/coins/images/279/small/ethereum.png'
const ARB_CHAIN_ICON = 'https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg'

export const VAULT_CHAIN_OPTIONS = [
  AllChainsOption,
  { label: 'Ethereum', value: '1', icon: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
  {
    label: 'Arbitrum',
    value: '42161',
    icon: 'https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg',
  },
]

/** Seeded random for deterministic chart data */
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

const generateApyHistory = (baseApy: number, seed: number): ChartDataPoint[] =>
  Array.from({ length: 30 }, (_, i) => ({
    value: Math.max(0.1, baseApy * (0.3 + seededRandom(seed + i) * 0.9)),
  }))

const generateTvlHistory = (baseTvl: number, seed: number): ChartDataPoint[] =>
  Array.from({ length: 30 }, (_, i) => {
    const trend = i / 30
    const noise = (seededRandom(seed + i + 100) - 0.4) * 0.15
    return { value: baseTvl * (0.7 + trend * 0.3 + noise) }
  })

export const SAMPLE_VAULTS: VaultInfo[] = [
  {
    id: 'eth-yield-mainnet',
    token: 'ETH',
    tokenIcon: ETH_ICON,
    chainId: 1,
    chainIcon: ETH_CHAIN_ICON,
    chainName: 'Ethereum',
    label: 'Yield',
    partner: 'ether.fi',
    partnerLogo: EtherFiLogo,
    apy: 2.47,
    tvl: 280_000_000,
    apyHistory: generateApyHistory(2.47, 1),
    tvlHistory: generateTvlHistory(280_000_000, 1),
  },
  {
    id: 'eth-yield-arb',
    token: 'ETH',
    tokenIcon: ETH_ICON,
    chainId: 42161,
    chainIcon: ARB_CHAIN_ICON,
    chainName: 'Arbitrum',
    label: 'Yield',
    partner: 'ether.fi',
    partnerLogo: EtherFiLogo,
    apy: 3.15,
    tvl: 120_000_000,
    apyHistory: generateApyHistory(3.15, 2),
    tvlHistory: generateTvlHistory(120_000_000, 2),
  },
  {
    id: 'usdc-yield-arb',
    token: 'USDC',
    tokenIcon: USDC_ICON,
    chainId: 42161,
    chainIcon: ARB_CHAIN_ICON,
    chainName: 'Arbitrum',
    label: 'Yield',
    partner: 'ether.fi',
    partnerLogo: EtherFiLogo,
    apy: 5.22,
    tvl: 350_000_000,
    apyHistory: generateApyHistory(5.22, 3),
    tvlHistory: generateTvlHistory(350_000_000, 3),
  },
  {
    id: 'usdc-yield-mainnet',
    token: 'USDC',
    tokenIcon: USDC_ICON,
    chainId: 1,
    chainIcon: ETH_CHAIN_ICON,
    chainName: 'Ethereum',
    label: 'Yield',
    partner: 'ether.fi',
    partnerLogo: EtherFiLogo,
    apy: 1.07,
    tvl: 110_000_000,
    apyHistory: generateApyHistory(1.07, 4),
    tvlHistory: generateTvlHistory(110_000_000, 4),
  },
  {
    id: 'usdt-yield-arb',
    token: 'USDT',
    tokenIcon: USDT_ICON,
    chainId: 42161,
    chainIcon: ARB_CHAIN_ICON,
    chainName: 'Arbitrum',
    label: 'Yield',
    partner: 'ether.fi',
    partnerLogo: EtherFiLogo,
    apy: 6.79,
    tvl: 410_000_000,
    apyHistory: generateApyHistory(6.79, 5),
    tvlHistory: generateTvlHistory(410_000_000, 5),
  },
  {
    id: 'btc-yield-mainnet',
    token: 'BTC',
    tokenIcon: BTC_ICON,
    chainId: 1,
    chainIcon: ETH_CHAIN_ICON,
    chainName: 'Ethereum',
    label: 'Yield (soon)',
    partner: 'ether.fi',
    partnerLogo: EtherFiLogo,
    apy: 4.55,
    tvl: 230_000_000,
    apyHistory: generateApyHistory(4.55, 6),
    tvlHistory: generateTvlHistory(230_000_000, 6),
    disabled: true,
  },
]

export const SAMPLE_USER_VAULTS: UserVaultPosition[] = [
  {
    ...SAMPLE_VAULTS[0],
    balance: 2.8,
    balanceUsd: 5600,
    earned: 0.05,
    earnedUsd: 11.2,
    processingTimeSeconds: 2 * 86400 + 12 * 3600 + 8 * 60 + 2,
    withdrawalStatus: WithdrawalStatus.REQUESTED,
  },
  {
    ...SAMPLE_VAULTS[1],
    id: 'usdc-yield-arb-user',
    token: 'USDC',
    tokenIcon: USDC_ICON,
    balance: 1200,
    balanceUsd: 1200,
    earned: 12,
    earnedUsd: 12,
    processingTimeSeconds: -1,
    withdrawalStatus: WithdrawalStatus.PENDING,
  },
  {
    ...SAMPLE_VAULTS[2],
    id: 'usdt-yield-arb-user',
    token: 'USDT',
    tokenIcon: USDT_ICON,
    balance: 3000,
    balanceUsd: 3000,
    earned: 32,
    earnedUsd: 32,
    processingTimeSeconds: -1,
    withdrawalStatus: WithdrawalStatus.COMPLETED,
    completedAt: '2026-03-28 14:32',
    txHash: '0x8c4b7a2e3f1d6c9a0b5e8f2d4a7c1e3b6f9d2a5c8e1b4d7f0a3c6e9b2d5f22b5',
  },
]
