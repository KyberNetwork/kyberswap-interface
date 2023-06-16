import { createReducer } from '@reduxjs/toolkit'

import { updateConnectingWallet, updatePossibleWalletAddress, updateProcessingLogin, updateProfile } from './actions'

export type UserProfile = { email: string; identityId: string; data: { hasAccessToKyberAI: boolean } }
export interface AuthenState {
  /**
   * useActiveWeb3React slow return account, this wallet is same as account of useActiveWeb3React, when we migrate to web3-react v8, we can remove it
   *  null is checking wallet address
   */
  readonly possibleConnectedWalletAddress: null | string | undefined
  readonly anonymousUserInfo: UserProfile | undefined
  readonly userInfo: UserProfile | undefined
  readonly isLogin: boolean
  readonly pendingAuthentication: boolean
  readonly isConnectingWallet: boolean
}

const DEFAULT_AUTHEN_STATE: AuthenState = {
  possibleConnectedWalletAddress: null,
  anonymousUserInfo: undefined,
  userInfo: undefined,
  isLogin: false,
  pendingAuthentication: true,
  isConnectingWallet: false,
}

export default createReducer(DEFAULT_AUTHEN_STATE, builder =>
  builder
    .addCase(updatePossibleWalletAddress, (state, { payload: possibleConnectedWalletAddress }) => {
      state.possibleConnectedWalletAddress = possibleConnectedWalletAddress
    })
    .addCase(updateConnectingWallet, (state, { payload: connectingWallet }) => {
      state.isConnectingWallet = connectingWallet
    })
    .addCase(updateProcessingLogin, (state, { payload: processing }) => {
      state.pendingAuthentication = processing
    })
    .addCase(updateProfile, (state, { payload: { profile, isAnonymous } }) => {
      if (isAnonymous) {
        state.anonymousUserInfo = profile
        state.userInfo = undefined
      } else {
        state.userInfo = profile
        state.anonymousUserInfo = undefined
      }
      state.isLogin = !isAnonymous
    }),
)
