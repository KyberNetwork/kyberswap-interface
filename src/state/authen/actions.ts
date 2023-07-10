import { createAction } from '@reduxjs/toolkit'

import { ConfirmProfile, UserProfile } from 'state/authen/reducer'

export const updateConnectingWallet = createAction<boolean>('authen/connectingWallet')

export const updateProcessingLogin = createAction<boolean>('authen/updateProcessingLogin')

export const updateProfile = createAction<{ profile: UserProfile | undefined; isAnonymous: boolean }>(
  'authen/updateProfile',
)

export const setConfirmProfile = createAction<ConfirmProfile>('authen/setConfirmProfile')
