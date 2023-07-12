import { PayloadAction, createSlice } from '@reduxjs/toolkit'

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

export type AutoSignIn = {
  value: boolean
  account: string | undefined
}
export interface AuthenState {
  readonly anonymousUserInfo: UserProfile | undefined
  readonly signedUserInfo: UserProfile | undefined
  readonly isLogin: boolean // is sign in eth
  readonly pendingAuthentication: boolean
  readonly isConnectingWallet: boolean
  readonly showConfirmProfile: boolean
  readonly autoSignIn: AutoSignIn // auto sign in after connect wallet
}

const DEFAULT_AUTHEN_STATE: AuthenState = {
  anonymousUserInfo: undefined,
  signedUserInfo: undefined,
  isLogin: false,
  pendingAuthentication: true,
  isConnectingWallet: false,
  showConfirmProfile: false,
  autoSignIn: {
    value: false,
    account: undefined,
  },
}

const slice = createSlice({
  name: 'authen',
  initialState: DEFAULT_AUTHEN_STATE,
  reducers: {
    updateConnectingWallet: (state, { payload: connectingWallet }: PayloadAction<boolean>) => {
      state.isConnectingWallet = connectingWallet
    },
    updateProcessingLogin: (state, { payload: processing }: PayloadAction<boolean>) => {
      state.pendingAuthentication = processing
    },
    updateProfile: (
      state,
      { payload: { profile, isAnonymous } }: PayloadAction<{ profile: UserProfile | undefined; isAnonymous: boolean }>,
    ) => {
      if (isAnonymous) {
        state.anonymousUserInfo = profile
        state.signedUserInfo = undefined
      } else {
        state.signedUserInfo = profile
        state.anonymousUserInfo = undefined
      }
      state.isLogin = !isAnonymous
    },
    setConfirmChangeProfile: (state, { payload }: PayloadAction<boolean>) => {
      state.showConfirmProfile = payload
    },
    setAutoSignIn: (state, { payload }: PayloadAction<{ value: boolean; account: string | undefined }>) => {
      state.autoSignIn = payload
    },
  },
})

export const authenActions = slice.actions

export default slice.reducer
