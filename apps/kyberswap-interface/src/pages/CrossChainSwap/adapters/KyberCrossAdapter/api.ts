import axios, { type AxiosRequestConfig } from 'axios'
import { type Address, type Hash, type Hex } from 'viem'

import { CROSSCHAIN_KYBERCROSS_API } from 'constants/env'

type RequestId = string
type UIntString = string
type TokenReference = string
type JsonObject = Record<string, unknown>

export type ChainName = 'ethereum' | 'arbitrum' | 'base' | 'bsc'
export type BridgeProvider = 'across' | 'relay' | 'mayan' | 'near_intents' | 'cctp_v2' | 'cctp_v2_fast'
type FlowType = 'bridge_only' | 'swap_then_bridge' | 'bridge_then_swap' | 'swap_bridge_swap'
export type RouteState =
  | 'BRIDGE_PENDING'
  | 'BRIDGE_CLAIM_PENDING'
  | 'DST_ACTION_PENDING'
  | 'BRIDGE_EXPIRED'
  | 'BRIDGE_FAILED'
  | 'DST_RECEIVED'
  | 'SWAP_PENDING'
  | 'SWAP_EXPIRED'
  | 'SWAP_UNEXECUTABLE'
  | 'SWAP_REFUND_PENDING'
  | 'SUCCESS'
  | 'REFUNDED'
  | 'FAILED'
export type FundState = 'IN_BRIDGE' | 'IN_DST_ESCROW' | 'SETTLED_OUT' | 'SETTLED_REFUND' | 'UNRECOVERED'
type ActionType = 'wrap_native' | 'unwrap_native' | 'transfer'

export type QuoteRequest = {
  from_chain: ChainName
  from_token: Address
  from_token_decimals: number
  from_address: Address
  to_chain: ChainName
  to_token: Address
  to_token_decimals: number
  amount: UIntString
  to_address?: Address
  refund_address?: Address
  slippage_bps?: number
  partner_fee_recipient?: Address
  partner_fee_bps?: number
  include_bridges?: BridgeProvider[]
  exclude_bridges?: BridgeProvider[]
  all_route_plans?: boolean
}

type RoutePlanRequestSnapshot = {
  from_chain: ChainName
  from_token: Address
  from_token_decimals: number
  from_address: Address
  to_chain: ChainName
  to_token: Address
  to_token_decimals: number
  to_address: Address
  amount: UIntString
  slippage_bps: number
  refund_address?: Address
  partner_fee_recipient?: Address
  partner_fee_bps?: number
}

type FeePlan = {
  type: 'partner_fee' | 'protocol_fee'
  chain: ChainName
  token: TokenReference
  recipient: Address
  rate_bps: number
  charged_on: 'bridge_input' | 'bridge_output'
  expected_amount?: UIntString
  min_amount?: UIntString
}

type SwapIntent = {
  factory: Address
  implementation: Address
  salt: Hash
  intent_hash: Hash
  inbox_address: Address
  intent_params: JsonObject
}

type SwapPlan = {
  token_in: TokenReference
  token_out: TokenReference
  input_amount: UIntString
  expected_output_amount: UIntString
  min_output_amount: UIntString
  metadata: {
    route_id: string
    route_summary: JsonObject
  }
  intent?: SwapIntent
}

type ActionPlan = {
  type: ActionType
  token_in: TokenReference
  token_out: TokenReference
  to_address?: Address
}

type AcrossBridgeMetadata = {
  spoke_pool_address: Address
  input_amount: UIntString
  min_output_amount: UIntString
  dest_chain_id: number
  from_address: Address
  to_address: Address
  exclusive_relayer_address: Address | ''
  quote_timestamp?: number
  fill_deadline?: number
  exclusivity_parameter?: number
  message?: string | null
  quote_expiry_timestamp?: number
}

type CCTPBridgeMetadata = {
  source_domain_id: number
  dest_domain_id: number
  mint_to_address: Address
  dest_caller_address: Address
  max_fee_amount: UIntString
  min_finality_threshold: number
  forward: boolean
  hook_data?: string | null
  protocol_fee_amount: UIntString
  forwarder_fee_amount: UIntString
}

type RelayDepositoryBridgeMetadata = {
  execution_mode: 'depository'
  depository_address: Address
  from_address: Address
  order_id: Hash
}

type RelayDepositAddressBridgeMetadata = {
  execution_mode: 'deposit_address'
  deposit_address: Address
}

type MayanBridgeMetadata = {
  mayan_forwarder_address: Address
  mayan_protocol_address: Address
  protocol_data: string
}

