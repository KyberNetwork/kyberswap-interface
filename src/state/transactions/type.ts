import { ChainId } from '@kyberswap/ks-sdk-core'

export interface SerializableTransactionReceipt {
  blockHash: string
  status?: number
}

// ex: approve knc, stake 2 knc
export type TransactionExtraInfo1Token = {
  tokenAddress: string
  tokenSymbol: string
  tokenAmount?: string
  contract?: string // recipient, contract, spender, ...
}

// ex: swap 2knc to 2usdt
export type TransactionExtraInfo2Token = {
  tokenAddressIn: string
  tokenAddressOut: string
  tokenSymbolIn: string
  tokenSymbolOut: string
  tokenAmountIn: string
  tokenAmountOut: string

  tokenLogoURLIn?: string
  tokenLogoURLOut?: string
  rate?: string
  contract?: string // recipient, contract, spender, ...
  chainIdIn?: ChainId
  chainIdOut?: ChainId
  nftId?: string
  zapAmountIn?: string
  zapSymbolIn?: string
}

export type TransactionExtraInfoHarvestFarm = {
  tokenAddressIn?: string
  tokenAddressOut?: string
  tokenSymbolIn?: string
  tokenSymbolOut?: string
  rewards: { tokenAddress: string; tokenSymbol: string; tokenAmount: string }[]
  contract?: string // recipient, contract, spender, ...
}

export type TransactionExtraInfoStakeFarm = {
  pairs: {
    tokenAddressIn: string
    tokenAddressOut: string
    tokenSymbolIn: string
    tokenSymbolOut: string
    tokenAmountIn: string
    tokenAmountOut: string
    poolAddress: string
    nftId: string
  }[]
  contract?: string // recipient, contract, spender, ...
}

export type TransactionExtraBaseInfo = {
  summary?: string
  contract?: string // recipient, contract, spender, ...
}

// structure data, let's create a new type if your transaction does not match 1 of 3 template
export type TransactionExtraInfo = (
  | TransactionExtraInfo1Token
  | TransactionExtraInfo2Token
  | TransactionExtraBaseInfo
  | TransactionExtraInfoHarvestFarm
  | TransactionExtraInfoStakeFarm
) & {
  needCheckSubgraph?: boolean
  arbitrary?: any // To store anything arbitrary, so it has any type
}

export interface TransactionDetails {
  hash: string
  type: TRANSACTION_TYPE
  receipt?: SerializableTransactionReceipt
  lastCheckedBlockNumber?: number
  addedTime: number
  confirmedTime?: number
  from: string
  to?: string
  data?: string
  nonce?: number
  sentAtBlock?: number
  extraInfo?: TransactionExtraInfo
  chainId: ChainId
}

export interface GroupedTxsByHash {
  [firstTxHash: string]: TransactionDetails[] | undefined
}

export type TransactionHistory = {
  hash: string
  desiredChainId?: ChainId // ChainID after switching.
  type: TRANSACTION_TYPE
  firstTxHash?: string
  extraInfo?: TransactionExtraInfo
}

export type TransactionPayload = TransactionHistory & {
  from: string
  to?: string
  nonce?: number
  data?: string
  sentAtBlock?: number
  chainId: ChainId
}

export enum TRANSACTION_TYPE {
  WRAP_TOKEN = 'Wrap Token',
  UNWRAP_TOKEN = 'Unwrap Token',
  APPROVE = 'Approve',
  BRIDGE = 'Bridge Token',
  CROSS_CHAIN_SWAP = 'Cross-Chain Swap',
  SWAP = 'Swap',

  CLASSIC_CREATE_POOL = 'Classic Create Pool',
  ELASTIC_CREATE_POOL = 'Elastic Create Pool',
  CLASSIC_ADD_LIQUIDITY = 'Classic Add Liquidity',
  ELASTIC_ADD_LIQUIDITY = 'Elastic Add Liquidity',
  CLASSIC_REMOVE_LIQUIDITY = 'Classic Remove Liquidity',
  ELASTIC_REMOVE_LIQUIDITY = 'Elastic Remove Liquidity',
  ELASTIC_INCREASE_LIQUIDITY = 'Elastic Increase Liquidity',
  ELASTIC_ZAP_IN_LIQUIDITY = 'Elastic Zap-in Liquidity',
  ELASTIC_COLLECT_FEE = 'Elastic Collect Fee',

  STAKE = 'Stake Into Farm',
  UNSTAKE = 'Unstake From Farm',

  HARVEST = 'Harvest',
  CLAIM_REWARD = 'Claim Reward',
  ELASTIC_DEPOSIT_LIQUIDITY = 'Elastic Deposit Liquidity',
  ELASTIC_WITHDRAW_LIQUIDITY = 'Elastic Withdraw Liquidity',
  ELASTIC_FORCE_WITHDRAW_LIQUIDITY = 'Elastic Force Withdraw Liquidity',

  KYBERDAO_STAKE = 'KyberDAO Stake',
  KYBERDAO_UNSTAKE = 'KyberDAO Unstake',
  KYBERDAO_DELEGATE = 'KyberDAO Delegate',
  KYBERDAO_UNDELEGATE = 'KyberDAO Undelegate',
  KYBERDAO_MIGRATE = 'KyberDAO Migrate',
  KYBERDAO_VOTE = 'KyberDAO Vote',
  KYBERDAO_CLAIM = 'KyberDAO Claim Voting Reward',
  KYBERDAO_CLAIM_GAS_REFUND = 'Gas Refund',

  CANCEL_LIMIT_ORDER = 'Cancel Limit Order',
  TRANSFER_TOKEN = 'Send',
}
