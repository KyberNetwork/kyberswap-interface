import { PayloadAction, createSlice } from '@reduxjs/toolkit'

import { UserProfile } from 'state/authen/reducer'

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

export type SignedAccountParams = { account: undefined | string; method: string }

const slice = createSlice({
  name: 'profile',
  initialState: DEFAULT_PROFILE_STATE,
  reducers: {
    updateSignedAccount: (state, { payload: { account, method } }: PayloadAction<SignedAccountParams>) => {
      state.signedAccount = account
      state.signedMethod = method
    },
    setKeepCurrentProfile: (state, { payload }: PayloadAction<boolean>) => {
      state.isKeepCurrentProfile = payload
    },
    setLoginRedirectUrl: (state, { payload }: PayloadAction<string>) => {
      state.loginRedirectUrl = payload
    },
    setImportToken: (state, { payload }: PayloadAction<Record<string, string>>) => {
      state.importToken = payload
    },
    setProfileMap: (state, { payload }: PayloadAction<CacheProfile>) => {
      state.profileMap = payload
    },
  },
})

export const profileActions = slice.actions
export default slice.reducer
