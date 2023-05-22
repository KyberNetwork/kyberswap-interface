import { useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useGetOrCreateProfileMutation } from 'services/identity'

import { useActiveWeb3React } from 'hooks'
import { AppState } from 'state'
import { updatePossibleWalletAddress, updateProcessingLogin, updateProfile } from 'state/authen/actions'
import { AuthenState, UserProfile } from 'state/authen/reducer'
import { useAppDispatch } from 'state/hooks'

export function useConnectedWallet(): [string | null | undefined, (data: string | null | undefined) => void] {
  const dispatch = useAppDispatch()
  const wallet = useSelector((state: AppState) => state.authen.possibleConnectedWalletAddress)

  const setConnectedWallet = useCallback(
    (data: string | null | undefined) => {
      dispatch(updatePossibleWalletAddress(data))
    },
    [dispatch],
  )

  return [wallet, setConnectedWallet]
}

export function useSessionInfo(): AuthenState & { formatUserInfo: UserProfile | undefined } {
  const { account } = useActiveWeb3React()
  const authen = useSelector((state: AppState) => state.authen)
  const isLogin = Boolean(authen.isLogin && account)
  const formatUserInfo = useMemo(
    () => (isLogin ? authen.userInfo : authen.anonymousUserInfo),
    [authen.userInfo, authen.anonymousUserInfo, isLogin],
  ) // todo rename
  return { ...authen, isLogin, formatUserInfo }
}

export const useSaveUserProfile = () => {
  const dispatch = useAppDispatch()
  return useCallback(
    ({ profile, isAnonymous = false }: { profile: UserProfile | undefined; isAnonymous?: boolean }) => {
      dispatch(updateProfile({ profile, isAnonymous }))
    },
    [dispatch],
  )
}

export const useRefreshProfile = () => {
  const setProfile = useSaveUserProfile()
  const [getProfile] = useGetOrCreateProfileMutation()
  return useCallback(
    async (isAnonymous: boolean) => {
      const profile = await getProfile().unwrap()
      setProfile({ profile, isAnonymous })
    },
    [getProfile, setProfile],
  )
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
