import { LoginMethod } from '@kybernetwork/oauth2'
import { createReducer } from '@reduxjs/toolkit'

import { updatePossibleWalletAddress, updateProcessingLogin, updateProfile, updateSession } from './actions'

export type UserProfile = { email: string }
export interface AuthenState {
  readonly possibleConnectedWalletAddress: null | string | undefined // null is checking
  readonly anonymousUserInfo: { username: string } | undefined
  readonly userInfo: { wallet_address: string } | undefined
  readonly isLogin: boolean
  readonly processing: boolean
  readonly profile: UserProfile | undefined
}

const DEFAULT_AUTHEN_STATE: AuthenState = {
  possibleConnectedWalletAddress: null,
  anonymousUserInfo: undefined,
  userInfo: undefined,
  isLogin: false,
  processing: true,
  profile: undefined,
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
    })
    .addCase(updateProcessingLogin, (state, { payload: processing }) => {
      state.processing = processing
    })
    .addCase(updateProfile, (state, { payload: profile }) => {
      state.profile = profile
    }),
)
