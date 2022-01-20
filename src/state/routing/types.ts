import { Trade } from '@vutien/dmm-v3-sdk'
import { Currency, TradeType } from '@vutien/sdk-core'
import { Route } from '@vutien/dmm-v2-sdk'
import { Route as ProAmmRoute } from '@vutien/dmm-v3-sdk'

export enum TradeState {
  LOADING,
  INVALID,
  NO_ROUTE_FOUND,
  VALID,
  SYNCING
}

export interface InterfaceTrade<TInput extends Currency, TOutput extends Currency, TTradeType extends TradeType> {
  state: TradeState
  trade: Trade<TInput, TOutput, TTradeType> | undefined
}
