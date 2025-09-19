import { useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'

import { AppState } from 'state'
import { AuthenState, AutoSignIn, UserProfile, authenActions } from 'state/authen/reducer'
import { useAppDispatch } from 'state/hooks'

const { setConfirmChangeProfile, updateProcessingLogin, setAutoSignIn } = authenActions

// info relate profile, session
export function useSessionInfo(): AuthenState & { userInfo: UserProfile | undefined } {
  const authen = useSelector((state: AppState) => state.authen)
  const userInfo = useMemo(
    () => (authen.isLogin ? authen.signedUserInfo : authen.anonymousUserInfo),
    [authen.signedUserInfo, authen.anonymousUserInfo, authen.isLogin],
  )
  return { ...authen, userInfo }
}

export const useSetPendingAuthentication = () => {
  const dispatch = useAppDispatch()
  return useCallback(
    (value: boolean) => {
      dispatch(updateProcessingLogin(value))
    },
    [dispatch],
  )
}

export const useSetConfirmChangeProfile = () => {
  const dispatch = useAppDispatch()
  return useCallback(
    (value: boolean) => {
      dispatch(setConfirmChangeProfile(value))
    },
    [dispatch],
  )
}

export function useIsAutoLoginAfterConnectWallet(): [AutoSignIn, (v: AutoSignIn) => void] {
  const dispatch = useAppDispatch()
  const autoSignIn = useSelector((state: AppState) => state.authen.autoSignIn)

  const setAutoSignInAfterConnect = useCallback(
    (data: AutoSignIn) => {
      dispatch(setAutoSignIn(data))
    },
    [dispatch],
  )

  return [autoSignIn, setAutoSignInAfterConnect]
}
