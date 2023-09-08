import { Currency } from '@kyberswap/ks-sdk-core'
import { createAction } from '@reduxjs/toolkit'

import { CreateOrderParam } from 'components/swapv2/LimitOrder/type'

export const setLimitCurrency = createAction<{ currencyIn: Currency | undefined; currencyOut: Currency | undefined }>(
  'limit/setLimitCurrency',
)
export const pushOrderNeedCreated = createAction<CreateOrderParam>('limit/pushOrderNeedCreated')
export const removeOrderNeedCreated = createAction<number>('limit/removeOrderNeedCreated')

export const setOrderEditing = createAction<CreateOrderParam>('limit/setOrderEditing')

export const setInputAmount = createAction<string>('limit/setInputAmount')
