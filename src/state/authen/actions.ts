import { SessionData } from '@kybernetwork/oauth2'
import { createAction } from '@reduxjs/toolkit'

import { UserProfile } from 'state/authen/reducer'

export const updatePossibleWalletAddress = createAction<null | string | undefined>('authen/updatePossibleWalletAddress')

export const updateSession = createAction<SessionData>('authen/setSession')

export const updateProcessingLogin = createAction<boolean>('authen/updateProcessingLogin')

export const updateProfile = createAction<UserProfile>('authen/updateProfile')
