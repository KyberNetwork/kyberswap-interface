/** Reference: https://docs.socket.tech/integrate/migration-guide */
export enum SocketStatusCode {
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING = 'PENDING',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
  FULFILLED = 'FULFILLED',
  SETTLED = 'SETTLED',
  SUCCESS = 'SUCCESS',
}

type SocketApiResponse<Result> = {
  success: boolean
  statusCode: string | number
  result: Result | null
  message: string | null
}

type SocketToken = {
  chainId: number
  address: string
  name: string
  symbol: string
  decimals: number
  logoURI?: string
  icon?: string
}

type SocketTokenAmount = {
  token: SocketToken
  amount: string
  minAmountOut?: string
  priceInUsd?: string | number
  valueInUsd?: string | number
}

type SocketQuoteUserOp = 'tx' | 'deposit' | 'cex-withdraw'
type SocketQuoteUserOps =
  | SocketQuoteUserOp
  | `${SocketQuoteUserOp},${SocketQuoteUserOp}`
  | `${SocketQuoteUserOp},${SocketQuoteUserOp},${SocketQuoteUserOp}`

export type SocketQuoteParams = {
  userOps: SocketQuoteUserOps
  originChainId: string
  destinationChainId: string
  inputToken: string
  inputAmount: string
  outputToken: string
  receiverAddress: string
  userAddress: string
  slippage?: string
  feeBps?: string
  feeTakerAddress?: string
  includeProvider?: string
  excludeProvider?: string
  refuel?: 'true' | 'false'
  destinationPayload?: `0x${string}`
  destinationGasLimit?: string
  refundAddress?: string
  exchange?: string
}

export type SocketTxRoute = {
  userOp: 'tx' | string
  quoteId: string
  expiresAt?: number
  routeTags?: string[]
  output?: SocketTokenAmount
  estimatedTime?: number
  slippage?: number
  suggestedSlippage?: number
  gasFee?: {
    gasToken?: SocketToken
    gasLimit?: string
    gasPrice?: string
    estimatedFee?: string
    feeInUsd?: string | number
  }
  approval?: {
    spenderAddress: string
    amount: string
    tokenAddress: string
    userAddress: string
  } | null
  txData?: {
    kind?: 'evm_tx' | string
    object?: {
      chainId?: number
      to?: `0x${string}`
      value?: string
      data?: `0x${string}`
    }
  }
  statusCheck?: {
    endpoint: string
    method: string
    intervalSec: number
    maxDurationSec?: number
  }
}

export type SocketQuoteResult = {
  originChainId?: number
  destinationChainId?: number
  userAddress?: string
  receiverAddress?: string
  input?: SocketTokenAmount
  route?: SocketTxRoute
  routes?: SocketTxRoute[]
}

export type SocketQuoteResponse = SocketApiResponse<SocketQuoteResult>

type SocketStatusStep = {
  chainId?: number
  status?: string | null
  txHash?: string | null
  timestamp?: number | null
  userAddress?: string
  receiverAddress?: string
  input?: SocketTokenAmount[]
  output?: SocketTokenAmount[]
}

export type SocketStatusResult = {
  quoteId: string
  userOp: 'tx' | string
  status: string
  statusCode: string
  origin?: SocketStatusStep
  destination?: SocketStatusStep
  routeDetails?: {
    name?: string
    logoURI?: string
  }
  refund?: unknown
}

export type SocketStatusParams = {
  quoteId: string
  includeQuoteDetails?: boolean
}

export type SocketStatusResponse = SocketApiResponse<SocketStatusResult>
