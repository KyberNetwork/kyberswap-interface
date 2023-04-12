import { ChainId } from '@kyberswap/ks-sdk-core'
import { createAction } from '@reduxjs/toolkit'

export const selectChains = createAction<ChainId[]>('myEarnings/selectChains')
