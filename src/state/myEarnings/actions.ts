import { ChainId } from '@kyberswap/ks-sdk-core'
import { createAction } from '@reduxjs/toolkit'

import { TimePeriod } from './reducer'

export const selectChains = createAction<ChainId[]>('myEarnings/selectChains')
export const selectTimePeriod = createAction<TimePeriod>('myEarnings/selectTimePeriod')
