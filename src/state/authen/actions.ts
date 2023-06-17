import { createAction } from '@reduxjs/toolkit'

import { ConnectedProfile } from 'state/authen/hooks'
import { UserProfile } from 'state/authen/reducer'

export const updatePossibleWalletAddress = createAction<null | string | undefined>('authen/updatePossibleWalletAddress')
export const updateConnectingWallet = createAction<boolean>('authen/connectingWallet')
export const updateSignedAccount = createAction<undefined | string>('authen/updateSignedAccount')

export const updateProcessingLogin = createAction<boolean>('authen/updateProcessingLogin')

export const updateProfile = createAction<{ profile: UserProfile | undefined; isAnonymous: boolean }>(
  'authen/updateProfile',
)

export const updateAllProfile = createAction<ConnectedProfile[]>('authen/updateAllProfile')
