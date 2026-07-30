/**
 * Copy-trade write configuration.
 *
 * Contract addresses are placeholders until the deployed factory/controller
 * addresses are wired per chain. While `COPY_TRADE_MOCK_WRITE` is true, no real
 * transaction is broadcast — flows simulate submission end-to-end so the write
 * UX is exercisable without a deployed contract or a connected wallet.
 */

export const COPY_TRADE_MOCK_WRITE = true

/** Phase-1 launch chains. */
export const COPY_TRADE_CHAIN_IDS = [1, 56, 8453] as const

export type CopyTradeChainId = (typeof COPY_TRADE_CHAIN_IDS)[number]

type CopyTradeChainConfig = {
  /** KSFollowerAccountFactory. */
  factory: string
  /** CopyTradeController. */
  controller: string
  /** Fixed quote token (stablecoin) the leader trades against on this chain. */
  quoteToken: string
  quoteTokenSymbol: string
  quoteTokenDecimals: number
}

const PLACEHOLDER = '0x0000000000000000000000000000000000000000'

export const COPY_TRADE_CONTRACTS: Record<CopyTradeChainId, CopyTradeChainConfig> = {
  1: {
    factory: PLACEHOLDER,
    controller: PLACEHOLDER,
    quoteToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    quoteTokenSymbol: 'USDC',
    quoteTokenDecimals: 6,
  },
  56: {
    factory: PLACEHOLDER,
    controller: PLACEHOLDER,
    quoteToken: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    quoteTokenSymbol: 'USDC',
    quoteTokenDecimals: 18,
  },
  8453: {
    factory: PLACEHOLDER,
    controller: PLACEHOLDER,
    quoteToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    quoteTokenSymbol: 'USDC',
    quoteTokenDecimals: 6,
  },
}

export const isCopyTradeChain = (chainId?: number): chainId is CopyTradeChainId =>
  chainId !== undefined && chainId in COPY_TRADE_CONTRACTS

export const getCopyTradeContracts = (chainId?: number): CopyTradeChainConfig | undefined =>
  isCopyTradeChain(chainId) ? COPY_TRADE_CONTRACTS[chainId] : undefined

/** On-chain pause states of the follower account (`FollowerPause` enum). */
export enum FollowerPause {
  NO_PAUSE = 0,
  PAUSE_BUY = 1,
  PAUSE_ALIGNED = 2,
  PAUSE_PERMANENTLY = 3,
}

/** Protocol performance-fee rate shown at opt-in. Backend-configurable; launch default. */
export const COPY_TRADE_FEE_PCT = 8
