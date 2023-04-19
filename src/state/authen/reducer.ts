import { LoginMethod } from '@kybernetwork/oauth2'
import { createReducer } from '@reduxjs/toolkit'

import { updatePossibleWalletAddress, updateSession } from './actions'

export interface AuthenState {
  readonly possibleConnectedWalletAddress: null | string | undefined // null is checking
  readonly anonymousUserInfo: { username: string } | undefined
  readonly userInfo: { wallet_address: string } | undefined
  readonly isLogin: boolean
}

const DEFAULT_AUTHEN_STATE: AuthenState = {
  possibleConnectedWalletAddress: null,
  anonymousUserInfo: undefined,
  userInfo: undefined,
  isLogin: false,
}

export default createReducer(DEFAULT_AUTHEN_STATE, builder =>
  builder
    .addCase(updatePossibleWalletAddress, (state, { payload: possibleConnectedWalletAddress }) => {
      state.possibleConnectedWalletAddress = possibleConnectedWalletAddress
    })
    .addCase(updateSession, (state, { payload: session }) => {
      if (session.loginMethod === LoginMethod.ANONYMOUS) state.anonymousUserInfo = session.userInfo
      else state.userInfo = session.userInfo
      state.isLogin = !!state.userInfo
    }),
)
