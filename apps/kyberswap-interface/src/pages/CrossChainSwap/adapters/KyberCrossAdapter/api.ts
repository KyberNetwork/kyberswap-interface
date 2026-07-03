import axios, { type AxiosRequestConfig } from 'axios'
import { type Address, type Hash, type Hex } from 'viem'

import { CROSSCHAIN_KYBERCROSS_API } from 'constants/env'

type RequestId = string
type UIntString = string
type TokenReference = string
type JsonObject = Record<string, unknown>

export type ChainName = 'ethereum' | 'arbitrum' | 'base' | 'bsc'
export type BridgeProvider = 'across' | 'relay' | 'mayan' | 'near_intents'
type FlowType = 'bridge_only' | 'swap_then_bridge'
type RouteStatus =
  | 'built'
  | 'source_pending'
  | 'source_confirmed'
  | 'bridge_pending'
  | 'destination_pending'
  | 'completed'
  | 'refunded'
  | 'failed'
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
  client_fee_recipient?: Address
  client_fee_bps?: number
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
  client_fee_recipient?: Address
  client_fee_bps?: number
}

type FeePlan = {
  type: 'client'
  chain: ChainName
  token: TokenReference
  recipient: Address
  rate_bps: number
  charged_on: 'bridge_input'
  expected_amount?: UIntString
  min_amount?: UIntString
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
}

type ActionPlan = {
  type: ActionType
  token_in: TokenReference
  token_out: TokenReference
  recipient?: Address
}

type AcrossSpokePoolBridgeMetadata = {
  settlement?: 'spoke_pool'
  spoke_pool: Address
  input_amount: UIntString
  output_amount: UIntString
  destination_chain_id: number
  depositor: Address
  recipient: Address
  exclusive_relayer?: Address
  quote_timestamp?: number
  fill_deadline?: number
  exclusivity_parameter?: number
  message?: string | null
  quote_expiry_timestamp?: number
}

type AcrossExecutionBridgeMetadata = {
  settlement: 'cctp' | 'oft'
  input_amount: UIntString
  output_amount: UIntString
  destination_chain_id: number
  execution_target: Address
  execution_data: string
  quote_expiry_timestamp?: number
  execution_value?: UIntString | null
}

type MayanBridgeMetadata = {
  mayan_forwarder: Address
  mayan_protocol: Address
  protocol_data: string
}

export type NearIntentsBridgeMetadata = {
  deposit_address: string
}

export type BridgeMetadata =
  | AcrossSpokePoolBridgeMetadata
  | AcrossExecutionBridgeMetadata
  | MayanBridgeMetadata
  | NearIntentsBridgeMetadata

type BridgePlan = {
  lane_id: string
  provider: BridgeProvider
  asset_group: string
  token_in: TokenReference
  token_out: TokenReference
  input_amount: UIntString
  expected_output_amount: UIntString
  min_output_amount: UIntString
  metadata: BridgeMetadata
  provider_fee?: UIntString
  expected_fill_time_sec?: number
}

export type RoutePlan = {
  route_id: string
  request: RoutePlanRequestSnapshot
  flow_type: FlowType
  expected_output_amount: UIntString
  min_output_amount: UIntString
  expires_at: string
  bridge: BridgePlan
  status?: RouteStatus
  updated_at?: string
  fees?: FeePlan[]
  source_swap?: SwapPlan
  pre_bridge?: ActionPlan[]
  post_bridge?: ActionPlan[]
}

type SwapDetails = {
  token_in: Address
  token_out: Address
  amount_in: UIntString
  amount_out: UIntString
}

type OnChainBridgeDetails = {
  tx_hash: Hash
  token: Address
  amount: UIntString
}

type BridgeDetails = {
  source: OnChainBridgeDetails
  destination?: OnChainBridgeDetails
}

type RouteExecutionDetails = {
  source_swap?: SwapDetails
  bridge?: BridgeDetails
  dest_swap?: SwapDetails
}

export type TrackingExecution = {
  route_id: string
  sender: Address
  receiver: Address
  source_chain: ChainName
  dest_chain: ChainName
  flow_type: FlowType
  source_tx_hash: Hash
  route_state: RouteStatus
  route_state_details: RouteExecutionDetails
  created_at: string
  updated_at: string
  dest_tx_hash?: Hash | null
  route_plan?: RoutePlan
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
  route_plans: RoutePlan[]
}

export type QuoteResponse = SuccessResponse<QuoteResponseData>
export type BuildResponse = SuccessResponse<BuildResult>
export type ScanTxStatusResponse = SuccessResponse<TrackingExecution>

export type ScanTxStatusParams = {
  include_route_plan?: boolean
}

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

const scanTxStatus = (txHash: Hash, params?: ScanTxStatusParams): Promise<ScanTxStatusResponse> =>
  call<TrackingExecution>({
    method: 'GET',
    url: `/api/v1/scan/tx/${txHash}`,
    params,
  })

export const kyberCrossApi = {
  getQuote,
  build,
  scanTxStatus,
}
