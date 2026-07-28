import { ChainId } from '@kyberswap/ks-sdk-core'
import { createSlice } from '@reduxjs/toolkit'

import { TopToken } from './type'

type TopTokenState = {
  [chainId in ChainId]: TopToken[] | undefined
}

const slice = createSlice({
  name: 'topTokens',
  initialState: {} as TopTokenState,
  reducers: {},
})

export default slice.reducer
