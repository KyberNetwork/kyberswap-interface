import { Currency, TradeType } from '@namgold/ks-sdk-core'
import { Trade } from '@namgold/ks-sdk-elastic'

export enum TradeState {
  LOADING,
  INVALID,
  NO_ROUTE_FOUND,
  VALID,
  SYNCING,
}

export interface InterfaceTrade<TInput extends Currency, TOutput extends Currency, TTradeType extends TradeType> {
  state: TradeState
  trade: Trade<TInput, TOutput, TTradeType> | undefined
}
