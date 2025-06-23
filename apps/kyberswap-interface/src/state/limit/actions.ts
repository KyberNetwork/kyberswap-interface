import { createAction } from '@reduxjs/toolkit'

import { CreateOrderParam } from 'components/swapv2/LimitOrder/type'

export const pushOrderNeedCreated = createAction<CreateOrderParam>('limit/pushOrderNeedCreated')
export const removeOrderNeedCreated = createAction<number>('limit/removeOrderNeedCreated')

export const setOrderEditing = createAction<CreateOrderParam>('limit/setOrderEditing')
