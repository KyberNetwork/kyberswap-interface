import { Currency } from '@kyberswap/ks-sdk-core'

import { TokenHolding } from 'components/TokenSelectorModal/hooks/holdingSort'
import { TokenRowExtraMap } from 'components/TokenSelectorModal/types'

export type AggregateBalance = TokenHolding & { waiting: boolean; impersonator?: boolean }
export type AggregateBalances = Record<string, AggregateBalance>
export type ChainSnapshot = {
  currencies: Currency[]
  balances: AggregateBalances
  extras: TokenRowExtraMap
  loading: boolean
}
