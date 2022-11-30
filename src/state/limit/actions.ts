import { Currency } from '@kyberswap/ks-sdk-core'
import { createAction } from '@reduxjs/toolkit'

export const setLimitCurrency = createAction<{ currencyIn: Currency | undefined; currencyOut: Currency | undefined }>(
  'limit/setLimitCurrency',
)
