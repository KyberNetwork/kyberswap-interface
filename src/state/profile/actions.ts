import { createAction } from '@reduxjs/toolkit'

import { CacheProfile } from 'state/profile/reducer'

export type SignedAccountParams = { account: undefined | string; method: string }
export const updateSignedAccount = createAction<SignedAccountParams>('profile/updateSignedAccount')

export const setKeepCurrentProfile = createAction<boolean>('profile/setKeepCurrentProfile')
export const setLoginRedirectUrl = createAction<string>('profile/setLoginRedirectUrl')

export const setImportToken = createAction<Record<string, string>>('profile/setImportToken')
export const setProfileMap = createAction<CacheProfile>('profile/setProfileMap')
