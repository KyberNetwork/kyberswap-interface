import { SessionData } from '@kybernetwork/oauth2'
import { useCallback } from 'react'
import { useSelector } from 'react-redux'

import { useActiveWeb3React } from 'hooks'
import { AppState } from 'state'
import { updatePossibleWalletAddress, updateProfile, updateSession } from 'state/authen/actions'
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

export function useSessionInfo(): [AuthenState, (data: SessionData) => void] {
  const dispatch = useAppDispatch()
  const { account } = useActiveWeb3React()
  const authen = useSelector((state: AppState) => state.authen)
  const isLogin = Boolean(authen.isLogin && account)
  const saveSession = useCallback(
    (data: SessionData) => {
      dispatch(updateSession(data))
    },
    [dispatch],
  )
  return [{ ...authen, isLogin }, saveSession]
}

export const useSaveUserProfile = () => {
  const dispatch = useAppDispatch()
  return useCallback(
    (value: UserProfile) => {
      dispatch(updateProfile(value))
    },
    [dispatch],
  )
}
