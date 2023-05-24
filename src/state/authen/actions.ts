import { createAction } from '@reduxjs/toolkit'

import { ConnectedProfile } from 'state/authen/hooks'
import { UserProfile } from 'state/authen/reducer'

export const updatePossibleWalletAddress = createAction<null | string | undefined>('authen/updatePossibleWalletAddress')
export const updateSignedWallet = createAction<undefined | string>('authen/updateSignedWallet')

export const updateProcessingLogin = createAction<boolean>('authen/updateProcessingLogin')

export const updateProfile = createAction<{ profile: UserProfile | undefined; isAnonymous: boolean }>(
  'authen/updateProfile',
)

export const updateAllProfile = createAction<ConnectedProfile[]>('authen/updateAllProfile')
