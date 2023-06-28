import { createAction } from '@reduxjs/toolkit'

import { UserProfile } from 'state/authen/reducer'

export const updatePossibleWalletAddress = createAction<null | string | undefined>('authen/updatePossibleWalletAddress')
export const updateConnectingWallet = createAction<boolean>('authen/connectingWallet')

export const updateProcessingLogin = createAction<boolean>('authen/updateProcessingLogin')

export const updateProfile = createAction<{ profile: UserProfile | undefined; isAnonymous: boolean }>(
  'authen/updateProfile',
)
