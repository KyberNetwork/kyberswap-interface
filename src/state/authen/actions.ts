import { SessionData } from '@kybernetwork/oauth2'
import { createAction } from '@reduxjs/toolkit'

export const updatePossibleWalletAddress = createAction<null | string | undefined>('authen/updatePossibleWalletAddress')

export const updateSession = createAction<SessionData>('authen/setSession')

export const updateProcessingLogin = createAction<boolean>('authen/updateProcessingLogin')
