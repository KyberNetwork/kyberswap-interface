import { useCallback } from 'react'
import { useSelector } from 'react-redux'

import { AppState } from 'state'
import { useAppDispatch } from 'state/hooks'
import {
  SignedAccountParams,
  setImportToken,
  setKeepCurrentProfile,
  setLoginRedirectUrl,
  updateSignedAccount,
} from 'state/profile/actions'

export function useIsKeepCurrentProfile(): [boolean, () => void] {
  const dispatch = useAppDispatch()
  const isKeepCurrentProfile = useSelector((state: AppState) => state.profile.isKeepCurrentProfile)

  const toggle = useCallback(() => {
    dispatch(setKeepCurrentProfile(!isKeepCurrentProfile))
  }, [dispatch, isKeepCurrentProfile])

  return [isKeepCurrentProfile, toggle]
}

export function useLoginRedirectUrl(): [string, (v?: string) => void] {
  const dispatch = useAppDispatch()
  const loginRedirectUrl = useSelector((state: AppState) => state.profile.loginRedirectUrl)

  const setValue = useCallback(
    (v: string = window.location.href) => {
      dispatch(setLoginRedirectUrl(v))
    },
    [dispatch],
  )

  return [loginRedirectUrl, setValue]
}

export function useImportToken() {
  const dispatch = useAppDispatch()
  const importToken = useSelector((state: AppState) => state.profile.importToken)

  const getImportToken = useCallback(
    (account: string) => {
      return importToken?.[account]
    },
    [importToken],
  )

  const saveImportToken = useCallback(
    (account: string, token: string) => {
      dispatch(setImportToken({ ...importToken, [account]: token }))
    },
    [importToken, dispatch],
  )

  const removeImportToken = useCallback(
    (account: string) => {
      const clone = { ...importToken }
      delete clone[account]
      dispatch(setImportToken(clone))
    },
    [importToken, dispatch],
  )

  return { getImportToken, saveImportToken, removeImportToken }
}

export function useSaveConnectedProfile() {
  const dispatch = useAppDispatch()
  const saveSignedAccount = useCallback(
    ({ account, method }: SignedAccountParams) => {
      dispatch(updateSignedAccount({ account, method }))
    },
    [dispatch],
  )
  return saveSignedAccount
}
