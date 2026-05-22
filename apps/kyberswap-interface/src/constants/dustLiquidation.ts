import { ChainId } from '@kyberswap/ks-sdk-core'

// Chains where zap-api's /swap/route endpoint is live.
// Verified by direct probe; revisit when backend rolls out more chains.
export const DUST_SWAP_SUPPORTED_CHAINS: ChainId[] = [
  ChainId.MAINNET,
  ChainId.ARBITRUM,
  ChainId.OPTIMISM,
  ChainId.MATIC,
  ChainId.BASE,
  ChainId.BSCMAINNET,
  ChainId.LINEA,
  ChainId.MANTLE,
  ChainId.SONIC,
  ChainId.BERA,
]

export const isDustSwapSupported = (chainId?: number): boolean =>
  !!chainId && DUST_SWAP_SUPPORTED_CHAINS.includes(chainId as ChainId)

// Default slippage in bips (1%). Higher than swap because dust = many small legs.
export const DUST_DEFAULT_SLIPPAGE_BIPS = 100

// Cap inputs for the sequential (non-EIP-5792) execution path to avoid signature fatigue.
export const DUST_MAX_INPUTS_SEQUENTIAL = 5

// Hard cap regardless of execution path — keep request size sane.
export const DUST_MAX_INPUTS_TOTAL = 20

// Debounce route refetches while the user is fiddling with inputs.
export const DUST_ROUTE_DEBOUNCE_MS = 400
