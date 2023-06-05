import { createReducer } from '@reduxjs/toolkit'

import { ConnectedProfile } from 'state/authen/hooks'

import {
  updateAllProfile,
  updatePossibleWalletAddress,
  updateProcessingLogin,
  updateProfile,
  updateSignedWallet,
} from './actions'

export type UserProfile = {
  email: string
  identityId: string
  telegramUsername: string
  nickname: string
  avatarUrl: string
  data: { hasAccessToKyberAI: boolean }
}
export interface AuthenState {
  /**
   * useActiveWeb3React slow return account, this wallet is same as account of useActiveWeb3React, when we migrate to web3-react v8, we can remove it
   *  null is checking wallet address
   */
  readonly possibleConnectedWalletAddress: null | string | undefined
  readonly signedWalletAddress: undefined | string
  readonly anonymousUserInfo: UserProfile | undefined
  readonly signedUserInfo: UserProfile | undefined
  readonly isLogin: boolean
  readonly pendingAuthentication: boolean
  readonly profiles: ConnectedProfile[]
}

const DEFAULT_AUTHEN_STATE: AuthenState = {
  possibleConnectedWalletAddress: null,
  signedWalletAddress: undefined,
  anonymousUserInfo: undefined,
  signedUserInfo: undefined,
  isLogin: false,
  pendingAuthentication: true,
  profiles: [],
}

export default createReducer(DEFAULT_AUTHEN_STATE, builder =>
  builder
    .addCase(updatePossibleWalletAddress, (state, { payload: possibleConnectedWalletAddress }) => {
      state.possibleConnectedWalletAddress = possibleConnectedWalletAddress
    })
    .addCase(updateSignedWallet, (state, { payload: signedWalletAddress }) => {
      state.signedWalletAddress = signedWalletAddress
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
    .addCase(updateAllProfile, (state, { payload }) => {
      state.profiles = payload
    }),
)
