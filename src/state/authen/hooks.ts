import { useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'

import { AppState } from 'state'
import { setConfirmChangeProfile, updateConnectingWallet, updateProcessingLogin } from 'state/authen/actions'
import { AuthenState, UserProfile } from 'state/authen/reducer'
import { useAppDispatch } from 'state/hooks'

// connecting metamask ...
export function useIsConnectingWallet(): [boolean, (data: boolean) => void] {
  const dispatch = useAppDispatch()
  const connectingWallet = useSelector((state: AppState) => state.authen.isConnectingWallet)

  const setConnectedWallet = useCallback(
    (data: boolean) => {
      dispatch(updateConnectingWallet(data))
    },
    [dispatch],
  )

  return [connectingWallet, setConnectedWallet]
}

export type ConnectedProfile = {
  active: boolean
  address: string
  profile: UserProfile | undefined
  guest: boolean
  id: string
  default?: boolean
}

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
