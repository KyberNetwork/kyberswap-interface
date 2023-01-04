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
  tracking?: any
}

// ex: swap 2knc to 2usdt
export type TransactionExtraInfo2Token = {
  tokenAddressIn: string
  tokenAddressOut: string
  tokenSymbolIn: string
  tokenSymbolOut: string
  tokenAmountIn: string
  tokenAmountOut: string

  contract?: string // recipient, contract, spender, ...
  chainIdIn?: ChainId
  chainIdOut?: ChainId
  tracking?: any
}

export type TransactionExtraBaseInfo = {
  summary?: string
  contract?: string // recipient, contract, spender, ...
  tracking?: any
}

// structure data, let's create a new type if your transaction does not match 1 of 3 template
export type TransactionExtraInfo = TransactionExtraInfo1Token | TransactionExtraInfo2Token | TransactionExtraBaseInfo

export interface TransactionDetails {
  hash: string
  type?: TRANSACTION_TYPE
  summary?: string
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
  needCheckSubgraph?: boolean
  group: TRANSACTION_GROUP
  chainId: ChainId
}

export interface GroupedTxsByHash {
  [firstTxHash: string]: TransactionDetails[] | undefined
}

export type TransactionHistory = {
  hash: string
  desiredChainId?: ChainId // ChainID after switching.
  type: TRANSACTION_TYPE
  summary?: string
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

/**
 * when you put a new type, let's do:
 * 1. classify it by putting it into GROUP_TRANSACTION_BY_TYPE
 * 2. update function render summary for it (=> this variable SUMMARY)
 * 3. add a case in renderDescription function in TransactionItem.tsx to render transaction detail by type
 * if you forgot. typescript error will occur.
 */
export enum TRANSACTION_TYPE {
  WRAP_TOKEN = 'Wrap',
  UNWRAP_TOKEN = 'Unwrap',
  APPROVE = 'Approve',
  BRIDGE = 'Bridge Transaction',
  SWAP = 'Swap',

  CREATE_POOL = 'Create pool',
  ELASTIC_CREATE_POOL = 'Elastic Create pool',
  ADD_LIQUIDITY = 'Add liquidity',
  ELASTIC_ADD_LIQUIDITY = 'Elastic Add liquidity',
  REMOVE_LIQUIDITY = 'Remove liquidity',
  ELASTIC_REMOVE_LIQUIDITY = 'Elastic Remove liquidity',
  INCREASE_LIQUIDITY = 'Increase liquidity',
  COLLECT_FEE = 'Collect fee',
  STAKE = 'Stake',
  UNSTAKE = 'Unstake',
  HARVEST = 'Harvest',
  CLAIM_REWARD = 'Claim',
  DEPOSIT = 'Deposit',
  WITHDRAW = 'Withdraw',
  FORCE_WITHDRAW = 'ForceWithdraw',
  SETUP_SOLANA_SWAP = 'Setting up your swap',

  KYBERDAO_STAKE = 'KyberDAO Stake',
  KYBERDAO_UNSTAKE = 'KyberDAO Unstake',
  KYBERDAO_DELEGATE = 'KyberDAO Delegate',
  KYBERDAO_UNDELEGATE = 'KyberDAO Undelegate',
  KYBERDAO_MIGRATE = 'KyberDAO Migrate',
  KYBERDAO_VOTE = 'KyberDAO Vote',
  KYBERDAO_CLAIM = 'KyberDAO Claim',

  CANCEL_LIMIT_ORDER = 'Cancel Limit Order',
  TRANSFER_TOKEN = 'Transfer',
}

const GROUP_TRANSACTION_BY_TYPE = {
  SWAP: [
    TRANSACTION_TYPE.SWAP,
    TRANSACTION_TYPE.WRAP_TOKEN,
    TRANSACTION_TYPE.UNWRAP_TOKEN,
    TRANSACTION_TYPE.SETUP_SOLANA_SWAP,
  ],
  LIQUIDITY: [
    TRANSACTION_TYPE.ADD_LIQUIDITY,
    TRANSACTION_TYPE.CREATE_POOL,
    TRANSACTION_TYPE.ELASTIC_CREATE_POOL,
    TRANSACTION_TYPE.ELASTIC_ADD_LIQUIDITY,
    TRANSACTION_TYPE.REMOVE_LIQUIDITY,
    TRANSACTION_TYPE.ELASTIC_REMOVE_LIQUIDITY,
    TRANSACTION_TYPE.INCREASE_LIQUIDITY,
    TRANSACTION_TYPE.DEPOSIT,
    TRANSACTION_TYPE.WITHDRAW,
    TRANSACTION_TYPE.STAKE,
    TRANSACTION_TYPE.UNSTAKE,
    TRANSACTION_TYPE.HARVEST,
    TRANSACTION_TYPE.COLLECT_FEE,
    TRANSACTION_TYPE.FORCE_WITHDRAW,
  ],
  TRANSFER: [TRANSACTION_TYPE.TRANSFER_TOKEN],
  KYBERDAO: [
    TRANSACTION_TYPE.KYBERDAO_STAKE,
    TRANSACTION_TYPE.KYBERDAO_UNSTAKE,
    TRANSACTION_TYPE.KYBERDAO_DELEGATE,
    TRANSACTION_TYPE.KYBERDAO_UNDELEGATE,
    TRANSACTION_TYPE.KYBERDAO_MIGRATE,
    TRANSACTION_TYPE.KYBERDAO_VOTE,
    TRANSACTION_TYPE.KYBERDAO_CLAIM,
  ],
  OTHER: [
    // to make sure you don't forgot
    TRANSACTION_TYPE.APPROVE,
    TRANSACTION_TYPE.CLAIM_REWARD,
    TRANSACTION_TYPE.BRIDGE,
    TRANSACTION_TYPE.CANCEL_LIMIT_ORDER,
  ],
}

export enum TRANSACTION_GROUP {
  SWAP = 'swap',
  LIQUIDITY = 'liquidity',
  TRANSFER = 'transfer',
  KYBERDAO = 'kyber_dao',
  OTHER = 'other',
}

export const getTransactionGroupByType = (type: TRANSACTION_TYPE) => {
  if (GROUP_TRANSACTION_BY_TYPE.SWAP.includes(type)) return TRANSACTION_GROUP.SWAP
  if (GROUP_TRANSACTION_BY_TYPE.LIQUIDITY.includes(type)) return TRANSACTION_GROUP.LIQUIDITY
  if (GROUP_TRANSACTION_BY_TYPE.TRANSFER.includes(type)) return TRANSACTION_GROUP.TRANSFER
  if (GROUP_TRANSACTION_BY_TYPE.KYBERDAO.includes(type)) return TRANSACTION_GROUP.KYBERDAO
  return TRANSACTION_GROUP.OTHER
}

const totalType = Object.values(TRANSACTION_TYPE).length
const totalClassify = Object.values(GROUP_TRANSACTION_BY_TYPE).reduce((total, element) => total + element.length, 0)
if (totalType !== totalClassify) {
  throw new Error('Please set up group of the new transaction. Put your new type into GROUP_TRANSACTION_BY_TYPE')
}
