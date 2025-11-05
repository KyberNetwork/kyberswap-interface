export enum Metric {
  FeeYield = 'fee_yield',
  PoolPrice = 'pool_price',
  Time = 'time',
}

export enum ConditionType {
  And = 'and',
  Or = 'or',
}

export enum OrderStatus {
  OrderStatusOpen = 'OrderStatusOpen',
  OrderStatusDone = 'OrderStatusDone',
  OrderStatusCancelled = 'OrderStatusCancelled',
  OrderStatusExpired = 'OrderStatusExpired',
}

export interface SmartExitFilter {
  chainIds?: string
  status?: string
  dexTypes?: string
  page: number
}

export interface SmartExitFee {
  protocol: { percentage: number; category: string }
  gas: { percentage: number; usd: number; wei: string }
}

export interface SmartExitCondition {
  logical: {
    op: ConditionType
    conditions: Array<{
      field: {
        type: Metric
        value: any
      }
    }>
  }
}

export interface SmartExitOrder {
  id: string
  chainId: number
  userWallet: string
  dexType: string
  poolId: string
  positionId: string
  removeLiquidity: string
  unwrap: boolean
  condition: SmartExitCondition
  status: OrderStatus
  createdAt: number
  updatedAt: number
  deadline: number
}
