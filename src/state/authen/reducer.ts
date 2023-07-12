import { createReducer } from '@reduxjs/toolkit'

import { setConfirmChangeProfile, updateConnectingWallet, updateProcessingLogin, updateProfile } from './actions'

export type UserProfile = {
  email: string
  identityId: string
  telegramUsername: string
  nickname: string
  avatarUrl: string
  data: { hasAccessToKyberAI: boolean }
}
export type ConfirmProfile = {
  showModal: boolean
}

export interface AuthenState {
  readonly anonymousUserInfo: UserProfile | undefined
  readonly signedUserInfo: UserProfile | undefined
  readonly isLogin: boolean // is sign in eth
  readonly pendingAuthentication: boolean
  readonly isConnectingWallet: boolean
  readonly showConfirmProfile: boolean
}

const DEFAULT_AUTHEN_STATE: AuthenState = {
  anonymousUserInfo: undefined,
  signedUserInfo: undefined,
  isLogin: false,
  pendingAuthentication: true,
  isConnectingWallet: false,
  showConfirmProfile: false,
}

export default createReducer(DEFAULT_AUTHEN_STATE, builder =>
  builder
    .addCase(updateConnectingWallet, (state, { payload: connectingWallet }) => {
      state.isConnectingWallet = connectingWallet
    })
    .addCase(updateProcessingLogin, (state, { payload: processing }) => {
      state.pendingAuthentication = processing
    })
    .addCase(updateProfile, (state, { payload: { profile, isAnonymous } }) => {
      if (isAnonymous) {
        state.anonymousUserInfo = profile
        state.signedUserInfo = undefined
      } else {
        state.signedUserInfo = profile
        state.anonymousUserInfo = undefined
      }
      state.isLogin = !isAnonymous
    })
    .addCase(setConfirmChangeProfile, (state, { payload }) => {
      state.showConfirmProfile = payload
    }),
)
