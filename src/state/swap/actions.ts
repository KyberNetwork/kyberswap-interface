import { createAction } from '@reduxjs/toolkit'

import { Aggregator } from 'utils/aggregator'

export enum Field {
  INPUT = 'INPUT',
  OUTPUT = 'OUTPUT',
}

export const resetSelectCurrency = createAction<{ field: Field }>('swap/resetSelectCurrency')

export const switchCurrencies = createAction<void>('swap/switchCurrencies')
export const switchCurrenciesV2 = createAction<void>('swap/switchCurrenciesV2')
export const typeInput = createAction<{ field: Field; typedValue: string }>('swap/typeInput')
export const replaceSwapState = createAction<{
  field: Field
  typedValue?: string
  inputCurrencyId?: string
  outputCurrencyId?: string
  recipient: string | null
}>('swap/replaceSwapState')
export const setRecipient = createAction<{ recipient: string | null }>('swap/setRecipient')
export const setTrendingSoonShowed = createAction('swap/setTrendingSoonShowed')
export const setTrade = createAction<{ trade: Aggregator | undefined }>('swap/setTrade')