export type NearIntentsBridgeMetadata = {
  deposit_address: string
}

export type BridgeMetadata =
  | AcrossBridgeMetadata
  | CCTPBridgeMetadata
  | RelayDepositoryBridgeMetadata
  | RelayDepositAddressBridgeMetadata
  | MayanBridgeMetadata
  | NearIntentsBridgeMetadata

type BridgePlan = {
  lane_id: string
  provider: BridgeProvider
  from_token: TokenReference
  to_token: TokenReference
  input_amount: UIntString
  expected_output_amount: UIntString
  min_output_amount: UIntString
  metadata: BridgeMetadata
  provider_fee?: UIntString
  expected_fill_time_sec?: number
}

export type RoutePlan = {
  id: string
  request: RoutePlanRequestSnapshot
  flow_type: FlowType
  expected_output_amount: UIntString
  min_output_amount: UIntString
  expires_at: string
  bridge: BridgePlan
  fees?: FeePlan[]
  source_swap?: SwapPlan
  dest_swap?: SwapPlan
  pre_bridge?: ActionPlan[]
  post_bridge?: ActionPlan[]
}

type SwapData = {
  token_in: Address
  token_out: Address
  input_amount?: UIntString
  output_amount: UIntString
}

type OnChainBridgeData = {
  tx_hash: Hash
  token: Address
  amount: UIntString
}

type CCTPClaimData = {
  nonce: string
  message: string
  attestation: string
}

type BridgeData = {
  source: OnChainBridgeData
  dest?: OnChainBridgeData
  cctp?: CCTPClaimData
}

type WithdrawData = {
  token: Address
  withdraw_amount: UIntString
  to_address: Address
}

type RouteExecutionData = {
  source_swap?: SwapData
  bridge?: BridgeData
  dest_swap?: SwapData
  dest_withdraw?: WithdrawData
}

export type TrackingExecution = {
  route_plan_id: string
  from_address: Address
  to_address: Address
  source_chain: ChainName
  dest_chain: ChainName
  flow_type: FlowType
  source_tx_hash: Hash
  token_in: Address
  token_out: Address
  bridge_provider: BridgeProvider
  route_state: RouteState
  fund_state?: FundState
  data: RouteExecutionData
  dest_tx_hash?: Hash | null
}

type TrackingExecutionResponseData = {
  route_execution: TrackingExecution
}

export type ExecutionTx = {
  to: Address
  data: Hex
  value: UIntString
  gas?: UIntString
}

export type BuildResult = {
  tx: ExecutionTx
  expires_at?: string
}

type ErrorBody = {
  code: string
  message: string
  details?: JsonObject
}

export type SuccessResponse<TData> = {
  request_id: RequestId
  success: true
  data: TData
}

type ErrorResponse = {
  request_id: RequestId
  success: false
  error: ErrorBody
}

export type ApiResponse<TData> = SuccessResponse<TData> | ErrorResponse

export type QuoteResponseData = {
  ks_allowance_hub_address: Address
  route_plans: RoutePlan[]
}

export type QuoteResponse = SuccessResponse<QuoteResponseData>
export type BuildResponse = SuccessResponse<BuildResult>
export type ScanTxStatusResponse = SuccessResponse<TrackingExecutionResponseData>

const kyberCrossApiClient = axios.create({
  baseURL: CROSSCHAIN_KYBERCROSS_API,
  headers: {
    'Content-Type': 'application/json',
  },
})

const call = async <TData>(config: AxiosRequestConfig): Promise<SuccessResponse<TData>> => {
  const { data, status } = await kyberCrossApiClient.request<ApiResponse<TData>>({
    validateStatus: () => true,
    ...config,
  })

  if (status < 200 || status >= 300 || !data.success) {
    throw new Error(data.success ? `KyberCross API failed with HTTP ${status}` : data.error.message)
  }

  return data
}

const getQuote = (data: QuoteRequest): Promise<QuoteResponse> =>
  call<QuoteResponseData>({
    method: 'POST',
    url: '/api/v1/quotes',
    data,
  })

const build = (data: RoutePlan): Promise<BuildResponse> =>
  call<BuildResult>({
    method: 'POST',
    url: '/api/v1/builds',
    data,
  })

const scanTxStatus = (txHash: Hash): Promise<ScanTxStatusResponse> =>
  call<TrackingExecutionResponseData>({
    method: 'GET',
    url: '/api/v1/executions',
    params: { source_tx_hash: txHash },
  })

export const kyberCrossApi = {
  getQuote,
  build,
  scanTxStatus,
}
