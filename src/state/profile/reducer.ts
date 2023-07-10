import { createReducer } from '@reduxjs/toolkit'

import { UserProfile } from 'state/authen/reducer'

import {
  setImportToken,
  setKeepCurrentProfile,
  setLoginRedirectUrl,
  setProfileMap,
  updateSignedAccount,
} from './actions'

export type ProfileMap = { [address: string]: UserProfile }
export type CacheProfile = {
  wallet: ProfileMap
  guest: ProfileMap
}

export interface ProfileState {
  readonly signedAccount: undefined | string
  readonly signedMethod: undefined | string
  readonly isKeepCurrentProfile: boolean
  readonly loginRedirectUrl: string
  readonly importToken: {
    [key: string]: string
  }
  readonly profileMap: CacheProfile
}
// todo review all unused state
const DEFAULT_PROFILE_STATE: ProfileState = {
  signedAccount: undefined,
  signedMethod: undefined,

  isKeepCurrentProfile: false,
  loginRedirectUrl: '',
  importToken: {},
  profileMap: {
    wallet: {},
    guest: {},
  },
}

export default createReducer(DEFAULT_PROFILE_STATE, builder =>
  builder
    .addCase(updateSignedAccount, (state, { payload: { account, method } }) => {
      state.signedAccount = account
      state.signedMethod = method
    })
    .addCase(setKeepCurrentProfile, (state, { payload }) => {
      state.isKeepCurrentProfile = payload
    })
    .addCase(setLoginRedirectUrl, (state, { payload }) => {
      state.loginRedirectUrl = payload
    })
    .addCase(setImportToken, (state, { payload }) => {
      state.importToken = payload
    })
    .addCase(setProfileMap, (state, { payload }) => {
      state.profileMap = payload
    }),
)
