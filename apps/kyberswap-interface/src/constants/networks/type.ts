import { ChainId } from '@kyberswap/ks-sdk-core'

import { EnvKeys } from 'constants/env'
import { ChainState } from 'hooks/useChainsConfig'

export interface NativeToken {
  readonly symbol: string
  readonly name: string
  readonly logo: string
  readonly decimal: number
  /**
   * Set on chains where the native asset also exposes a built-in ERC-20 interface backed by the same
   * balance, so no wrapped-native contract exists (Arc, where USDC is native). On those chains the
   * app treats `WETH[chainId]` as the canonical currency and never lists the native sentinel, while
   * swaps may still pay through the native interface to skip approvals — see `utils/nativeErc20`.
   */
  readonly erc20Interface?: {
    /**
     * Whether swaps pay through the native interface — sending the sentinel as `tokenIn` with a
     * `msg.value`, so the router needs no allowance.
     */
    readonly payNativeOnSwap: boolean
    /**
     * Raw amount, in the ERC-20 interface's own units, that Max and Half hold back so the account
     * can still pay for the transaction they are funding.
     */
    readonly gasReserve: string
  }
}

export interface NetworkInfo {
  readonly chainId: ChainId

  // route can be used to detect which chain is favored in query param, check out useActiveNetwork.ts
  readonly route: string
  readonly ksSettingRoute: string
  readonly priceRoute: string
  readonly aggregatorRoute: string
  readonly name: string
  readonly icon: string
  readonly iconSelected: string | null
  readonly etherscanUrl: string
  readonly etherscanName: string
  readonly bridgeURL: string
  readonly nativeToken: NativeToken
  readonly coingeckoNetworkId: string | null //https://api.coingecko.com/api/v3/asset_platforms
  readonly coingeckoNativeTokenId: string | null //https://api.coingecko.com/api/v3/coins/list
  readonly dexToCompare: string | null
  readonly limitOrder: null | '*' | EnvKeys[]
  readonly defaultRpcUrl: string

  readonly geckoTermialId: string | null
  readonly state?: ChainState
  readonly multicall: string
  readonly classic: {
    readonly defaultSubgraph: string
    readonly static: {
      readonly zap: string
      readonly router: string
      readonly factory: string
    }
    readonly oldStatic: {
      readonly zap: string
      readonly router: string
      readonly factory: string
    } | null
    readonly dynamic: {
      readonly zap: string
      readonly router: string
      readonly factory: string
    } | null
    readonly claimReward: string | null
    readonly fairlaunch: string[]
    readonly fairlaunchV2: string[]
    readonly fairlaunchV3?: string[]
  }
  readonly elastic: {
    readonly defaultSubgraph: string
    readonly startBlock: number
    readonly coreFactory: string
    readonly nonfungiblePositionManager: string
    readonly tickReader: string
    readonly initCodeHash: string
    readonly quoter: string
    readonly routers: string
    readonly farms: string[]
    readonly farmv2Quoter?: string
    readonly farmV2S?: string[]
    readonly zap?: {
      helper: string
      router: string
      executor: string
      validator: string
    }
    readonly 'farmV2.1S'?: string[]
  }
  readonly averageBlockTimeInSeconds: number
  readonly kyberDAO?: {
    readonly staking: string
    readonly dao: string
    readonly rewardsDistributor: string
    readonly daoStatsApi: string
    readonly KNCAddress: string
    readonly KNCLAddress: string
  }
  readonly accessListEnabled?: boolean
}
